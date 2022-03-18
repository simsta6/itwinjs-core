/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import * as fs from "fs-extra";
import { extname, join } from "path";
import * as sinon from "sinon";
import { Guid } from "@itwin/core-bentley";
import { Range3d } from "@itwin/core-geometry";
import { IModelJsFs } from "../../IModelJsFs";
import { BaseSettings, SettingDictionary, SettingsPriority } from "../../workspace/Settings";
import { EditableWorkspaceDb, ITwinWorkspace, ITwinWorkspaceContainer, ITwinWorkspaceDb, WorkspaceContainerProps, WorkspaceDbProps } from "../../workspace/Workspace";
import { IModelTestUtils } from "../IModelTestUtils";
import { KnownTestLocations } from "../KnownTestLocations";

describe("WorkspaceFile", () => {

  const workspace = new ITwinWorkspace(new BaseSettings(), { containerDir: join(KnownTestLocations.outputDir, "TestWorkspaces") });

  function makeEditableDb(props: WorkspaceDbProps & WorkspaceContainerProps) {
    const container = workspace.getContainer(props);
    const wsFile = new EditableWorkspaceDb(props, container);

    IModelJsFs.purgeDirSync(container.filesDir);
    if (IModelJsFs.existsSync(wsFile.dbFileName))
      IModelJsFs.unlinkSync(wsFile.dbFileName);
    EditableWorkspaceDb.createEmpty(wsFile.dbFileName);
    wsFile.open();
    return wsFile;
  }

  function compareFiles(file1: string, file2: string) {
    expect(fs.lstatSync(file1).size).equal(fs.lstatSync(file2).size);
    expect(fs.readFileSync(file1)).to.deep.equal(fs.readFileSync(file2));
  }

  it("WorkspaceContainer names", () => {
    const expectBadName = (names: string[]) => {
      names.forEach((containerId) => {
        expect(() => new ITwinWorkspaceContainer(workspace, { containerId }), containerId).to.throw("containerId");
      });
    };

    expectBadName([
      "",
      "  ",
      "12", // too short
      "a\\b",
      `a"b`,
      "a:b",
      "a.b",
      "a?b",
      "a*b",
      "a|b",
      "123--4",
      "Abc",
      "return\r",
      "newline\n",
      "a".repeat(64), // too long
      "-leading-dash",
      "trailing-dash-"]);

    new ITwinWorkspaceContainer(workspace, { containerId: Guid.createValue() }); // guids should be valid
  });

  it("WorkspaceDbNames", () => {
    const container = new ITwinWorkspaceContainer(workspace, { containerId: "test" });
    const expectBadName = (names: string[]) => {
      names.forEach((dbName) => {
        expect(() => new ITwinWorkspaceDb({ dbName }, container)).to.throw("dbName");
      });
    };

    expectBadName([
      "",
      "  ",
      "1/2",
      "a\\b",
      `a"b`,
      "base:1.2.3",
      "a:b",
      "a.b",
      "a?b",
      "a*b",
      "a|b",
      "con",
      "prn",
      "return\r",
      "newline\n",
      "a".repeat(256), // too long
      " leading space",
      "trailing space "]);

    new ITwinWorkspaceDb({ dbName: Guid.createValue() }, container); // guids should be valid
  });

  it("create new WorkspaceDb", async () => {
    const wsFile = makeEditableDb({ containerId: "acme-engineering-inc-2", dbName: "db1" });
    const inFile = IModelTestUtils.resolveAssetFile("test.setting.json5");
    const testRange = new Range3d(1.2, 2.3, 3.4, 4.5, 5.6, 6.7);
    let blobVal = new Uint8Array(testRange.toFloat64Array().buffer);
    let strVal = "this is test1";
    const strRscName = "string-resource/1";
    const blobRscName = "blob.resource:1";
    const fileRscName = "settings files/my settings/a.json5";

    expect(() => wsFile.addFile(fileRscName, "bad file name")).to.throw("no such file");
    expect(() => wsFile.updateFile(fileRscName, inFile)).to.throw("error replacing");
    expect(() => wsFile.removeFile(fileRscName)).to.throw("does not exist");

    wsFile.addBlob(blobRscName, blobVal);
    wsFile.addString(strRscName, strVal);
    expect(wsFile.getString(strRscName)).equals(strVal);
    expect(wsFile.getBlob(blobRscName)).to.deep.equal(blobVal);
    strVal = "updated string";
    blobVal = Uint8Array.from([0, 1, 2, 3]);
    wsFile.updateString(strRscName, strVal);
    wsFile.updateBlob(blobRscName, blobVal);
    expect(wsFile.getString(strRscName)).equals(strVal);
    expect(wsFile.getBlob(blobRscName)).to.deep.equal(blobVal);

    wsFile.removeBlob(blobRscName);
    wsFile.removeString(strRscName);
    expect(wsFile.getString(strRscName)).to.be.undefined;
    expect(wsFile.getBlob(blobRscName)).to.be.undefined;

    wsFile.addFile(fileRscName, inFile);
    const writeFile = sinon.spy(wsFile.sqliteDb.nativeDb, "extractEmbeddedFile");
    expect(writeFile.callCount).eq(0);
    const outFile = wsFile.getFile(fileRscName)!;
    expect(writeFile.callCount).eq(1);
    expect(extname(outFile)).equals(".json5");
    compareFiles(inFile, outFile);

    let outFile2 = wsFile.getFile(fileRscName)!;
    expect(writeFile.callCount).eq(1);
    expect(outFile).eq(outFile2);

    const inFile2 = IModelTestUtils.resolveAssetFile("TestSettings.schema.json");
    wsFile.updateFile(fileRscName, inFile2);
    outFile2 = wsFile.getFile(fileRscName)!;
    expect(writeFile.callCount).eq(2);
    expect(outFile).eq(outFile2);
    compareFiles(inFile2, outFile);
  });

  it("resolve workspace alias", async () => {
    const settingsFile = IModelTestUtils.resolveAssetFile("test.setting.json5");
    const defaultDb = makeEditableDb({ containerId: "default", dbName: "db1" });
    defaultDb.addString("default-settings", fs.readFileSync(settingsFile, "utf-8"));
    defaultDb.close();

    const settings = workspace.settings;
    await workspace.loadSettingsDictionary({ rscName: "default-settings", containerId: "default", dbName: "db1" }, SettingsPriority.defaults);
    expect(settings.getSetting("editor/renderWhitespace")).equals("selection");

    const schemaFile = IModelTestUtils.resolveAssetFile("TestSettings.schema.json");
    const fontsDb = makeEditableDb({ containerId: "public-data-1", dbName: "fonts" });

    fontsDb.addFile("Helvetica.ttf", schemaFile, "ttf");
    fontsDb.close();

    interface FontDbs { dbName: string, containerName: string }
    const fontList = settings.getArray<FontDbs>("workspace/fontDbs")!;
    const containerId = workspace.resolveContainerName(fontList[0].containerName);
    const fonts = await workspace.getWorkspaceDb({ containerId, dbName: fontList[0].dbName });
    expect(fonts).to.not.be.undefined;
    const fontFile = fonts.getFile("Helvetica.ttf")!;
    expect(fontFile).contains(".ttf");
    compareFiles(fontFile, schemaFile);
    fonts.container.dropWorkspaceDb(fonts);

    const setting2: SettingDictionary = {
      "workspace/container/alias": [
        { name: "default-icons", id: "icons-01" },
        { name: "default-lang", id: "lang-05" },
        { name: "public-data", id: "fonts-02" },
        { name: "default-key", id: "key-05" },
      ],
    };
    settings.addDictionary("imodel-02", SettingsPriority.iModel, setting2);
    expect(workspace.resolveContainerName(fontList[0].containerName)).equals("fonts-02");
    expect(workspace.resolveContainerName("public-data-3")).equals("public-data-3");

    settings.dropDictionary("imodel-02");
    expect(workspace.resolveContainerName(fontList[0].containerName)).equals("public-data-1");
  });

});
