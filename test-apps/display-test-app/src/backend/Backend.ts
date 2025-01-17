/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";
import { Logger, LogLevel, ProcessDetector } from "@itwin/core-bentley";
import { ElectronMainAuthorization } from "@itwin/electron-authorization/lib/cjs/ElectronMain";
import { ElectronHost, ElectronHostOptions } from "@itwin/core-electron/lib/cjs/ElectronBackend";
import { BackendIModelsAccess } from "@itwin/imodels-access-backend";
import { IModelsClient } from "@itwin/imodels-client-authoring";
import { IModelHost, IModelHostOptions, LocalhostIpcHost } from "@itwin/core-backend";
import {
  AuthorizationClient,
  IModelReadRpcInterface, IModelTileRpcInterface, RpcInterfaceDefinition, RpcManager,
  SnapshotIModelRpcInterface,
} from "@itwin/core-common";
import { MobileHost, MobileHostOpts } from "@itwin/core-mobile/lib/cjs/MobileBackend";
import { TestBrowserAuthorizationClient } from "@itwin/oidc-signin-tool";
import { DtaConfiguration, getConfig } from "../common/DtaConfiguration";
import { DtaRpcInterface } from "../common/DtaRpcInterface";
import { FakeTileCacheService } from "./FakeTileCacheService";
import { EditCommandAdmin } from "@itwin/editor-backend";
import * as editorBuiltInCommands from "@itwin/editor-backend";
// import { ServiceAuthorizationClient } from "@itwin/service-authorization";

/** Loads the provided `.env` file into process.env */
function loadEnv(envFile: string) {
  if (!fs.existsSync(envFile))
    return;

  const dotenv = require("dotenv"); // eslint-disable-line @typescript-eslint/no-var-requires
  const dotenvExpand = require("dotenv-expand"); // eslint-disable-line @typescript-eslint/no-var-requires
  const envResult = dotenv.config({ path: envFile });
  if (envResult.error) {
    throw envResult.error;
  }

  dotenvExpand(envResult);
}

class DisplayTestAppRpc extends DtaRpcInterface {

  public override async readExternalSavedViews(bimFileName: string): Promise<string> {
    if (ProcessDetector.isMobileAppBackend && process.env.DOCS) {
      const docPath = process.env.DOCS;
      bimFileName = path.join(docPath, bimFileName);
    }

    const esvFileName = this.createEsvFilename(bimFileName);
    if (!fs.existsSync(esvFileName))
      return "";

    const jsonStr = fs.readFileSync(esvFileName).toString();
    return jsonStr ?? "";
  }

  public override async writeExternalSavedViews(bimFileName: string, namedViews: string): Promise<void> {
    if (ProcessDetector.isMobileAppBackend && process.env.DOCS) {
      // Used to set a writeable directory on an iOS or Android device.
      const docPath = process.env.DOCS;
      bimFileName = path.join(docPath, bimFileName);
    }

    const esvFileName = this.createEsvFilename(bimFileName);
    return this.writeExternalFile(esvFileName, namedViews);
  }

  public override async readExternalCameraPaths(bimFileName: string): Promise<string> {
    if (ProcessDetector.isMobileAppBackend && process.env.DOCS) {
      const docPath = process.env.DOCS;
      bimFileName = path.join(docPath, bimFileName);
    }

    const cameraPathsFileName = this.createCameraPathsFilename(bimFileName);
    if (!fs.existsSync(cameraPathsFileName))
      return "";

    const jsonStr = fs.readFileSync(cameraPathsFileName).toString();
    return jsonStr ?? "";
  }

  public override async writeExternalCameraPaths(bimFileName: string, cameraPaths: string): Promise<void> {
    if (ProcessDetector.isMobileAppBackend && process.env.DOCS) {
      // Used to set a writeable directory on an iOS or Android device.
      const docPath = process.env.DOCS;
      bimFileName = path.join(docPath, bimFileName);
    }

    const cameraPathsFileName = this.createCameraPathsFilename(bimFileName);
    return this.writeExternalFile(cameraPathsFileName, cameraPaths);
  }

