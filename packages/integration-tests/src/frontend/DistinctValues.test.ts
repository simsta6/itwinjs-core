/*---------------------------------------------------------------------------------------------
|  $Copyright: (c) 2018 Bentley Systems, Incorporated. All rights reserved. $
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { initialize, terminate } from "../IntegrationTests";
import { OpenMode, Id64, using } from "@bentley/bentleyjs-core";
import { IModelConnection } from "@bentley/imodeljs-frontend";
import { KeySet, SelectionInfo, InstanceKey, PresentationRuleSet } from "@bentley/ecpresentation-common";
import { ECPresentation } from "@bentley/ecpresentation-frontend";

before(() => {
  initialize();
});

after(() => {
  terminate();
});

describe("DistinctValues", async () => {
  let imodel: IModelConnection;

  before(async () => {
    const testIModelName: string = "assets/datasets/1K.bim";
    imodel = await IModelConnection.openStandalone(testIModelName, OpenMode.Readonly);
    expect(imodel).is.not.null;
  });

  after(async () => {
    await imodel.closeStandalone();
  });

  it.skip("gets distinct content values", async () => {
    const ruleset: PresentationRuleSet = require("../test-rulesets/DistinctValues/getRelatedDistinctValues");
    await using(await ECPresentation.presentation.rulesets().add(ruleset), async () => {
      const key1: InstanceKey = { id: new Id64("0x1"), className: "BisCore:Subject" };
      const key2: InstanceKey = { id: new Id64("0x17"), className: "BisCore:SpatialCategory" };
      const selection: SelectionInfo = { providerName: "Some provider", level: 0 };
      const keys = new KeySet([key1, key2]);
      const descriptor = await ECPresentation.presentation.getContentDescriptor({ imodel, rulesetId: ruleset.ruleSetId }, "Grid", keys, selection);
      expect(descriptor).to.not.be.undefined;
      const distinctValues = await ECPresentation.presentation.getDistinctValues({ imodel, rulesetId: ruleset.ruleSetId }, descriptor!, keys,
        "SubCategory_DefinitionPartition_LinkPartition_PhysicalPartition_Model");
      expect(distinctValues).to.be.deep.equal(["Dictionary Model-0-G", "Repository Model-0-1"]);
    });
  });

});
