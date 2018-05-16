/*---------------------------------------------------------------------------------------------
|  $Copyright: (c) 2018 Bentley Systems, Incorporated. All rights reserved. $
 *--------------------------------------------------------------------------------------------*/
import * as chai from "chai";
import * as fs from "fs";
import * as path from "path";
import * as deepAssign from "deep-assign";

import { TestConfig } from "../TestConfig";

import { Briefcase, ChangeSet, Lock, UserInfo, ChangeSetQuery, UserInfoQuery, LockQuery } from "../../imodelhub";
import { IModelHubClient } from "../../imodelhub/Client";
import { AccessToken } from "../../Token";
import { ResponseBuilder, RequestType, ScopeType } from "../ResponseBuilder";
import * as utils from "./TestUtils";

declare const __dirname: string;

chai.should();

function mockGetChangeSetById(imodelId: string, changeSet: ChangeSet) {
  if (!TestConfig.enableMocks)
    return;

  const requestPath = utils.createRequestUrl(ScopeType.iModel, imodelId, "ChangeSet", changeSet.wsgId);
  const requestResponse = ResponseBuilder.generateGetResponse<ChangeSet>(changeSet);
  ResponseBuilder.mockResponse(utils.defaultUrl, RequestType.Get, requestPath, requestResponse);
}

