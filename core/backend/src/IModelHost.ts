/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
/** @module IModelHost */

import { BentleyStatus, IModelError, MobileRpcConfiguration, RpcConfiguration, SerializedRpcRequest } from "@bentley/imodeljs-common";
import { BeEvent, Logger, IModelStatus, GuidString, Guid, AuthStatus, ClientRequestContext, BentleyError } from "@bentley/bentleyjs-core";
import { Config, IModelClient, UrlDiscoveryClient, IAuthorizationClient, AccessToken, AuthorizedClientRequestContext, UserInfo } from "@bentley/imodeljs-clients";
import * as path from "path";
import { BisCore } from "./BisCore";
import { BriefcaseManager } from "./BriefcaseManager";
import { Functional } from "./domains/Functional";
import { Generic } from "./domains/Generic";
import { IModelJsFs } from "./IModelJsFs";
import { IModelJsNative } from "./IModelJsNative";
import { BackendRequestContext } from "./BackendRequestContext";
import { IModelReadRpcImpl } from "./rpc-impl/IModelReadRpcImpl";
import { IModelTileRpcImpl } from "./rpc-impl/IModelTileRpcImpl";
import { IModelWriteRpcImpl } from "./rpc-impl/IModelWriteRpcImpl";
import { SnapshotIModelRpcImpl } from "./rpc-impl/SnapshotIModelRpcImpl";
import { WipRpcImpl } from "./rpc-impl/WipRpcImpl";
import { initializeRpcBackend } from "./RpcBackend";
import * as os from "os";
import * as semver from "semver";

/** @hidden */
const loggingCategory = "imodeljs-backend.IModelHost";

/**
 * Configuration of imodeljs-backend.
 */
export class IModelHostConfiguration {
  /** The native platform to use -- normally, the app should leave this undefined. [[IModelHost.startup]] will set it to the appropriate nativePlatform automatically. */
  public nativePlatform?: any;

  private _briefcaseCacheDir = path.normalize(path.join(KnownLocations.tmpdir, "Bentley/IModelJs/cache/"));

  /** The path where the cache of briefcases are stored. Defaults to `path.join(KnownLocations.tmpdir, "Bentley/IModelJs/cache/iModels/")` */
  public get briefcaseCacheDir(): string { return this._briefcaseCacheDir; }
  public set briefcaseCacheDir(cacheDir: string) { this._briefcaseCacheDir = path.normalize(cacheDir.replace(/\/?$/, path.sep)); }

  /** The directory where the app's assets are found. */
  public appAssetsDir?: string;

  /** The kind of iModel server to use. Defaults to iModelHubClient */
  public imodelClient?: IModelClient;

  /** The time, in milliseconds, for which [IModelTileRpcInterface.requestTileTreeProps]($common) should wait before returning a "pending" status. */
  public tileTreeRequestTimeout = IModelHostConfiguration.defaultTileRequestTimeout;
  /** The time, in milliseconds, for which [IModelTileRpcInterface.requestTileContent]($common) should wait before returning a "pending" status. */
  public tileContentRequestTimeout = IModelHostConfiguration.defaultTileRequestTimeout;
  /** The default time, in milliseconds, used for [[tileTreeRequestTimeout]] and [[tileContentRequestTimeout]]. To change this, override one or both of those properties. */
  public static defaultTileRequestTimeout = 20 * 1000;
  /** If true, requests for tile content will execute on a separate thread pool in order to avoid blocking other, less expensive asynchronous requests such as ECSql queries. */
  public useTileContentThreadPool = false;
  /** If true, the add-on's sqlite tile cache database will not be read from or written to when requesting tile content.
   * ###TODO: Steve Wilson to replace with external cache configuration options.
   * @alpha
   */
  public disableInternalTileCache = false;
}

/**
 * IModelHost initializes ($backend) and captures its configuration. A backend must call [[IModelHost.startup]] before using any backend classes.
 * See [the learning article]($docs/learning/backend/IModelHost.md)
 */
export class IModelHost {
  private static _authorizationClient?: IAuthorizationClient;
  public static backendVersion = "";
  private static _platform?: typeof IModelJsNative;
  public static get platform(): typeof IModelJsNative { return this._platform!; }

  public static configuration?: IModelHostConfiguration;
  /** Event raised just after the backend IModelHost was started up */
  public static readonly onAfterStartup = new BeEvent<() => void>();

  /** Event raised just before the backend IModelHost is to be shut down */
  public static readonly onBeforeShutdown = new BeEvent<() => void>();

  /** A uniqueId for this backend session */
  public static sessionId: GuidString;

  /** The Id of this backend application - needs to be set only if it is an agent application. The applicationId
   * will otherwise originate at the frontend.
   */
  public static applicationId: string;

  /** The version of this backend application - needs to be set if is an agent application. The applicationVersion
   * will otherwise originate at the frontend.
   */
  public static applicationVersion: string;

