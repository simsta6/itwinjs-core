/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { assert, expect } from "chai";
import * as sinon from "sinon";
import * as path from "path";
import { BisCodeSpec, Code, DefinitionElementProps, ElementAspectProps, EntityMetaData, RelatedElement, RelatedElementProps } from "@bentley/imodeljs-common";
import {
  BackendRequestContext, DefinitionElement, Element, IModelDb, RepositoryLink, Schema, SnapshotDb, SpatialViewDefinition, UrlLink, ViewDefinition3d,
} from "../../imodeljs-backend";
import { IModelTestUtils } from "../IModelTestUtils";
import { KnownTestLocations } from "../KnownTestLocations";
import { Schemas } from "../../Schema";
import { ClassRegistry } from "../../ClassRegistry";
import { Id64Set } from "@bentley/bentleyjs-core";

describe("Class Registry", () => {
  let imodel: SnapshotDb;
  const requestContext = new BackendRequestContext();

  before(() => {
    const seedFileName = IModelTestUtils.resolveAssetFile("test.bim");
    const testFileName = IModelTestUtils.prepareOutputFile("ClassRegistry", "ClassRegistryTest.bim");
    imodel = IModelTestUtils.createSnapshotFromSeed(testFileName, seedFileName);
    assert.exists(imodel);
  });

  after(() => {
    if (imodel)
      imodel.close();
  });

  it("should verify the Entity metadata of known element subclasses", () => {
    const code1 = new Code({ spec: "0x10", scope: "0x11", value: "RF1.dgn" });
    const el = imodel.elements.getElement(code1);
    assert.exists(el);
    if (el) {
      const metaData: EntityMetaData | undefined = el.getClassMetaData();
      assert.exists(metaData);
      if (undefined === metaData)
        return;
      assert.equal(metaData.ecclass, el.classFullName);
      // I happen to know that this is a BisCore:RepositoryLink
      assert.equal(metaData.ecclass, RepositoryLink.classFullName);
      //  Check the metadata on the class itself
      assert.isTrue(metaData.baseClasses.length > 0);
      assert.equal(metaData.baseClasses[0], UrlLink.classFullName);
      assert.equal(metaData.customAttributes![0].ecclass, "BisCore:ClassHasHandler");
      //  Check the metadata on the one property that RepositoryLink defines, RepositoryGuid
      assert.exists(metaData.properties);
      assert.isDefined(metaData.properties.repositoryGuid);
      const p = metaData.properties.repositoryGuid;
      assert.equal(p.extendedType, "BeGuid");
      assert.equal(p.customAttributes![1].ecclass, "CoreCustomAttributes:HiddenProperty");
    }
    const el2 = imodel.elements.getElement("0x34");
    assert.exists(el2);
    if (el2) {
      const metaData = el2.getClassMetaData();
      assert.exists(metaData);
      if (undefined === metaData)
        return;
      assert.equal(metaData.ecclass, el2.classFullName);
      // I happen to know that this is a BisCore.SpatialViewDefinition
      assert.equal(metaData.ecclass, SpatialViewDefinition.classFullName);
      assert.isTrue(metaData.baseClasses.length > 0);
      assert.equal(metaData.baseClasses[0], ViewDefinition3d.classFullName);
      assert.exists(metaData.properties);
      assert.isDefined(metaData.properties.modelSelector);
      const n = metaData.properties.modelSelector;
      assert.equal(n.relationshipClass, "BisCore:SpatialViewDefinitionUsesModelSelector");
    }
  });

  it("should verify Entity metadata with both base class and mixin properties", async () => {
    const schemaPathname = path.join(KnownTestLocations.assetsDir, "TestDomain.ecschema.xml");
    await imodel.importSchemas(requestContext, [schemaPathname]); // will throw an exception if import fails

    const testDomainClass = imodel.getMetaData("TestDomain:TestDomainClass"); // will throw on failure

    assert.equal(testDomainClass.baseClasses.length, 2);
    assert.equal(testDomainClass.baseClasses[0], DefinitionElement.classFullName);
    assert.equal(testDomainClass.baseClasses[1], "TestDomain:IMixin");

    // Ensures the IMixin has been loaded as part of getMetadata call above.
    assert.isDefined(imodel.classMetaDataRegistry.find("TestDomain:IMixin"));

    // Verify that the forEach method which is called when constructing an entity
    // is picking up all expected properties.
    const testData: string[] = [];
    IModelDb.forEachMetaData(imodel, "TestDomain:TestDomainClass", true, (propName) => {
      testData.push(propName);
    }, false);

    const expectedString = testData.find((testString: string) => {
      return testString === "testMixinProperty";
    });

    assert.isDefined(expectedString);
  });

});

