/*---------------------------------------------------------------------------------------------
|  $Copyright: (c) 2018 Bentley Systems, Incorporated. All rights reserved. $
 *--------------------------------------------------------------------------------------------*/
import { PointUtil, QPoint3dList, QPoint2dList, QParams3d, QParams2d } from "@bentley/imodeljs-common";
import { XY, XYZ } from "@bentley/geometry-core";

export const enum ContextState {
  Uninitialized,
  Success,
  Error,
}

/** Describes the type of a render target. Used by Capabilities to represent maximum precision render target available on host system. */
export const enum RenderType {
  TextureUnsignedByte,
  TextureHalfFloat,
  TextureFloat,
}

/**
 * Describes the type of a depth buffer. Used by Capabilities to represent maximum depth buffer precision available on host system.
 * Note: the commented-out values are unimplemented but left in place for reference, in case desired for future implementation.
 */
export const enum DepthType {
  RenderBufferUnsignedShort16,     // core to WebGL1
  // TextureUnsignedShort16,       // core to WebGL2; available to WebGL1 via WEBGL_depth_texture
  // TextureUnsignedInt24,         // core to WebGL2
  // TextureUnsignedInt24Stencil8, // core to WebGL2; available to WebGL1 via WEBGL_depth_texture
  TextureUnsignedInt32,            // core to WebGL2; available to WebGL1 via WEBGL_depth_texture
  // TextureFloat32,               // core to WebGL2
  // TextureFloat32Stencil8,       // core to WeBGL2
}

/** Describes the rendering capabilities of the host system. */
export class Capabilities {
  private _maxRenderType: RenderType = RenderType.TextureUnsignedByte;
  private _maxDepthType: DepthType = DepthType.RenderBufferUnsignedShort16;
  private _maxTextureSize: number = 0;
  private _maxColorAttachments: number = 0;
  private _maxDrawBuffers: number = 0;
  private _maxFragTextureUnits: number = 0;
  private _maxVertTextureUnits: number = 0;
  private _maxVertAttribs: number = 0;
  private _maxVertUniformVectors: number = 0;
  private _maxVaryingVectors: number = 0;
  private _maxFragUniformVectors: number = 0;

  private _extensionMap: {[key: string]: object | undefined} = {}; // Use this map to store actual extension objects retrieved from GL.

  public get maxRenderType(): RenderType { return this._maxRenderType; }
  public get maxDepthType(): DepthType { return this._maxDepthType; }
  public get maxTextureSize(): number { return this._maxTextureSize; }
  public get maxColorAttachments(): number { return this._maxColorAttachments; }
  public get maxDrawBuffers(): number { return this._maxDrawBuffers; }
  public get maxFragTextureUnits(): number { return this._maxFragTextureUnits; }
  public get maxVertTextureUnits(): number { return this._maxVertTextureUnits; }
  public get maxVertAttribs(): number { return this._maxVertAttribs; }
  public get maxVertUniformVectors(): number { return this._maxVertUniformVectors; }
  public get maxVaryingVectors(): number { return this._maxVaryingVectors; }
  public get maxFragUniformVectors(): number { return this._maxFragUniformVectors; }

  /** These getters check for existence of extension objects to determine availability of features.  In WebGL2, could just return true for some. */
  public get supportsNonPowerOf2Textures(): boolean { return this.queryExtensionObject("OES_texture_npot") != null; }
  public get supportsDrawBuffers(): boolean { return this.queryExtensionObject("WEBGL_draw_buffers") != null; }
  public get supports32BitElementIndex(): boolean { return this.queryExtensionObject("OES_element_index_uint") != null; }
  public get supportsTextureFloat(): boolean { return this.queryExtensionObject("OES_texture_float") != null; }
  public get supportsTextureHalfFloat(): boolean { return this.queryExtensionObject("OES_texture_half_float") != null; }
  public get supportsShaderTextureLOD(): boolean { return this.queryExtensionObject("EXT_shader_texture_lod") != null; }

  /** Queries an extension object if available.  This is necessary for other parts of the system to access some constants within extenisons. */
  public queryExtensionObject<T>(ext: string): T | undefined { return this._extensionMap[ext] as T | undefined; }