  /** Implementation of [[IAuthorizationClient]] to supply the authorization information for this session - only required for backend applications */
  public static get authorizationClient(): IAuthorizationClient | undefined {
    return IModelHost._authorizationClient;
  }
  public static set authorizationClient(authorizationClient: IAuthorizationClient | undefined) {
    IModelHost._authorizationClient = authorizationClient;
  }

  /** Get the active authorization/access token for use with various services
   * @throws [[BentleyError]] if the access token cannot be obtained
   */
  public static async getAccessToken(requestContext: ClientRequestContext = new BackendRequestContext()): Promise<AccessToken> {
    requestContext.enter();
    if (!this.authorizationClient)
      throw new BentleyError(AuthStatus.Error, "No AuthorizationClient has been supplied to IModelHost", Logger.logError, loggingCategory);
    if (!this.authorizationClient.hasSignedIn)
      throw new BentleyError(AuthStatus.Error, "AuthorizationClient has not been used to sign in", Logger.logError, loggingCategory);
    return this.authorizationClient.getAccessToken(requestContext);
  }

  private static get _isNativePlatformLoaded(): boolean { return this._platform !== undefined; }

  private static registerPlatform(platform: typeof IModelJsNative, region: number): void {
    this._platform = platform;
    if (!platform)
      return;

    if (!Platform.isMobile)
      this.validateNativePlatformVersion();

    platform.logger = Logger;
    platform.initializeRegion(region);
  }

  private static validateNativePlatformVersion(): void {
    const requiredVersion = require("../package.json").dependencies["@bentley/imodeljs-native"];
    const thisVersion = this.platform.version;
    if (semver.satisfies(thisVersion, requiredVersion))
      return;
    if (IModelJsFs.existsSync(path.join(__dirname, "DevBuild.txt"))) {
      console.log("Bypassing version checks for development build"); // tslint:disable-line:no-console
      return;
    }
    this._platform = undefined;
    throw new IModelError(IModelStatus.BadRequest, "imodeljs-native version is (" + thisVersion + "). imodeljs-backend requires version (" + requiredVersion + ")");
  }

  private static validateNodeJsVersion(): void {
    const requiredVersion = require("../package.json").engines.node;
    if (!semver.satisfies(process.version, requiredVersion)) {
      throw new IModelError(IModelStatus.BadRequest, `Node.js version ${process.version} is not within the range acceptable to imodeljs-backend: (${requiredVersion})`);
    }
    return;
  }

  private static getApplicationVersion(): string {
    return require("../package.json").version;
  }

  private static _setupRpcRequestContext() {
    RpcConfiguration.requestContext.deserialize = async (serializedContext: SerializedRpcRequest): Promise<ClientRequestContext> => {
      if (!serializedContext.authorization)
        return new ClientRequestContext(serializedContext.id, serializedContext.applicationId, serializedContext.applicationVersion, serializedContext.sessionId);

      const accessToken = AccessToken.fromTokenString(serializedContext.authorization);
      const userId = serializedContext.userId; // Really needed only for JWTs
      if (!userId)
        throw new BentleyError(AuthStatus.Error, "UserId needs to be passed into the backend", Logger.logError);
      accessToken.setUserInfo(new UserInfo(userId));

      return new AuthorizedClientRequestContext(accessToken, serializedContext.id, serializedContext.applicationId, serializedContext.applicationVersion, serializedContext.sessionId);
    };
  }

  /** @hidden */
  public static loadNative(region: number, dir?: string): void { this.registerPlatform(Platform.load(dir), region); }

  /** This method must be called before any iModel.js services are used.
   * @param configuration Host configuration data.
   * Raises [[onAfterStartup]].
   * @see [[shutdown]].
   */
  public static startup(configuration: IModelHostConfiguration = new IModelHostConfiguration()) {
    if (IModelHost.configuration)
      throw new IModelError(BentleyStatus.ERROR, "startup may only be called once", Logger.logError, loggingCategory, () => (configuration));

    IModelHost.sessionId = Guid.createValue();

    // Setup a current context for all requests that originate from this backend
    const requestContext = new BackendRequestContext();
    requestContext.enter();

    if (!MobileRpcConfiguration.isMobileBackend) {
      this.validateNodeJsVersion();
    }
    this.backendVersion = require("../package.json").version;
    initializeRpcBackend();

    const region: number = Config.App.getNumber(UrlDiscoveryClient.configResolveUrlUsingRegion, 0);
    if (!this._isNativePlatformLoaded) {
      try {
        if (configuration.nativePlatform !== undefined)
          this.registerPlatform(configuration.nativePlatform, region);
        else
          this.loadNative(region);
      } catch (error) {
        Logger.logError(loggingCategory, "Error registering/loading the native platform API", () => (configuration));
        throw error;
      }
    }

    if (configuration.imodelClient)
      BriefcaseManager.imodelClient = configuration.imodelClient;

    IModelHost._setupRpcRequestContext();

    IModelReadRpcImpl.register();
    IModelTileRpcImpl.register();
    IModelWriteRpcImpl.register();
    SnapshotIModelRpcImpl.register();
    WipRpcImpl.register();

    BisCore.registerSchema();
    Generic.registerSchema();
    Functional.registerSchema();

    IModelHost.configuration = configuration;

    if (!IModelHost.applicationId) IModelHost.applicationId = "2686"; // Default to product id of iModel.js
    if (!IModelHost.applicationVersion) IModelHost.applicationVersion = this.getApplicationVersion(); // Default to version of this package

    // ###TODO: Steve to replace this simple boolean flag with configuration options for tile cache residing outside of add-on, and disable the add-on's cache
    // if external cache is configured.
    if (undefined !== this._platform)
      this._platform.setUseTileCache(!configuration.disableInternalTileCache);

    IModelHost.onAfterStartup.raiseEvent();
  }