describe("Class Registry - generated classes", () => {
  let imodel: SnapshotDb;
  const testSchemaPath = path.join(KnownTestLocations.assetsDir, "TestGeneratedClasses.ecschema.xml");

  before(async () => {
    const seedFileName = IModelTestUtils.resolveAssetFile("test.bim");
    const testFileName = IModelTestUtils.prepareOutputFile("ClassRegistry", "ClassRegistryTest.bim");
    imodel = IModelTestUtils.createSnapshotFromSeed(testFileName, seedFileName);
    assert.exists(imodel);
    await imodel.importSchemas(new BackendRequestContext(), [testSchemaPath]); // will throw an exception if import fails
  });

  after(() => {
    imodel?.close();
    ClassRegistry.unregisterClassesFrom(TestGeneratedClasses);
  });

  interface TestEntityProps extends DefinitionElementProps {
    prop: string;
  }

  interface TestElementWithNavPropProps  extends DefinitionElementProps {
    navProp: RelatedElementProps;
  }

  interface DerivedWithNavPropProps  extends TestElementWithNavPropProps {
    derivedNavProp: RelatedElementProps;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TestNonElementWithNavPropProps  extends ElementAspectProps {
    navProp: RelatedElement;
  }

  class TestGeneratedClasses extends Schema {
    public static override get schemaName(): string { return "TestGeneratedClasses"; }
    public static get classes() {
      return [ TestElementWithNavProp, DerivedWithNavProp, Derived2, Derived3, Derived4, Derived5, Derived6 ];
    }
    public static registerSchema() {
      if (this !== Schemas.getRegisteredSchema(this.schemaName)) {
        Schemas.unregisterSchema(this.schemaName);
        Schemas.registerSchema(this);
        // eslint-disable-next-line @typescript-eslint/naming-convention
        for (const class_ of this.classes) {
          ClassRegistry.register(class_, this);
        }
      }
    }

    public static unregisterSchema() {
      ClassRegistry.unregisterClassesFrom(this);
      Schemas.unregisterSchema(this.schemaName);
    }
  }

  class TestElementWithNavProp extends DefinitionElement {
    public static override get className() { return "TestElementWithNavProp"; }
    public static override schema = TestGeneratedClasses;
    public navProp: RelatedElement;
    public constructor(props: TestElementWithNavPropProps, inIModel: IModelDb) {
      super(props, inIModel);
      this.navProp = new RelatedElement(props.navProp);
    }
  }

  class DerivedWithNavProp extends TestElementWithNavProp {
    public static override get className() { return "DerivedWithNavProp"; }
    public static override schema = TestGeneratedClasses;
    public derivedNavProp: RelatedElement;
    public constructor(props: DerivedWithNavPropProps, inIModel: IModelDb) {
      super(props, inIModel);
      this.derivedNavProp = new RelatedElement(props.derivedNavProp);
    }
  }

  class Derived2 extends DerivedWithNavProp {
    public static override get className() { return "Derived2"; }
  }
  class Derived3 extends Derived2 {
    public static override get className() { return "Derived3"; }
  }
  class Derived4 extends Derived3 {
    public static override get className() { return "Derived4"; }
  }
  class Derived5 extends Derived4 {
    public static override get className() { return "Derived5"; }
  }
  class Derived6 extends Derived5 {
    public static override get className() { return "Derived6"; }
  }

  // if a single inherited class is not generated, the entire hierarchy is considered not-generated
  it("should only generate automatic collectPredecessorIds implementations for generated classes", async () => {
    await imodel.importSchemas(new BackendRequestContext(), [testSchemaPath]); // will throw an exception if import fails

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const GeneratedTestElementWithNavProp = imodel.getJsClass<typeof Element>("TestGeneratedClasses:TestElementWithNavProp");

    const testEntityId = imodel.elements.insertElement({
      classFullName: "TestGeneratedClasses:TestEntity",
      prop: "sample-value",
      model: IModelDb.dictionaryId,
      code: Code.createEmpty(),
    } as TestEntityProps);

    const elemWithNavProp = new GeneratedTestElementWithNavProp({
      classFullName: "TestGeneratedClasses:TestElementWithNavProp",
      navProp: {
        id: testEntityId,
        relClassName: "TestGeneratedClasses:ElemRel",
      },
    } as TestElementWithNavPropProps, imodel);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    assert.isDefined(GeneratedTestElementWithNavProp.prototype.getPredecessorIds);
    expect(
      [...elemWithNavProp.getPredecessorIds()],
    ).to.have.members(
      [elemWithNavProp.model, elemWithNavProp.code.scope, testEntityId]
    );

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const GeneratedTestNonElementWithNavProp = imodel.getJsClass("TestGeneratedClasses:TestNonElementWithNavProp");
    assert.isFalse(GeneratedTestNonElementWithNavProp.prototype.hasOwnProperty("collectPredecessorIds"));
  });

  it("should not override collectPredecessorIds for BisCore schema classes", async () => {
    // AnnotationFrameStyle is an example of an unregistered bis class without an implementation of collectPredecessorIds
    // eslint-disable-next-line @typescript-eslint/dot-notation
    assert.isTrue(imodel.getJsClass("BisCore:AnnotationFrameStyle").prototype.hasOwnProperty("collectPredecessorIds"));
  });

  it("should get predecessors from its bis superclass", async () => {
    await imodel.importSchemas(new BackendRequestContext(), [testSchemaPath]); // will throw an exception if import fails

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const GeneratedTestElementWithNavProp = imodel.getJsClass<typeof Element>("TestGeneratedClasses:TestElementWithNavProp");

    const testEntityId = imodel.elements.insertElement({
      classFullName: "TestGeneratedClasses:TestEntity",
      prop: "sample-value",
      model: IModelDb.dictionaryId,
      code: Code.createEmpty(),
    } as TestEntityProps);

    const elemWithNavProp = new GeneratedTestElementWithNavProp({
      classFullName: "TestGeneratedClasses:TestElementWithNavProp",
      navProp: new RelatedElement({
        id: testEntityId,
        relClassName: "TestGeneratedClasses:ElemRel",
      }),
      model: IModelDb.dictionaryId,
      code: new Code({
        scope: IModelDb.rootSubjectId,
        spec: imodel.codeSpecs.getByName(BisCodeSpec.spatialCategory).id,
        value: "",
      }),
      parent: new RelatedElement({
        // since we don't actually insert this element in this test, using an arbitrary id string
        id: "0x0000ffff",
        relClassName: "BisCore:ElementOwnsChildElements",
      }),
    } as TestElementWithNavPropProps, imodel);

    // super class here is Element so we should get the code.scope, model and parent as predecessors
    expect(
      [...elemWithNavProp.getPredecessorIds()],
    ).to.have.members(
      [elemWithNavProp.model, elemWithNavProp.code.scope, elemWithNavProp.parent?.id, testEntityId].filter((x) => x !== undefined)
    );
  });

  it("should not override custom registered schema class implementations of collectPredecessorIds", async () => {
    const testImplPredecessorId = "TEST-INVALID-ID";
    class MyTestElementWithNavProp extends TestElementWithNavProp {
      public override collectPredecessorIds(predecessorIds: Id64Set) {
        super.collectPredecessorIds(predecessorIds);
        predecessorIds.add(testImplPredecessorId);
      }
    }
    class MyTestGeneratedClasses extends TestGeneratedClasses {
      public static override get classes() {
        return [ MyTestElementWithNavProp, Derived2, Derived3, Derived4, Derived5, Derived6 ];
      }
    }
    MyTestGeneratedClasses.registerSchema();

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const ActualTestElementWithNavProp = imodel.getJsClass<typeof MyTestElementWithNavProp>(TestElementWithNavProp.classFullName);

    const testElementWithNavPropCollectPredecessorsSpy = sinon.spy(ActualTestElementWithNavProp.prototype, "collectPredecessorIds");

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const ActualDerivedWithNavProp = imodel.getJsClass<typeof Element>(DerivedWithNavProp.classFullName);

    const testEntity1Id = imodel.elements.insertElement({
      classFullName: "TestGeneratedClasses:TestEntity",
      prop: "sample-value-1",
      model: IModelDb.dictionaryId,
      code: Code.createEmpty(),
    } as TestEntityProps);

    const testEntity2Id = imodel.elements.insertElement({
      classFullName: "TestGeneratedClasses:TestEntity",
      prop: "sample-value-2",
      model: IModelDb.dictionaryId,
      code: Code.createEmpty(),
    } as TestEntityProps);

    const elemWithNavProp = new ActualTestElementWithNavProp({
      classFullName: TestElementWithNavProp.classFullName,
      navProp: {
        id: testEntity1Id,
        relClassName: "TestGeneratedClasses:ElemRel",
      },
    } as TestElementWithNavPropProps, imodel);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    assert.isDefined(ActualTestElementWithNavProp.prototype.getPredecessorIds);
    expect(
      [...elemWithNavProp.getPredecessorIds()],
    ).to.have.members(
      [elemWithNavProp.model, elemWithNavProp.code.scope, elemWithNavProp.parent?.id, testImplPredecessorId].filter((x) => x !== undefined)
    );

    expect(testElementWithNavPropCollectPredecessorsSpy.called).to.be.true;
    testElementWithNavPropCollectPredecessorsSpy.resetHistory();

    const derivedElemWithNavProp = new ActualDerivedWithNavProp({
      classFullName: DerivedWithNavProp.classFullName,
      navProp: {
        id: testEntity1Id,
        relClassName: "TestGeneratedClasses:ElemRel",
      },
      derivedNavProp: {
        id: testEntity2Id,
        relClassName: "TestGeneratedClasses:DerivedElemRel",
      },
    } as DerivedWithNavPropProps, imodel);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    assert.isDefined(ActualDerivedWithNavProp.prototype.getPredecessorIds);
    // This demonstrates that if a non-generated class has a registered non-biscore base, it will not get a generated impl,
    expect(
      [...derivedElemWithNavProp.getPredecessorIds()]
    ).to.have.members(
      [elemWithNavProp.model, elemWithNavProp.code.scope, elemWithNavProp.parent?.id, testImplPredecessorId].filter((x) => x !== undefined)
    );
    // explicitly check we called the super function
    // (we already know its implementation was called, because testImplPredecessorId is in the derived call's result)
    expect(testElementWithNavPropCollectPredecessorsSpy.called).to.be.true;

    sinon.restore();
    MyTestGeneratedClasses.unregisterSchema();
  });

  it("should work along a complex chain of overrides", async () => {
    class MyDerived2 extends Derived2 {
      public override collectPredecessorIds(predecessorIds: Id64Set) {
        super.collectPredecessorIds(predecessorIds);
        predecessorIds.add("derived-2");
      }
    }
    class MyDerived4 extends Derived4 {
      public override collectPredecessorIds(predecessorIds: Id64Set) {
        super.collectPredecessorIds(predecessorIds);
        predecessorIds.add("derived-4");
      }
    }
    class MyTestGeneratedClasses extends TestGeneratedClasses {
      public static override get classes() {
        // leaving Derived3,5,6 generated
        return [MyDerived2, MyDerived4];
      }
    }
    MyTestGeneratedClasses.registerSchema();

    /* eslint-disable @typescript-eslint/naming-convention */
    const ActualTestElementWithNavProp = imodel.getJsClass<typeof Element>("TestGeneratedClasses:TestElementWithNavProp");
    const ActualDerivedWithNavProp = imodel.getJsClass<typeof Element>("TestGeneratedClasses:DerivedWithNavProp");
    const ActualDerived2 = imodel.getJsClass<typeof Element>("TestGeneratedClasses:Derived2");
    const ActualDerived3 = imodel.getJsClass<typeof Element>("TestGeneratedClasses:Derived3");
    const ActualDerived4 = imodel.getJsClass<typeof Element>("TestGeneratedClasses:Derived4");
    const ActualDerived5 = imodel.getJsClass<typeof Element>("TestGeneratedClasses:Derived5");
    const ActualDerived6 = imodel.getJsClass<typeof Element>("TestGeneratedClasses:Derived6");
    /* eslint-enable @typescript-eslint/no-redeclare */

    expect(ActualTestElementWithNavProp.isGeneratedClass).to.be.true;
    expect(ActualDerivedWithNavProp.isGeneratedClass).to.be.true;
    expect(ActualDerived2.isGeneratedClass).to.be.false;
    expect(ActualDerived3.isGeneratedClass).to.be.true;
    expect(ActualDerived4.isGeneratedClass).to.be.false;
    expect(ActualDerived5.isGeneratedClass).to.be.true;
    expect(ActualDerived6.isGeneratedClass).to.be.true;

    assert.isTrue(ActualTestElementWithNavProp.prototype.hasOwnProperty("collectPredecessorIds" )); // should have automatic impl
    assert.isTrue(ActualDerivedWithNavProp.prototype.hasOwnProperty("collectPredecessorIds"));
    assert.isTrue(ActualDerived2.prototype.hasOwnProperty("collectPredecessorIds")); // non-generated; manually implements so has method
    assert.isFalse(ActualDerived3.prototype.hasOwnProperty("collectPredecessorIds")); // base is non-generated so it shouldn't get the automatic impl
    assert.isTrue(ActualDerived4.prototype.hasOwnProperty("collectPredecessorIds")); // manually implements so it should have the method
    assert.isFalse(ActualDerived5.prototype.hasOwnProperty("collectPredecessorIds")); // ancestor is non-generated so it shouldn't get the automatic impl
    assert.isFalse(ActualDerived6.prototype.hasOwnProperty("collectPredecessorIds")); // ancestor is non-generated so it shouldn't get the automatic impl

    const testEntity1Id = imodel.elements.insertElement({
      classFullName: "TestGeneratedClasses:Derived6",
      prop: "sample-value-1",
      model: IModelDb.dictionaryId,
      code: Code.createEmpty(),
    } as TestEntityProps);

    const testEntity2Id = imodel.elements.insertElement({
      classFullName: "TestGeneratedClasses:TestEntity",
      prop: "sample-value-2",
      model: IModelDb.dictionaryId,
      code: Code.createEmpty(),
    } as TestEntityProps);

    const derived6Id = imodel.elements.insertElement({
      classFullName: Derived6.classFullName,
      model: IModelDb.dictionaryId,
      navProp: {
        id: testEntity1Id,
        relClassName: "TestGeneratedClasses:ElemRel",
      },
      derivedNavProp: {
        id: testEntity2Id,
        relClassName: "TestGeneratedClasses:DerivedElemRel",
      },
    } as DerivedWithNavPropProps);

    const derived6 = imodel.elements.getElement(derived6Id);

    /** it is not possible to make a spy of an already existing spy, so lazy try making one
     * this is necessary since due to prototypes, some "methods" we listen to are actually the same
     */
    function spyCollectPredecessorIds(cls: typeof Element): sinon.SinonSpy {
      if ((cls.prototype as any).collectPredecessorIds.isSinonProxy) {
        return (cls.prototype as any).collectPredecessorIds;
      }
      return sinon.spy(cls.prototype, "collectPredecessorIds" as any);
    }

    const elementMethodSpy = spyCollectPredecessorIds(Element);
    const testElementWithNavPropSpy = spyCollectPredecessorIds(ActualTestElementWithNavProp);
    const derivedWithNavPropSpy = spyCollectPredecessorIds(ActualDerivedWithNavProp);
    const derived2Spy = spyCollectPredecessorIds(ActualDerived2);
    const derived3Spy = spyCollectPredecessorIds(ActualDerived3);
    const derived4Spy = spyCollectPredecessorIds(ActualDerived4);
    const derived5Spy = spyCollectPredecessorIds(ActualDerived5);
    const derived6Spy = spyCollectPredecessorIds(ActualDerived6);

    // This demonstrates that if a generated class (Derived6) has a non-generated ancestor, it will not get a generated impl
    // instead it will just call the closest non-generated ancestor (Derived4)
    expect([...derived6.getPredecessorIds()]).to.have.members(
      [
        derived6.model,
        derived6.code.scope,
        derived6.parent?.id,
        // "TestGeneratedClasses:Derived4" is MyDerived4 above, which extends the Derived4 class, which extends up
        // without any custom ancestor implementing collectPredecessorIds, so Element.collectPredecessorIds is called as the
        // super, and no navigation properties or other custom implementations are called so we only get "derived-4"
        "derived-4",
      ].filter((x) => x !== undefined)
    );

    expect(elementMethodSpy.called).to.be.true; // this is the `super.collectPredecessorIds` call in MyDerived4
    expect(testElementWithNavPropSpy.called).to.be.false;
    expect(derivedWithNavPropSpy.called).to.be.false;

    // these are the same (tested below)
    expect(derived2Spy.called).to.be.false;
    expect(derived3Spy.called).to.be.false;

    // these are all the same (tested below)
    expect(derived4Spy.called).to.be.true;
    expect(derived5Spy.called).to.be.true;
    expect(derived6Spy.called).to.be.true;

    expect(
      new Set(
        [
          Element,
          ActualTestElementWithNavProp,
          ActualDerivedWithNavProp,
          Derived2,
          Derived3, // same as above (so will be removed from set)
          Derived4,
          Derived5, // save as above (so will be removed from set)
          Derived6, // save as above (so will be removed from set)
        ].map((e) => e.prototype["collectPredecessorIds"]) // eslint-disable-line dot-notation
      )
    ).to.deep.equal(
      new Set(
        [
          Element,
          ActualTestElementWithNavProp,
          ActualDerivedWithNavProp,
          Derived2,
          Derived4,
        ].map((e) => e.prototype["collectPredecessorIds"]) // eslint-disable-line dot-notation
      )
    );

    MyTestGeneratedClasses.unregisterSchema();
    sinon.restore();
  });
});

class Base {
  public static staticProperty: string = "base";
  public static get sqlName(): string { return `s.${this.staticProperty}`; }
}

class Derived extends Base {
}

describe("Static Properties", () => {
  it("should be inherited, and the subclass should get its own copy", async () => {
    assert.equal(Base.staticProperty, "base");
    assert.equal(Derived.staticProperty, "base"); // Derived inherits Base's staticProperty (via its prototype)
    Derived.staticProperty = "derived";           // Derived now gets its own copy of staticProperty
    assert.equal(Base.staticProperty, "base");      // Base's staticProperty remains as it was
    assert.equal(Derived.staticProperty, "derived"); // Derived's staticProperty is now different
    assert.equal(Base.sqlName, "s.base");
    const d = new Derived();
    assert.equal((d.constructor as any).staticProperty, "derived"); // Instances of Derived see Derived.staticProperty
    const b = new Base();
    assert.equal((b.constructor as any).staticProperty, "base"); // Instances of Base see Base.staticProperty
  });

});