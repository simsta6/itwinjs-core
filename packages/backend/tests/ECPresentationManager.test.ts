/*---------------------------------------------------------------------------------------------
|  $Copyright: (c) 2017 Bentley Systems, Incorporated. All rights reserved. $
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import * as moq from "typemoq";
import * as faker from "faker";
import { OpenMode } from "@bentley/bentleyjs-core";
import { IModelToken, IModelError } from "@bentley/imodeljs-common";
import { NativePlatformRegistry, IModelHost, IModelDb } from "@bentley/imodeljs-backend";
import { NativeECPresentationManager } from "@bentley/imodeljs-native-platform-api";
import { PageOptions, SelectionInfo, KeySet } from "@bentley/ecpresentation-common";
import { Node, NodeKey, ECInstanceNodeKey } from "@bentley/ecpresentation-common";
import ECPresentationManager, { NodeAddonDefinition, NodeAddonRequestTypes } from "@src/ECPresentationManager";
import { createRandomECInstanceNodeKey } from "@helpers/random/Hierarchy";
import { createRandomECInstanceKey, createRandomECClassInfo } from "@helpers/random/EC";
import { createRandomDescriptor, createRandomCategory } from "@helpers/random/Content";
import { RelatedClassInfo, SelectClassInfo } from "@bentley/ecpresentation-common";
import { Property, PropertyInfo, KindOfQuantityInfo } from "@bentley/ecpresentation-common";
import { PrimitiveTypeDescription, ArrayTypeDescription, StructTypeDescription } from "@bentley/ecpresentation-common";
import { ContentJSON } from "@bentley/ecpresentation-common/lib/content/Content";
import { DescriptorJSON } from "@bentley/ecpresentation-common/lib/content/Descriptor";
import { PropertiesFieldJSON, NestedContentFieldJSON, FieldJSON } from "@bentley/ecpresentation-common/lib/content/Fields";
import { ItemJSON } from "@bentley/ecpresentation-common/lib/content/Item";
import "@helpers/Snapshots";
import "@helpers/Promises";

describe("ECPresentationManager", () => {

  beforeEach(() => {
    IModelHost.shutdown();
    try {
      IModelHost.startup();
    } catch (_e) {}
  });

  it("uses default native library implementation if not overridden", () => {
    const manager = new ECPresentationManager();
    expect((manager.getNativePlatform() as any)._nativeAddon).instanceOf(NativePlatformRegistry.getNativePlatform().NativeECPresentationManager);
  });

  it("uses addon implementation supplied through props", () => {
    const mock = moq.Mock.ofType<NodeAddonDefinition>();
    const manager = new ECPresentationManager({ addon: mock.object });
    expect(manager.getNativePlatform()).eq(mock.object);
  });

  describe("addon setup based on constructor props", () => {

    const addon = moq.Mock.ofType<NodeAddonDefinition>();
    beforeEach(() => {
      addon.reset();
    });

    it("sets up ruleset directories if supplied", () => {
      const dirs = ["test1", "test2"];
      addon.setup((x) => x.setupRulesetDirectories(dirs)).verifiable();
      new ECPresentationManager({ addon: addon.object, rulesetDirectories: dirs });
      addon.verifyAll();
    });

  });

  describe("calling default addon implementation", () => {

    const manager = new ECPresentationManager();
    const addonMock = moq.Mock.ofType<NativeECPresentationManager>();
    beforeEach(() => {
      addonMock.reset();
      (manager.getNativePlatform() as any)._nativeAddon = addonMock.object;
    });

    it("calls addon's handleRequest", async () => {
      addonMock.setup((x) => x.handleRequest(moq.It.isAny(), "")).returns(() => "0").verifiable();
      manager.getNativePlatform().handleRequest(undefined, "");
      addonMock.verifyAll();
    });

    it("calls addon's setupRulesetDirectories", async () => {
      addonMock.setup((x) => x.setupRulesetDirectories(moq.It.isAny())).verifiable();
      manager.getNativePlatform().setupRulesetDirectories([]);
      addonMock.verifyAll();
    });

    it("returns imodel addon from IModelDb", () => {
      const mock = moq.Mock.ofType<IModelDb>();
      mock.setup((x) => x.nativeDb).returns(() => ({})).verifiable(moq.Times.atLeastOnce());
      IModelDb.find = (_token: IModelToken) => mock.object;
      expect(manager.getNativePlatform().getImodelAddon(new IModelToken())).be.instanceOf(Object);
      mock.verifyAll();
    });

    it("throws when fails to find imodel using IModelDb", () => {
      const mock = moq.Mock.ofType<IModelDb>();
      mock.setup((x) => x.nativeDb).returns(() => undefined).verifiable(moq.Times.atLeastOnce());
      IModelDb.find = (_token: IModelToken) => mock.object;
      expect(() => manager.getNativePlatform().getImodelAddon(new IModelToken())).to.throw(IModelError);
      mock.verifyAll();
    });

  });

  describe("addon results conversion to ECPresentation objects", () => {

    let testData: any;
    const mock = moq.Mock.ofType<NodeAddonDefinition>();
    const manager = new ECPresentationManager({ addon: mock.object });
    beforeEach(() => {
      testData = {
        imodelToken: new IModelToken("key path", false, "context id", "imodel id", "changeset id", OpenMode.Readonly, "user id"),
        pageOptions: { pageStart: 123, pageSize: 456 } as PageOptions,
        displayType: faker.random.word(),
        keys: (new KeySet([createRandomECInstanceNodeKey()])).add(createRandomECInstanceKey()),
        selectionInfo: {
          providerName: faker.random.word(),
          level: faker.random.number(),
        } as SelectionInfo,
        extendedOptions: {
          rulesetId: faker.random.word(),
          someOtherOption: faker.random.number(),
        },
      };
      mock.reset();
      mock.setup((x) => x.getImodelAddon(testData.imodelToken)).verifiable(moq.Times.atLeastOnce());
    });
    afterEach(() => {
      mock.verifyAll();
    });

    const setup = (addonResponse: any) => {
      // mock the handleRequest function
      mock.setup((x) => x.handleRequest(moq.It.isAny(), moq.It.isAnyString())).returns(() => JSON.stringify(addonResponse));
    };
    const verifyWithSnapshot = (result: any, expectedParams: any, recreateSnapshot: boolean = false) => {
      // verify the addon was called with correct params
      mock.verify((x) => x.handleRequest(moq.It.isAny(), JSON.stringify(expectedParams)), moq.Times.once());
      // verify the manager correctly used addonResponse to create its result
      expect(result).to.matchSnapshot(recreateSnapshot);
    };
    const verifyWithExpectedResult = (actualResult: any, expectedResult: any, expectedParams: any) => {
      // verify the addon was called with correct params
      mock.verify((x) => x.handleRequest(moq.It.isAny(), JSON.stringify(expectedParams)), moq.Times.once());
      // verify the manager correctly used addonResponse to create its result
      expect(actualResult).to.deep.eq(expectedResult);
    };

    it("returns root nodes", async () => {
      // what the addon receives
      const expectedParams = {
        requestId: NodeAddonRequestTypes.GetRootNodes,
        params: {
          pageOptions: testData.pageOptions,
          options: testData.extendedOptions,
        },
      };
      // what the addon returns
      const addonResponse: Node[] = [{
        key: {
          type: "type1",
          pathFromRoot: ["p1", "p2", "p3"],
        } as NodeKey,
        label: "test1",
        description: "description1",
        imageId: "img_1",
        foreColor: "foreColor1",
        backColor: "backColor1",
        fontStyle: "fontStyle1",
        hasChildren: true,
        isSelectable: true,
        isEditable: true,
        isChecked: true,
        isCheckboxVisible: true,
        isCheckboxEnabled: true,
        isExpanded: true,
      }, {
        key: {
          type: "ECInstanceNode",
          pathFromRoot: ["p1"],
          instanceKey: createRandomECInstanceKey(),
        } as ECInstanceNodeKey,
        label: "test2",
        description: "description2",
        imageId: "",
        foreColor: "",
        backColor: "",
        fontStyle: "",
        hasChildren: false,
        isSelectable: false,
        isEditable: false,
        isChecked: false,
        isCheckboxVisible: false,
        isCheckboxEnabled: false,
        isExpanded: false,
      }, {
        key: {
          type: "some node",
          pathFromRoot: ["p1", "p3"],
        } as NodeKey,
        label: "test2",
      }];
      // test
      setup(addonResponse);
      const result = await manager.getRootNodes(testData.imodelToken, testData.pageOptions, testData.extendedOptions);
      verifyWithSnapshot(result, expectedParams);
    });

    it("returns root nodes count", async () => {
      // what the addon receives
      const expectedParams = {
        requestId: NodeAddonRequestTypes.GetRootNodesCount,
        params: {
          options: testData.extendedOptions,
        },
      };
      // what the addon returns
      const addonResponse = 456;
      // test
      setup(addonResponse);
      const result = await manager.getRootNodesCount(testData.imodelToken, testData.extendedOptions);
      verifyWithExpectedResult(result, addonResponse, expectedParams);
    });

    it("returns child nodes", async () => {
      // what the addon receives
      const parentNodeKey = createRandomECInstanceNodeKey();
      const expectedParams = {
        requestId: NodeAddonRequestTypes.GetChildren,
        params: {
          nodeKey: parentNodeKey,
          pageOptions: testData.pageOptions,
          options: testData.extendedOptions,
        },
      };
      // what the addon returns
      const addonResponse: Node[] = [{
        key: {
          type: "ECInstanceNode",
          pathFromRoot: ["p1"],
          instanceKey: createRandomECInstanceKey(),
        } as ECInstanceNodeKey,
        label: "test2",
      }, {
        key: {
          type: "type 2",
          pathFromRoot: ["p1", "p3"],
        } as NodeKey,
        label: "test3",
      }];
      // test
      setup(addonResponse);
      const result = await manager.getChildren(testData.imodelToken, parentNodeKey, testData.pageOptions, testData.extendedOptions);
      verifyWithSnapshot(result, expectedParams);
    });

    it("returns child nodes count", async () => {
      // what the addon receives
      const parentNodeKey = createRandomECInstanceNodeKey();
      const expectedParams = {
        requestId: NodeAddonRequestTypes.GetChildrenCount,
        params: {
          nodeKey: parentNodeKey,
          options: testData.extendedOptions,
        },
      };
      // what the addon returns
      const addonResponse = 789;
      // test
      setup(addonResponse);
      const result = await manager.getChildrenCount(testData.imodelToken, parentNodeKey, testData.extendedOptions);
      verifyWithExpectedResult(result, addonResponse, expectedParams);
    });

    it("returns content descriptor", async () => {
      // what the addon receives
      const expectedParams = {
        requestId: NodeAddonRequestTypes.GetContentDescriptor,
        params: {
          displayType: testData.displayType,
          keys: testData.keys,
          selection: testData.selectionInfo,
          options: testData.extendedOptions,
        },
      };
      const addonResponse: DescriptorJSON = {
        connectionId: faker.random.uuid(),
        inputKeysHash: faker.random.uuid(),
        contentOptions: faker.random.objectElement(),
        displayType: testData.displayType,
        selectClasses: [{
          selectClassInfo: createRandomECClassInfo(),
          isSelectPolymorphic: true,
          pathToPrimaryClass: [{
            sourceClassInfo: createRandomECClassInfo(),
            targetClassInfo: createRandomECClassInfo(),
            relationshipInfo: createRandomECClassInfo(),
            isForwardRelationship: false,
            isPolymorphicRelationship: true,
          } as RelatedClassInfo],
          relatedPropertyPaths: [[{
            sourceClassInfo: createRandomECClassInfo(),
            targetClassInfo: createRandomECClassInfo(),
            relationshipInfo: createRandomECClassInfo(),
            isForwardRelationship: true,
            isPolymorphicRelationship: false,
          } as RelatedClassInfo]],
        }],
        fields: [{
          name: "Primitive property field with editor",
          category: createRandomCategory(),
          label: faker.random.words(),
          type: {
            typeName: "string",
            valueFormat: "Primitive",
          } as PrimitiveTypeDescription,
          isReadonly: faker.random.boolean(),
          priority: faker.random.number(),
          editor: {
            name: faker.random.word(),
            params: {
              some_param: faker.random.number(),
            },
          },
          properties: [{
            property: {
              classInfo: createRandomECClassInfo(),
              name: faker.random.word(),
              type: "string",
              enumerationInfo: {
                choices: [{
                  label: faker.random.words(),
                  value: faker.random.uuid(),
                }, {
                  label: faker.random.words(),
                  value: faker.random.uuid(),
                }],
                isStrict: faker.random.boolean(),
              },
            } as PropertyInfo,
            relatedClassPath: [],
          } as Property],
        } as PropertiesFieldJSON, {
          name: "Complex array of structs property field",
          category: createRandomCategory(),
          label: faker.random.words(),
          type: {
            typeName: "string[]",
            valueFormat: "Array",
            memberType: {
              typeName: "SomeClass",
              valueFormat: "Struct",
              members: [{
                name: faker.random.word(),
                label: faker.random.words(),
                type: {
                  typeName: "string",
                  valueFormat: "Primitive",
                },
              }, {
                name: faker.random.word(),
                label: faker.random.words(),
                type: {
                  typeName: "string[]",
                  valueFormat: "Array",
                  memberType: {
                    typeName: "string",
                    valueFormat: "Primitive",
                  },
                } as ArrayTypeDescription,
              }],
            } as StructTypeDescription,
          } as ArrayTypeDescription,
          isReadonly: faker.random.boolean(),
          priority: faker.random.number(),
          properties: [{
            property: {
              classInfo: createRandomECClassInfo(),
              name: faker.random.word(),
              type: "double",
              kindOfQuantity: {
                name: faker.random.word(),
                label: faker.random.words(),
                persistenceUnit: faker.random.word(),
                currentFusId: faker.random.uuid(),
              } as KindOfQuantityInfo,
            } as PropertyInfo,
            relatedClassPath: [],
          } as Property],
        } as PropertiesFieldJSON, {
          name: "Nested content field",
          category: createRandomCategory(),
          label: faker.random.words(),
          type: {
            typeName: faker.random.word(),
            valueFormat: "Struct",
            members: [{
              name: faker.random.word(),
              label: faker.random.words(),
              type: {
                typeName: "string",
                valueFormat: "Primitive",
              },
            }],
          } as StructTypeDescription,
          contentClassInfo: createRandomECClassInfo(),
          pathToPrimaryClass: [{
            sourceClassInfo: createRandomECClassInfo(),
            targetClassInfo: createRandomECClassInfo(),
            relationshipInfo: createRandomECClassInfo(),
            isForwardRelationship: false,
            isPolymorphicRelationship: true,
          } as RelatedClassInfo],
          nestedFields: [{
            name: "Simple property field",
            category: createRandomCategory(),
            label: faker.random.words(),
            type: {
              typeName: "string",
              valueFormat: "Primitive",
            },
            isReadonly: faker.random.boolean(),
            priority: faker.random.number(),
          } as FieldJSON],
          isReadonly: faker.random.boolean(),
          priority: faker.random.number(),
        } as NestedContentFieldJSON],
        contentFlags: 0,
      };
      // test
      setup(addonResponse);
      const result = await manager.getContentDescriptor(testData.imodelToken, testData.displayType,
        testData.keys, testData.selectionInfo, testData.extendedOptions);
      verifyWithSnapshot(result, expectedParams);
    });

    it("returns content set size", async () => {
      // what the addon receives
      const descriptor = createRandomDescriptor() as any; // wip: why is casting to any required?
      const expectedParams = {
        requestId: NodeAddonRequestTypes.GetContentSetSize,
        params: {
          keys: testData.keys,
          descriptorOverrides: descriptor.createDescriptorOverrides(),
          options: testData.extendedOptions,
        },
      };
      // what the addon returns
      const addonResponse = faker.random.number();
      // test
      setup(addonResponse);
      const result = await manager.getContentSetSize(testData.imodelToken, descriptor,
        testData.keys, testData.extendedOptions);
      verifyWithExpectedResult(result, addonResponse, expectedParams);
    });

    it("returns content", async () => {
      // what the addon receives
      const descriptor = createRandomDescriptor() as any; // wip: why is casting to any required?
      const expectedParams = {
        requestId: NodeAddonRequestTypes.GetContent,
        params: {
          keys: testData.keys,
          descriptorOverrides: descriptor.createDescriptorOverrides(),
          pageOptions: testData.pageOptions,
          options: testData.extendedOptions,
        },
      };
      // what the addon returns
      const fieldName = faker.random.word();
      const addonResponse = {
        descriptor: {
          displayType: descriptor.displayType,
          selectClasses: [{
            selectClassInfo: createRandomECClassInfo(),
            isSelectPolymorphic: true,
            pathToPrimaryClass: [],
            relatedPropertyPaths: [],
          } as SelectClassInfo],
          fields: [{
            name: fieldName,
            category: createRandomCategory(),
            label: faker.random.words(),
            type: {
              typeName: "string",
              valueFormat: "Primitive",
            } as PrimitiveTypeDescription,
            isReadonly: faker.random.boolean(),
            priority: faker.random.number(),
            properties: [{
              property: {
                classInfo: createRandomECClassInfo(),
                name: faker.random.word(),
                type: "string",
              },
              relatedClassPath: [],
            } as Property],
          } as PropertiesFieldJSON],
          contentFlags: 0,
        } as DescriptorJSON,
        contentSet: [{
          primaryKeys: [createRandomECInstanceKey()],
          classInfo: createRandomECClassInfo(),
          label: faker.random.words(),
          imageId: faker.random.uuid(),
          values: {
            [fieldName]: faker.random.words(),
          },
          displayValues: {
            [fieldName]: faker.random.words(),
          },
          mergedFieldNames: [],
        } as ItemJSON],
      } as ContentJSON;
      // test
      setup(addonResponse);
      const result = await manager.getContent(testData.imodelToken, descriptor,
        testData.keys, testData.pageOptions, testData.extendedOptions);
      verifyWithSnapshot(result, expectedParams);
    });

    it("throws on invalid addon response", async () => {
      mock.setup((x) => x.handleRequest(moq.It.isAny(), moq.It.isAnyString())).returns(() => (undefined as any));
      expect(manager.getRootNodes(testData.imodelToken, testData.pageOptions, testData.extendedOptions)).to.eventually.be.rejectedWith(Error);
    });

  });

});