  /** This method must be called when an iModel.js services is shut down. Raises [[onBeforeShutdown]] */
  public static shutdown() {
    if (!IModelHost.configuration)
      return;
    IModelHost.onBeforeShutdown.raiseEvent();
    IModelHost.configuration = undefined;
  }

  /** The directory where the app's assets may be found */
  public static get appAssetsDir(): string | undefined {
    return (IModelHost.configuration === undefined) ? undefined : IModelHost.configuration.appAssetsDir;
  }

  /** The time, in milliseconds, for which [IModelTileRpcInterface.requestTileTreeProps]($common) should wait before returning a "pending" status. */
  public static get tileTreeRequestTimeout(): number {
    return undefined !== IModelHost.configuration ? IModelHost.configuration.tileTreeRequestTimeout : IModelHostConfiguration.defaultTileRequestTimeout;
  }
  /** The time, in milliseconds, for which [IModelTileRpcInterface.requestTileContent]($common) should wait before returning a "pending" status. */
  public static get tileContentRequestTimeout(): number {
    return undefined !== IModelHost.configuration ? IModelHost.configuration.tileContentRequestTimeout : IModelHostConfiguration.defaultTileRequestTimeout;
  }

  /** If true, requests for tile content will execute on a separate thread pool in order to avoid blocking other, less expensive asynchronous requests such as ECSql queries. */
  public static get useTileContentThreadPool(): boolean { return undefined !== IModelHost.configuration && IModelHost.configuration.useTileContentThreadPool; }
}

/** Information about the platform on which the app is running. Also see [[KnownLocations]] and [[IModelJsFs]]. */
export class Platform {
  /** The imodeljs mobile info object, if this is running in the imodeljs mobile platform. */
  public static get imodeljsMobile(): any { return (typeof (self) !== "undefined") ? (self as any).imodeljsMobile : undefined; }

  /** Get the name of the platform. Possible return values are: "win32", "linux", "darwin", "ios", "android", or "uwp". */
  public static get platformName(): string {

    if (Platform.isMobile) {
      // TBD: Platform.imodeljsMobile.platform should indicate which mobile platform this is.
      return "iOS";
    }
    // This is node or electron. See what underlying OS we are on:
    return process.platform;
  }

  /** The Electron info object, if this is running in Electron. */
  public static get electron(): any { return ((typeof (process) !== "undefined") && ("electron" in process.versions)) ? require("electron") : undefined; }

  /** Query if this is a desktop configuration */
  public static get isDesktop(): boolean { return Platform.electron !== undefined; }

  /** Query if this is a mobile configuration */
  public static get isMobile(): boolean { return Platform.imodeljsMobile !== undefined; }

  /** Query if this is running in Node.js  */
  public static get isNodeJs(): boolean { return !Platform.isMobile; } // currently we use nodejs for all non-mobile backend apps

  public static load(dir?: string): typeof IModelJsNative {
    return this.isMobile ? this.imodeljsMobile.imodeljsNative : // we are running on a mobile platform
      require("@bentley/imodeljs-native/loadNativePlatform.js").loadNativePlatform(dir); // We are running in node or electron.
  }
}

/** Well known directories that may be used by the app. Also see [[Platform]] */
export class KnownLocations {

  /** The directory where the imodeljs-native assets are stored. */
  public static get nativeAssetsDir(): string { return IModelHost.platform.DgnDb.getAssetsDir(); }

  /** The directory where the imodeljs-backend assets are stored. */
  public static get packageAssetsDir(): string {
    const imodeljsMobile = Platform.imodeljsMobile;
    if (imodeljsMobile !== undefined) {
      return path.join(imodeljsMobile.knownLocations.packageAssetsDir, "imodeljs-backend");
    }

    // Assume that we are running in nodejs
    return path.join(__dirname, "assets");
  }

  /** The temp directory. */
  public static get tmpdir(): string {
    const imodeljsMobile = Platform.imodeljsMobile;
    if (imodeljsMobile !== undefined) {
      return imodeljsMobile.knownLocations.tempDir;
    }

    // Assume that we are running in nodejs
    return os.tmpdir();
  }
}