  public override async readExternalFile(txtFileName: string): Promise<string> {
    if (ProcessDetector.isMobileAppBackend && process.env.DOCS) {
      const docPath = process.env.DOCS;
      txtFileName = path.join(docPath, txtFileName);
    }

    const dataFileName = this.createTxtFilename(txtFileName);
    if (!fs.existsSync(dataFileName))
      return "";

    const contents = fs.readFileSync(dataFileName).toString();
    return contents ?? "";
  }

  public override async writeExternalFile(fileName: string, content: string): Promise<void> {
    const filePath = this.getFilePath(fileName);
    if (!fs.existsSync(filePath))
      this.createFilePath(filePath);

    if (fs.existsSync(fileName))
      fs.unlinkSync(fileName);

    fs.writeFileSync(fileName, content);
  }

  private createFilePath(filePath: string) {
    const files = filePath.split(/\/|\\/); // /\.[^/.]+$/ // /\/[^\/]+$/
    let curFile = "";
    for (const file of files) {
      if (file === "")
        break;

      curFile += `${file}\\`;
      if (!fs.existsSync(curFile))
        fs.mkdirSync(curFile);
    }
  }

  private getFilePath(fileName: string): string {
    const slashIndex = fileName.lastIndexOf("/");
    const backSlashIndex = fileName.lastIndexOf("\\");
    if (slashIndex > backSlashIndex)
      return fileName.substring(0, slashIndex);
    else
      return fileName.substring(0, backSlashIndex);
  }

  private createEsvFilename(fileName: string): string {
    const dotIndex = fileName.lastIndexOf(".");
    if (-1 !== dotIndex)
      return `${fileName.substring(0, dotIndex)}_ESV.json`;
    return `${fileName}.sv`;
  }

  private createCameraPathsFilename(fileName: string): string {
    const dotIndex = fileName.lastIndexOf(".");
    if (-1 !== dotIndex)
      return `${fileName.substring(0, dotIndex)}_cameraPaths.json`;
    return `${fileName}.cameraPaths.json`;
  }

  private createTxtFilename(fileName: string): string {
    const dotIndex = fileName.lastIndexOf(".");
    if (-1 === dotIndex)
      return `${fileName}.txt`;
    return fileName;
  }

  public override async getEnvConfig(): Promise<DtaConfiguration> {
    return getConfig();
  }

  public override async terminate() {
    await IModelHost.shutdown();

    // Electron only
    try {
      const { app } = require("electron"); // eslint-disable-line @typescript-eslint/no-var-requires
      if (app !== undefined) app.exit();
    } catch {

    }

    // Browser only
    if (DtaRpcInterface.backendServer) DtaRpcInterface.backendServer.close();
  }

  public override async getAccessToken(): Promise<string> {
    return (await IModelHost.authorizationClient?.getAccessToken()) ?? "";
  }
}

export const getRpcInterfaces = (): RpcInterfaceDefinition[] => {
  const rpcs: RpcInterfaceDefinition[] = [
    DtaRpcInterface,
    IModelReadRpcInterface,
    IModelTileRpcInterface,
    SnapshotIModelRpcInterface,
  ];

  return rpcs;
};

export const loadBackendConfig = (): DtaConfiguration => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // (needed temporarily to use self-signed cert to communicate with iModelBank via https)
  loadEnv(path.join(__dirname, "..", "..", ".env"));
  loadEnv(path.join(__dirname, "..", "..", ".env.local"));

  return getConfig();
};