describe("iModelHub ChangeSetHandler", () => {
  let accessToken: AccessToken;
  let iModelId: string;
  let briefcase: Briefcase;
  const imodelName = "imodeljs-clients ChangeSets test";
  const imodelHubClient: IModelHubClient = utils.getDefaultClient();
  const downloadToPath: string = __dirname + "/../assets/";

  before(async () => {
    accessToken = await utils.login();
    await utils.createIModel(accessToken, imodelName);
    iModelId = await utils.getIModelId(accessToken, imodelName);
    if (!TestConfig.enableMocks) {
      const changeSetCount = (await imodelHubClient.ChangeSets().get(accessToken, iModelId)).length;
      if (changeSetCount > 9) {
        // Recreate iModel if can't create any new changesets
        await utils.createIModel(accessToken, imodelName, undefined, true);
        iModelId = await utils.getIModelId(accessToken, imodelName);
      }
    }
    briefcase = (await utils.getBriefcases(accessToken, iModelId, 1))[0];

    // Ensure that at least two exist
    await utils.createChangeSets(accessToken, iModelId, briefcase, 0, 2);

    if (!TestConfig.enableMocks) {
      const changesets = (await imodelHubClient.ChangeSets().get(accessToken, iModelId));
      // Ensure that at least one lock exists
      await utils.createLocks(accessToken, iModelId, briefcase, 1, 2, 2, changesets[0].id, changesets[0].string);
    }

    if (!fs.existsSync(downloadToPath)) {
      fs.mkdirSync(downloadToPath);
    }
  });

  afterEach(() => {
    ResponseBuilder.clearMocks();
  });

  function mockPostNewChangeSet(imodelId: string, changeSet: ChangeSet) {
    const requestPath = utils.createRequestUrl(ScopeType.iModel, imodelId, "ChangeSet");

    const postBody = ResponseBuilder.generatePostBody(changeSet);

    const cs = new ChangeSet();
    deepAssign(cs, changeSet);
    cs.wsgId = cs.id!;
    cs.uploadUrl = `${utils.defaultUrl}/imodelhub-${imodelId}/123456`;
    const requestResponse = ResponseBuilder.generatePostResponse(cs);

    ResponseBuilder.mockResponse(utils.defaultUrl, RequestType.Post, requestPath, requestResponse, 1, postBody);
  }

  function mockPostUpdatedChangeSet(imodelId: string, changeSet: ChangeSet) {
    const requestPath = utils.createRequestUrl(ScopeType.iModel, imodelId, "ChangeSet", changeSet.id!);

    const cs = new ChangeSet();
    deepAssign(cs, changeSet);
    cs.isUploaded = true;
    cs.wsgId = changeSet.id!;
    const postBody = ResponseBuilder.generatePostBody(cs);

    const requestResponse = ResponseBuilder.generatePostResponse(cs);

    ResponseBuilder.mockResponse(utils.defaultUrl, RequestType.Post, requestPath, requestResponse, 1, postBody);
  }

  function mockCreateChangeSet(imodelId: string, changeSet: ChangeSet) {
    if (!TestConfig.enableMocks)
      return;

    mockPostNewChangeSet(imodelId, changeSet);
    utils.mockUploadFile(imodelId, 1);
    mockPostUpdatedChangeSet(imodelId, changeSet);
  }

  it("should create a new ChangeSet", async function (this: Mocha.ITestCallbackContext) {
    const mockChangeSets = utils.getMockChangeSets(briefcase);

    utils.mockGetChangeSet(iModelId, false, mockChangeSets[0], mockChangeSets[1]);
    const changeSets: ChangeSet[] = await imodelHubClient.ChangeSets().get(accessToken, iModelId);

    const index = changeSets.length;
    const filePath = utils.getMockChangeSetPath(index, mockChangeSets[index].id!);

    mockCreateChangeSet(iModelId, mockChangeSets[2]);
    const progressTracker = new utils.ProgressTracker();
    const newChangeSet = await imodelHubClient.ChangeSets().create(accessToken, iModelId, mockChangeSets[index], filePath, progressTracker.track());

    chai.assert(newChangeSet);
    progressTracker.check();
  });

  it("should get information on ChangeSets", async () => {
    const mockedChangeSets = Array(3).fill(0).map(() => utils.generateChangeSet());
    utils.mockGetChangeSet(iModelId, true, ...mockedChangeSets);

    const changeSets: ChangeSet[] = await imodelHubClient.ChangeSets().get(accessToken, iModelId, new ChangeSetQuery().selectDownloadUrl());
    chai.expect(changeSets.length).to.be.greaterThan(1);

    let i = 0;
    for (const changeSet of changeSets) {
      mockGetChangeSetById(iModelId, mockedChangeSets[i++]);

      const fileName: string = changeSet.fileName!;
      chai.expect(fileName.length).to.be.greaterThan(0);

      const downloadUrl: string = changeSet.downloadUrl!;
      chai.assert(downloadUrl.startsWith("https://"));

      const changeSet2: ChangeSet = (await imodelHubClient.ChangeSets().get(accessToken, iModelId, new ChangeSetQuery().byId(changeSet.wsgId)))[0];

      chai.expect(changeSet.wsgId).to.be.equal(changeSet2.wsgId);
      chai.expect(changeSet.index).to.be.equal(changeSet2.index);
    }

    const lastButOneId = changeSets[changeSets.length - 2].wsgId;
    if (TestConfig.enableMocks) {
      const requestPath = utils.createRequestUrl(ScopeType.iModel, iModelId, "ChangeSet",
        `?$filter=FollowingChangeSet-backward-ChangeSet.Id+eq+%27${lastButOneId}%27`);
      ResponseBuilder.mockResponse(utils.defaultUrl, RequestType.Get, requestPath, ResponseBuilder.generateGetResponse(mockedChangeSets[changeSets.length - 2]));
    }
    const followingChangeSets: ChangeSet[] = await imodelHubClient.ChangeSets().get(accessToken, iModelId, new ChangeSetQuery().fromId(lastButOneId));
    chai.expect(followingChangeSets.length).to.be.equal(1);
  });

  it("should download ChangeSets", async () => {
    utils.mockGetChangeSet(iModelId, true, utils.generateChangeSet(), utils.generateChangeSet());
    const changeSets: ChangeSet[] = await imodelHubClient.ChangeSets().get(accessToken, iModelId, new ChangeSetQuery().selectDownloadUrl());

    const downloadChangeSetsToPath: string = path.join(downloadToPath, iModelId);

    utils.mockFileResponse(2);
    const progressTracker = new utils.ProgressTracker();
    await imodelHubClient.ChangeSets().download(changeSets, downloadChangeSetsToPath, progressTracker.track());
    fs.existsSync(downloadChangeSetsToPath).should.be.equal(true);
    progressTracker.check();
    for (const changeSet of changeSets) {
      const fileName: string = changeSet.fileName!;
      const downloadedPathname: string = path.join(downloadChangeSetsToPath, fileName);

      fs.existsSync(downloadedPathname).should.be.equal(true);
    }
  });

  it("should find information on the ChangeSet a specific Element was last modified in", async function (this: Mocha.ITestCallbackContext) {
    const mockId = utils.generateChangeSetId();
    if (TestConfig.enableMocks) {
      const requestPath = utils.createRequestUrl(ScopeType.iModel, iModelId, "Lock", "?$filter=LockType+eq+2+and+LockLevel+eq+2&$top=1");
      const requestResponse = ResponseBuilder.generateGetResponse<Lock>(ResponseBuilder.generateObject<Lock>(Lock,
        new Map<string, any>([
          ["objectId", "123"],
          ["releasedWithChangeSet", mockId],
          ["userCreated", "1"],
        ])));
      ResponseBuilder.mockResponse(utils.defaultUrl, RequestType.Get, requestPath, requestResponse);
    }

    // For a test case, find an element that was recently modified by looking at the first lock
    const elementLocks: Lock[] = await imodelHubClient.Locks().get(accessToken, iModelId, new LockQuery().byLockType(2).byLockLevel(2).top(1));
    chai.expect(elementLocks.length).to.be.equal(1);
    const testElementId: string = elementLocks[0].objectId!; // Hex or Decimal

    if (TestConfig.enableMocks) {
      const requestPath = utils.createRequestUrl(ScopeType.iModel, iModelId, "Lock", "?$filter=ObjectId+eq+%27123%27&$top=1");
      const requestResponse = ResponseBuilder.generateGetResponse<Lock>(ResponseBuilder.generateObject<Lock>(Lock,
        new Map<string, any>([
          ["objectId", "123"],
          ["releasedWithChangeSet", mockId],
          ["userCreated", "1"],
        ])));
      ResponseBuilder.mockResponse(utils.defaultUrl, RequestType.Get, requestPath, requestResponse);
    }
    // Find the change set that the lock was modified in
    const queryLocks: Lock[] = await imodelHubClient.Locks().get(accessToken, iModelId, new LockQuery().byObjectId(testElementId).top(1));
    chai.expect(queryLocks.length).to.be.equal(1);

    const changeSetId: string = queryLocks[0].releasedWithChangeSet!; // Can get changeSetIndex also if necessary to compare against current
    chai.expect(changeSetId).length.to.be.greaterThan(0);

    if (TestConfig.enableMocks) {
      const requestResponse = ResponseBuilder.generateGetResponse<ChangeSet>(ResponseBuilder.generateObject<ChangeSet>(ChangeSet,
        new Map<string, any>([["userCreated", "1"]])));
      const requestPath = utils.createRequestUrl(ScopeType.iModel, iModelId, "ChangeSet", mockId);
      ResponseBuilder.mockResponse(utils.defaultUrl, RequestType.Get, requestPath, requestResponse);
    }
    const changeSet: ChangeSet = (await imodelHubClient.ChangeSets().get(accessToken, iModelId, new ChangeSetQuery().byId(changeSetId)))[0];
    chai.assert(!!changeSet);

    if (TestConfig.enableMocks) {
      const requestResponse = ResponseBuilder.generateGetResponse<UserInfo>(ResponseBuilder.generateObject<UserInfo>(UserInfo));
      const requestPath = utils.createRequestUrl(ScopeType.iModel, iModelId, "UserInfo", "1");
      ResponseBuilder.mockResponse(utils.defaultUrl, RequestType.Get, requestPath, requestResponse);
    }
    const userInfo: UserInfo = (await imodelHubClient.Users().get(accessToken, iModelId, new UserInfoQuery().byId(changeSet.userCreated!)))[0];
    chai.assert(!!userInfo);
  });
});
