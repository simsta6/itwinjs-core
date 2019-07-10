/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
/** @module WebGL */

import {
  ProgramBuilder,
  FragmentShaderComponent,
} from "../ShaderBuilder";
import { addFrustum } from "./Common";

const computeSimpleLighting = `
void computeSimpleLight (inout float diffuse, inout float specular, vec3 normal, vec3 toEye, vec3 lightDir, float lightIntensity, float specularExponent) {
  diffuse += lightIntensity * max(dot(normal, lightDir), 0.0);
  vec3 toReflectedLight = normalize(reflect(lightDir, normal));
  float specularDot = max(dot(toReflectedLight, toEye), 0.0);
  specular += lightIntensity * pow(specularDot, specularExponent);
}
`;

// mat_weights: x=diffuse y=specular z=ambient
const applyLighting = `
  if (isSurfaceBitSet(kSurfaceBit_ApplyLighting) && baseColor.a > 0.0) {
    // Lighting algorithms written in terms of non-pre-multiplied alpha...
    float alpha = baseColor.a;
    baseColor.rgb /= alpha;

    // negate normal if not front-facing
    vec3 normal = normalize(v_n.xyz);
    normal *= 2.0 * float(gl_FrontFacing) - 1.0;
    vec3 toEye = mix(vec3(0.0, 0.0, -1.0), normalize(v_eyeSpace.xyz), float(kFrustumType_Perspective == u_frustum.z));

    float useDefaults = extractSurfaceBit(kSurfaceBit_IgnoreMaterial);
    const vec4 defaultSpecular = vec4(1.0, 1.0, 1.0, 43.2); // rgb, exponent
    vec4 specular = mix(mat_specular, defaultSpecular, useDefaults);
    vec3 specularColor = specular.rgb;
    float specularExp = specular.a;

    const vec3 defaultWeights = vec3(.6, .4, .2);
    vec3 weights = mix(mat_weights, defaultWeights, useDefaults);
    float diffuseWeight = weights.r;
    float specularWeight = weights.g;
    float ambientWeight = 1.0; // ###TODO weights.b;

    vec3 litColor = vec3(0.0);

    float diffuseIntensity = 0.0, specularIntensity = 0.0;

    // Use a pair of lights that is something in-between portrait lighting & something more out-doorsy with a slightly more overhead main light.
    // This will make more sense in a wider variety of scenes since this is the only lighting currently supported.
    computeSimpleLight (diffuseIntensity, specularIntensity, normal, toEye, normalize(vec3(0.2, 0.5, 0.5)), 1.0, specularExp);
    computeSimpleLight (diffuseIntensity, specularIntensity, normal, toEye, normalize(vec3(-0.3, 0.0, 0.3)), .30, specularExp);

    const float directionalIntensity = 0.92;
    const float ambientIntensity = 0.2;
    litColor += directionalIntensity * diffuseWeight * diffuseIntensity * baseColor.rgb + specularIntensity * specularWeight * specularColor;
    litColor.rgb += (ambientIntensity * ambientWeight) * baseColor.rgb;

    // Clamp while preserving hue.
    float maxIntensity = max(litColor.r, max(litColor.g, litColor.b));

    baseColor.rgb = litColor / max(1.0, maxIntensity);

    // Restore pre-multiplied alpha...
    baseColor.rgb *= alpha;
  }

  return baseColor;
`;

/** NB: addMaterial() sets up the mat_* variables used by applyLighting.
 * @internal
 */
export function addLighting(builder: ProgramBuilder) {
  addFrustum(builder);

  const frag = builder.frag;

  frag.addFunction(computeSimpleLighting);
  frag.set(FragmentShaderComponent.ApplyLighting, applyLighting);
}