export const initializeDtaBackend = async (hostOpts?: ElectronHostOptions & MobileHostOpts) => {
  const dtaConfig = loadBackendConfig();

  const iModelHost: IModelHostOptions = {};
  iModelHost.logTileLoadTimeThreshold = 3;
  iModelHost.logTileSizeThreshold = 500000;

  const iModelClient = new IModelsClient({ api: { baseUrl: `https://${process.env.IMJS_URL_PREFIX ?? ""}api.bentley.com/imodels` } });
  iModelHost.hubAccess = new BackendIModelsAccess(iModelClient);

  if (dtaConfig.useFakeCloudStorageTileCache)
    iModelHost.tileCacheService = new FakeTileCacheService(path.normalize(path.join(__dirname, "tiles")), "http://localhost:3001"); // puts the cache in "./lib/backend/tiles" and serves them from "http://localhost:3001/tiles"

  let logLevel = LogLevel.None;
  if (undefined !== dtaConfig.logLevel)
    logLevel = Logger.parseLogLevel(dtaConfig.logLevel);

  const opts = {
    iModelHost,
    electronHost: hostOpts,
    nativeHost: {
      applicationName: "display-test-app",
    },
    mobileHost: hostOpts?.mobileHost,
    localhostIpcHost: {
      noServer: true,
    },
  };

  /** register the implementation of our RPCs. */
  RpcManager.registerImpl(DtaRpcInterface, DisplayTestAppRpc);
  opts.iModelHost.cacheDir = process.env.IMJS_BRIEFCASE_CACHE_LOCATION;
  const authClient = await initializeAuthorizationClient();
  if (authClient !== undefined) {
    opts.iModelHost.authorizationClient = authClient;
  }
  if (ProcessDetector.isElectronAppBackend) {
    await ElectronHost.startup(opts);
    if (authClient instanceof ElectronMainAuthorization)
      await authClient.signInSilent();
    EditCommandAdmin.registerModule(editorBuiltInCommands);
  } else if (ProcessDetector.isMobileAppBackend) {
    await MobileHost.startup(opts);
  } else {
    await LocalhostIpcHost.startup(opts);
    EditCommandAdmin.registerModule(editorBuiltInCommands);
  }

  // Set up logging (by default, no logging is enabled)
  Logger.initializeToConsole();
  Logger.setLevelDefault(logLevel);
  Logger.setLevel("SVT", LogLevel.Trace);
};

async function initializeAuthorizationClient(): Promise<AuthorizationClient | undefined> {
  if (process.env.IMJS_OIDC_HEADLESS) {
    if (checkEnvVars(
      "IMJS_OIDC_CLIENT_ID",
      "IMJS_OIDC_SCOPE",
      "IMJS_OIDC_EMAIL",
      "IMJS_OIDC_PASSWORD"
    )) {
      // test-only authorization client with credentials from the environment.
      return new TestBrowserAuthorizationClient({
        clientId: process.env.IMJS_OIDC_CLIENT_ID!,
        redirectUri: process.env.IMJS_OIDC_REDIRECT_URI ?? "http://localhost:3000/signin-callback",
        scope: process.env.IMJS_OIDC_SCOPE!,
        clientSecret: process.env.IMJS_OIDC_CLIENT_SECRET,
      }, {
        email: process.env.IMJS_OIDC_EMAIL!,
        password: process.env.IMJS_OIDC_PASSWORD!,
      });
    } else if (checkEnvVars(
      "IMJS_OIDC_CLIENT_ID",
      "IMJS_OIDC_CLIENT_SECRET",
      "IMJS_OIDC_SCOPE",
    )) {
      // TODO: This throws a weird exception at run-time (ServiceAuthorizationClient is unable to load @itwin/core-bentley).
      return undefined;
      // // Setup a client using the service authorization workflow.
      // return new ServiceAuthorizationClient({
      //   clientId: process.env.IMJS_OIDC_CLIENT_ID!,
      //   clientSecret: process.env.IMJS_OIDC_CLIENT_SECRET!,
      //   scope: process.env.IMJS_OIDC_SCOPE!,
      //   authority: process.env.IMJS_OIDC_AUTHORITY,
      // });
    }
  } else if (checkEnvVars("IMJS_OIDC_CLIENT_ID", "IMJS_OIDC_SCOPE")) {
    if (ProcessDetector.isElectronAppBackend) {
      return new ElectronMainAuthorization({
        clientId: process.env.IMJS_OIDC_CLIENT_ID!,
        scope: process.env.IMJS_OIDC_SCOPE!,
        redirectUri: process.env.IMJS_OIDC_REDIRECT_URI ?? "http://localhost:3000/signin-callback",
      });
    }
  }
  // Note: Mobile's default auth client works, and will be used if we get here on mobile.
  return undefined;
}

/**
 * Logs a warning if only some are provided
 * @returns true if all are provided, false if any missing.
 */
function checkEnvVars(...keys: Array<string>): boolean {
  const missing = keys.filter((name) => process.env[name] === undefined);
  if (missing.length === 0) {
    return true;
  }
  if (missing.length < keys.length) { // Some missing, warn
    // eslint-disable-next-line no-console
    console.log(`Skipping auth setup due to missing: ${missing.join(", ")}`);
  }
  return false;
}