  /** Initializes the capabilities based on a GL context. Must be called first. */
  public init(canvas: HTMLCanvasElement): boolean {
    const gl = canvas.getContext("webgl"); // ###TODO: this should be passed in, not created here!
    if (!gl) return false;

    this._maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    this._maxFragTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    this._maxVertTextureUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
    this._maxVertAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    this._maxVertUniformVectors = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
    this._maxVaryingVectors = gl.getParameter(gl.MAX_VARYING_VECTORS);
    this._maxFragUniformVectors = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);

    const extensions = gl.getSupportedExtensions(); // This just retrieves a list of available extensions (not necessarily enabled).
    if (extensions) {
      for (const ext of extensions) {
        if (ext === "OES_texture_npot" || ext === "WEBGL_draw_buffers" || ext === "OES_element_index_uint" || ext === "OES_texture_float" ||
            ext === "OES_texture_half_float" || ext === "WEBGL_depth_texture" || ext === "EXT_color_buffer_float" ||
            ext === "EXT_shader_texture_lod") {
          const extObj: any = gl.getExtension(ext); // This call enables the extension and returns a WebGLObject containing extension instance.
          this._extensionMap[ext] = (null != extObj) ? extObj : undefined;
        }
      }
    }

    const dbExt: WEBGL_draw_buffers | undefined = this.queryExtensionObject<WEBGL_draw_buffers>("WEBGL_draw_buffers");
    this._maxColorAttachments = dbExt !== undefined ? gl.getParameter(dbExt.MAX_COLOR_ATTACHMENTS_WEBGL) : 1;
    this._maxDrawBuffers = dbExt !== undefined ? gl.getParameter(dbExt.MAX_DRAW_BUFFERS_WEBGL) : 1;

    // Determine the maximum color-renderable attachment type.
    if (this.isTextureRenderable(gl, gl.FLOAT))
      this._maxRenderType = RenderType.TextureFloat;
    else {
      const hfExt: OES_texture_half_float | undefined = this.queryExtensionObject<OES_texture_half_float>("OES_texture_half_float");
      this._maxRenderType = (hfExt !== undefined && this.isTextureRenderable(gl, hfExt.HALF_FLOAT_OES)) ? RenderType.TextureHalfFloat : RenderType.TextureUnsignedByte;
    }

    // Determine the maximum depth attachment type.
    this._maxDepthType = this.queryExtensionObject("WEBGL_depth_texture") !== undefined ? DepthType.TextureUnsignedInt32 : DepthType.RenderBufferUnsignedShort16;

    return this.supportsDrawBuffers && this.supports32BitElementIndex; // Return based on currently-required features.  Could change in future.
  }

  /** Determines if a particular texture type is color-renderable on the host system. */
  private isTextureRenderable(gl: WebGLRenderingContext, texType: number): boolean {
    const tex: WebGLTexture | null = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, texType, null);

    const fb: WebGLFramebuffer | null = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

    const fbStatus: number = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.deleteFramebuffer(fb);
    gl.deleteTexture(tex);

    gl.getError(); // clear any errors

    return fbStatus === gl.FRAMEBUFFER_COMPLETE;
  }
}

export class ViewportQuad {
  public readonly vertices = new QPoint3dList();
  public readonly indices = new Uint32Array(6);
  constructor() {
    const vertices = PointUtil.fromNumberArrays([-1, -1, 0], [1, -1, 0], [1, 1, 0], [-1, 1, 0]) as XYZ[];
    this.vertices.assign(vertices, QParams3d.fromNormalizedRange());
    this.indices[0] = 0;
    this.indices[1] = 1;
    this.indices[2] = 2;
    this.indices[3] = 0;
    this.indices[4] = 2;
    this.indices[5] = 3;
  }
}

export class TexturedViewportQuad extends ViewportQuad {
  public readonly textureUV = new QPoint2dList();
  constructor() {
    super();
    const textureUVPts = PointUtil.fromNumberArrays([0, 0], [1, 0], [1, 1], [0, 1]) as XY[];
    this.textureUV.assign(textureUVPts, QParams2d.fromDefaultRange());
  }
}
