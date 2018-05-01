/*---------------------------------------------------------------------------------------------
|  $Copyright: (c) 2018 Bentley Systems, Incorporated. All rights reserved. $
 *--------------------------------------------------------------------------------------------*/
/** @module App */

/**
 * A set of "gates" that can enable or disable features at runtime. A gate can be any type,
 * e.g. boolean, string, number or even object. Generally they are established at startup, but may be
 * changed at runtime based, for example, on user credentials or server-based priorities, etc.
 *
 * A service typically gets its feature gates from its deployment parameters.
 * <p><em>Example:</em>
 * ```ts
 * [[include:FeatureGates.defineFeatureGates]]
 * ```
 * An example of the feature gate portion of a configuration .json file that is deployed with a service might be:
 * ``` json
 * {
 *   "features": {
 *      "readwrite": "${ROBOT-WORLD-FEATURE-READWRITE}",
 *      "experimentalMethods": "${ROBOT-WORLD-FEATURE-EXPERIMENTAL-METHODS}"
 *    }
 * }
 * ```
 *
 * Note how the values of the configuration properties are defined by placeholders, which are delimited by ${}.
 * Such placeholders will be replaced by EnvMacroSubst with the values of like-named environment variables.
 * That allows a deployment mechanism to supply the values for configuration parameters and inject them into
 * the service.
 *
 * A service then checks its feature gates in its methods.
 * <p><em>Example:</em>
 * ```ts
 * [[include:FeatureGates.checkFeatureGates]]
 * ```
 */
export class FeatureGates {
  private readonly gates: any = {};

  /**
   * Get the value of a potentially gated feature.
   * @param feature the name of the feature to check. May be a "path" of period-separated feature sub-groups (e.g. "feature1.groupA.showMe").
   * Feature names are case-sensitive.
   * @param defaultVal optionally, value to return if feature is undefined.
   */
  public check(feature: string, defaultVal?: any): any {
    if (feature.length === 0)
      return defaultVal;

    let gate: any = this.gates;
    for (const name of feature.split(".")) {
      gate = gate[name];
      if (typeof gate !== "object")
        break;
    }
    switch (typeof gate) {
      case "undefined":
        return defaultVal;
      case "object":
        return Object.assign(gate); // always return a copy of objects so caller doesn't accidentally change their value.
    }
    return gate;
  }

  /**
   * Gate access to a feature.
   * @param feature the name of the feature to gate. May be a "path" of period-separated feature sub-groups (e.g. "feature1.groupA.showMe").
   * Feature names are case-sensitive.
   * @param val value to set
   */
  public setGate(feature: string, val: any): void {
    if (feature.length === 0 || typeof val === "undefined")
      return;

    let gate: any = this.gates;
    const arr = feature.split(".");
    while (arr.length > 1) {
      const obj = gate[arr[0]];
      if (typeof obj !== "object")
        gate[arr[0]] = {};
      gate = gate[arr.shift()!];
    }

    gate[arr[0]] = val;
  }
}
