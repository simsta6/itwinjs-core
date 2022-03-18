/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import { join } from "path";
import { BaseSettings, CloudSqlite, EditableWorkspaceDb, IModelHost, ITwinWorkspace, SettingsPriority } from "@itwin/core-backend";
import { assert } from "@itwin/core-bentley";
import { CloudSqliteTest } from "./CloudSqlite.test";

describe("Cloud workspace containers", () => {

  async function initializeContainer(containerId: string) {
    const cloudCont1 = CloudSqliteTest.makeCloudSqliteContainer(containerId, false);
    await CloudSqliteTest.initializeContainers([cloudCont1]);
  }
  it("cloud workspace", async () => {

    const containerId = "test-1-2-3";
    const containerDict = {
      "cloudSqlite/accountProps": CloudSqliteTest.storage,
      "cloudSqlite/containerId": containerId,
    };

    const workspace1 = new ITwinWorkspace(new BaseSettings(), { containerDir: join(IModelHost.cacheDir, "TestWorkspace1"), cloudCache: { name: "test1", clearContents: true } });
    const workspace2 = new ITwinWorkspace(new BaseSettings(), { containerDir: join(IModelHost.cacheDir, "TestWorkspace2"), cloudCache: { name: "test2", clearContents: true } });
    const settings = workspace1.settings;
    settings.addDictionary("containers", SettingsPriority.application, containerDict);

    const testDbName = "testDb";

    await initializeContainer(containerId);
    const wsCont1 = workspace1.getContainer({ ...CloudSqliteTest.storage, containerId, writeable: true, sasToken: CloudSqliteTest.makeSasToken(containerId, "rwadl") });

    const makeVersion = async (version?: string) => {
      assert(undefined !== wsCont1.cloudContainer);
      await CloudSqlite.withWriteLock("Cloud workspace test", wsCont1.cloudContainer, async () => {
        const wsDbEdit = new EditableWorkspaceDb({ dbName: testDbName }, wsCont1);
        try {
          await wsDbEdit.createDb(version);
          const account1 = settings.getObject<CloudSqlite.AccountProps>("cloudSqlite/accountProps")!;
          expect(account1).deep.equals(CloudSqliteTest.storage);
          const contain1 = settings.getString("cloudSqlite/containerId")!;
          expect(contain1).equals(containerId);

          wsDbEdit.addString("myVersion", wsDbEdit.dbFileName.split(":")[1]);
          wsDbEdit.addString("string 1", "value of string 1");
          wsDbEdit.close();
        } finally {
          wsCont1.dropWorkspaceDb(wsDbEdit);
        }
      });
    };
    await makeVersion();
    await makeVersion("1.2");
    await makeVersion("v1.2.4");
    await makeVersion("1.1.3");
    await makeVersion("1.1.4-beta");
    await makeVersion("3");
    await expect(makeVersion("badname")).rejectedWith("invalid version");

    expect(wsCont1.cloudContainer?.hasWriteLock).false;

    const wsCont2 = workspace2.getContainer({ ...CloudSqliteTest.storage, containerId, sasToken: CloudSqliteTest.makeSasToken(containerId, "rl") });
    const ws2Cloud = wsCont2.cloudContainer;
    assert(ws2Cloud !== undefined);

    // eslint-disable-next-line @typescript-eslint/promise-function-async
    expect(() => ws2Cloud.acquireWriteLock("other session")).to.throw("container is not writeable");

    let ws2 = await wsCont2.getWorkspaceDb({ dbName: testDbName });
    expect(ws2.getString("string 1")).equals("value of string 1");
    ws2.container.dropWorkspaceDb(ws2);

    await expect(wsCont2.getWorkspaceDb({ dbName: testDbName, version: "^2.0.0" })).rejectedWith("No version of");

    // change the workspace in one cache and see that it is updated in the other
    const newVal = "new value for string 1";
    assert(undefined !== wsCont1.cloudContainer);
    await CloudSqlite.withWriteLock("Cloud workspace test", wsCont1.cloudContainer, async () => {
      const ws3 = new EditableWorkspaceDb({ dbName: testDbName, version: "1.1.4-beta" }, wsCont1);
      ws3.open();
      ws3.updateString("string 1", newVal);
      ws3.close();
    });

    await ws2Cloud.checkForChanges();
    expect(wsCont2.resolveFileName({ dbName: testDbName, version: "~1.1.0" })).contains("1.1.3");
    expect(wsCont2.resolveFileName({ dbName: testDbName, version: "1.2.0" })).contains("1.2.0");
    expect(wsCont2.resolveFileName({ dbName: testDbName, version: ">1.0.0 <3.0.0" })).contains("1.2.4");
    expect(wsCont2.resolveFileName({ dbName: testDbName, version: "1.0.0" })).contains("1.0.0");

    ws2 = await wsCont2.getWorkspaceDb({ dbName: testDbName, version: "~1.1.0", includePrerelease: true });
    expect(ws2.dbFileName).contains("1.1.4-beta");
    expect(ws2.getString("string 1")).equals(newVal);
    expect(ws2.getString("myVersion")).equals("1.1.4-beta");
    ws2.container.dropWorkspaceDb(ws2);

    ws2 = await wsCont2.getWorkspaceDb({ dbName: testDbName });
    expect(ws2.dbFileName).contains("3.0.0");
    expect(ws2.getString("string 1")).equals("value of string 1");
    expect(ws2.getString("myVersion")).equals("3.0.0");
    ws2.container.dropWorkspaceDb(ws2);
  });

});
