/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import { assert } from "chai";
import * as path from "path";
import { Guid, Id64String, Id64 } from "@bentley/bentleyjs-core";
import {
  CategoryProps, Code, IModel, ILinearElementProps, InformationPartitionElementProps, GeometricElement3dProps,
  LinearlyLocatedAttributionProps, LinearlyReferencedFromToLocationProps,
} from "@bentley/imodeljs-common";
import {
  BackendRequestContext, LinearReferencingSchema,
  PhysicalModel, IModelDb, SpatialCategory, PhysicalPartition, SubjectOwnsPartitionElements, LinearlyReferencedFromToLocation, Schema, Schemas, ClassRegistry,
} from "../../imodeljs-backend";
import { IModelTestUtils } from "../IModelTestUtils";
import { LinearElement, LinearlyLocated, LinearlyLocatedAttribution, LinearlyLocatedSingleFromTo } from "../../domains/LinearReferencingElements";

class TestLinearReferencingSchema extends Schema {
  public static get schemaName(): string { return "TestLinearReferencing"; }
  public static get schemaFilePath(): string { return path.join(__dirname, "../assets/TestLinearReferencing.ecschema.xml"); }
  public static registerSchema() {
    if (this !== Schemas.getRegisteredSchema(this.schemaName)) {
      Schemas.unregisterSchema(this.schemaName);
      Schemas.registerSchema(this);

      ClassRegistry.register(TestLinearlyLocatedAttribution, this);
    }
  }
}

class TestLinearlyLocatedAttribution extends LinearlyLocatedAttribution implements LinearlyLocatedSingleFromTo {
  public static get className(): string { return "TestLinearlyLocatedAttribution"; }

  public constructor(props: LinearlyLocatedAttributionProps, iModel: IModelDb) {
    super(props, iModel);
  }

  private static toProps(modelId: Id64String, categoryId: Id64String, attributedElementId: Id64String): LinearlyLocatedAttributionProps {
    const props: LinearlyLocatedAttributionProps = {
      classFullName: TestLinearlyLocatedAttribution.classFullName,
      category: categoryId,
      model: modelId,
      code: Code.createEmpty(),
      attributedElement: { id: attributedElementId },
    };

    return props;
  }

  public getLinearElementId(): Id64String | undefined {
    return LinearlyLocated.getLinearElementId(this.iModel, this.id);
  }

  public getFromToLocation(): LinearlyReferencedFromToLocation | undefined {
    return LinearlyLocated.getFromToLocation(this.iModel, this.id);
  }

  public updateFromToLocation(linearLocation: LinearlyReferencedFromToLocationProps, aspectId?: Id64String): void {
    LinearlyLocated.updateFromToLocation(this.iModel, this.id, linearLocation, aspectId);
  }

  public static insertFromTo(iModel: IModelDb, modelId: Id64String, categoryId: Id64String, linearElementId: Id64String,
    fromToPosition: LinearlyReferencedFromToLocationProps, attributedElementId: Id64String): Id64String {
    return LinearlyLocated.insertFromTo(iModel, this.toProps(modelId, categoryId, attributedElementId), linearElementId, fromToPosition);
  }
}

describe("LinearReferencing Domain", () => {
  const requestContext = new BackendRequestContext();

  it("should create elements exercising the LinearReferencing domain", async () => {
    const iModelDb: IModelDb = IModelDb.createSnapshot(IModelTestUtils.prepareOutputFile("LinearReferencingDomain", "LinearReferencingTest.bim"), {
      rootSubject: { name: "LinearReferencingTest", description: "Test of the LinearReferencing domain schema." },
      client: "LinearReferencing",
      globalOrigin: { x: 0, y: 0 },
      projectExtents: { low: { x: -500, y: -500, z: -50 }, high: { x: 500, y: 500, z: 50 } },
      guid: Guid.createValue(),
    });

    // Import the LinearReferencing schema
    await iModelDb.importSchemas(requestContext, [LinearReferencingSchema.schemaFilePath, TestLinearReferencingSchema.schemaFilePath]);
    LinearReferencingSchema.registerSchema();
    TestLinearReferencingSchema.registerSchema();
    iModelDb.saveChanges("Import TestLinearReferencing schema");

    // Insert a SpatialCategory
    const spatialCategoryProps: CategoryProps = {
      classFullName: SpatialCategory.classFullName,
      model: IModel.dictionaryId,
      code: SpatialCategory.createCode(iModelDb, IModel.dictionaryId, "Test Spatial Category"),
      isPrivate: false,
    };
    const spatialCategoryId: Id64String = iModelDb.elements.insertElement(spatialCategoryProps);
    assert.isTrue(Id64.isValidId64(spatialCategoryId));

    // Create and populate a bis:PhysicalModel
    const physicalPartitionProps: InformationPartitionElementProps = {
      classFullName: PhysicalPartition.classFullName,
      model: IModel.repositoryModelId,
      parent: new SubjectOwnsPartitionElements(IModel.rootSubjectId),
      code: PhysicalPartition.createCode(iModelDb, IModel.rootSubjectId, "Test Physical Model"),
    };
    const physicalPartitionId: Id64String = iModelDb.elements.insertElement(physicalPartitionProps);
    assert.isTrue(Id64.isValidId64(physicalPartitionId));
    const physicalModel: PhysicalModel = iModelDb.models.createModel({
      classFullName: PhysicalModel.classFullName,
      modeledElement: { id: physicalPartitionId },
    }) as PhysicalModel;
    const physicalModelId: Id64String = iModelDb.models.insertModel(physicalModel);
    assert.isTrue(Id64.isValidId64(physicalModelId));

    // Create a Test Feature element
    const testLinearFeatureProps: GeometricElement3dProps = {
      classFullName: "TestLinearReferencing:TestLinearFeature",
      model: physicalModelId,
      category: spatialCategoryId,
      code: Code.createEmpty(),
    };
    const linearFeatureElementId: Id64String = iModelDb.elements.insertElement(testLinearFeatureProps);
    assert.isTrue(Id64.isValidId64(linearFeatureElementId));

    // Create a Test LinearElement instance
    const linearElementProps: ILinearElementProps = {
      classFullName: "TestLinearReferencing:TestLinearElement",
      model: physicalModelId,
      source: { id: linearFeatureElementId },
      startValue: 0.0,
      lengthValue: 100.0,
      category: spatialCategoryId,
      code: Code.createEmpty(),
    };
    const linearElementId: Id64String = iModelDb.elements.insertElement(linearElementProps);
    assert.isTrue(Id64.isValidId64(linearElementId));

    // Create a Test LinearlyLocatedAttribution element
    let linearFromToPosition: LinearlyReferencedFromToLocationProps = {
      fromPosition: { distanceAlongFromStart: 10.0 },
      toPosition: { distanceAlongFromStart: 70.0 },
    };

    const linearlyLocatedAttributionId = TestLinearlyLocatedAttribution.insertFromTo(
      iModelDb, physicalModelId, spatialCategoryId, linearElementId, linearFromToPosition, linearFeatureElementId);
    assert.isTrue(Id64.isValidId64(linearlyLocatedAttributionId));
    assert.equal(linearElementId, LinearlyLocated.getLinearElementId(iModelDb, linearlyLocatedAttributionId));

    const linearLocationAspects = LinearlyLocated.getFromToLocations(iModelDb, linearlyLocatedAttributionId);
    assert.equal(linearLocationAspects.length, 1);

    let linearLocationAspect = LinearlyLocated.getFromToLocation(iModelDb, linearlyLocatedAttributionId);
    assert.isFalse(linearLocationAspect === undefined);
    assert.equal(linearLocationAspect!.fromPosition.distanceAlongFromStart, 10.0);
    assert.equal(linearLocationAspect!.toPosition.distanceAlongFromStart, 70.0);

    const linearlyLocatedAttribution = iModelDb.elements.getElement<TestLinearlyLocatedAttribution>(linearlyLocatedAttributionId);
    linearLocationAspect = linearlyLocatedAttribution.getFromToLocation();
    assert.equal(linearLocationAspect!.fromPosition.distanceAlongFromStart, 10.0);
    assert.equal(linearLocationAspect!.toPosition.distanceAlongFromStart, 70.0);
    assert.equal(linearlyLocatedAttribution.getLinearElementId(), linearElementId);

    // TODO: Enable testing of updateFromToLocation below once iModel.elements.updateAspect is fixed.
    // It currently doesn't work with LinearReferencing aspects since its schema declares handlers.
    // linearFromToPosition.fromPosition.distanceAlongFromStart = 10.0;
    // linearlyLocatedAttribution.updateFromToLocation(linearFromToPosition, linearLocationAspect!.id);

    // linearLocationAspect = linearlyLocatedAttribution.getFromToLocation();
    // assert.equal(linearLocationAspect!.fromPosition.distanceAlongFromStart, 10.0);
    // assert.equal(linearLocationAspect!.toPosition.distanceAlongFromStart, 70.0);

    // Create a Test PhysicalLinear element
    const testPhysicalLinarProps: GeometricElement3dProps = {
      classFullName: "TestLinearReferencing:TestLinearPhysicalElement",
      model: physicalModelId,
      category: spatialCategoryId,
      code: Code.createEmpty(),
    };

    linearFromToPosition = {
      fromPosition: { distanceAlongFromStart: 30.0 },
      toPosition: { distanceAlongFromStart: 60.0 },
    };

    const linearPhysicalElementId: Id64String =
      LinearlyLocated.insertFromTo(iModelDb, testPhysicalLinarProps, linearElementId, linearFromToPosition);
    assert.isTrue(Id64.isValidId64(linearPhysicalElementId));
    assert.equal(linearElementId, LinearlyLocated.getLinearElementId(iModelDb, linearPhysicalElementId));

    // Query for linearly located elements via the queryLinearLocations API
    let linearLocationRefs = LinearElement.queryLinearLocations(iModelDb, linearElementId,
      { fromDistanceAlong: 10.0, toDistanceAlong: 70.0 });
    assert.equal(linearLocationRefs.length, 2);
    assert.equal(linearLocationRefs[0].linearlyLocatedId, linearlyLocatedAttributionId);
    assert.equal(linearLocationRefs[0].linearlyLocatedClassFullName, "TestLinearReferencing:TestLinearlyLocatedAttribution");
    assert.equal(linearLocationRefs[0].startDistanceAlong, 10.0);
    assert.equal(linearLocationRefs[0].stopDistanceAlong, 70.0);

    assert.equal(linearLocationRefs[1].linearlyLocatedId, linearPhysicalElementId);
    assert.equal(linearLocationRefs[1].linearlyLocatedClassFullName, "TestLinearReferencing:TestLinearPhysicalElement");
    assert.equal(linearLocationRefs[1].startDistanceAlong, 30.0);
    assert.equal(linearLocationRefs[1].stopDistanceAlong, 60.0);

    linearLocationRefs = LinearElement.queryLinearLocations(iModelDb, linearElementId,
      { linearlyLocatedClassFullNames: ["TestLinearReferencing:TestLinearlyLocatedAttribution"] });
    assert.equal(linearLocationRefs.length, 1);
    assert.equal(linearLocationRefs[0].linearlyLocatedId, linearlyLocatedAttributionId);

    linearLocationRefs = LinearElement.queryLinearLocations(iModelDb, linearElementId,
      {
        linearlyLocatedClassFullNames: ["TestLinearReferencing:TestLinearlyLocatedAttribution",
          "TestLinearReferencing:TestLinearPhysicalElement"],
      });
    assert.equal(linearLocationRefs.length, 2);
    assert.equal(linearLocationRefs[0].linearlyLocatedId, linearlyLocatedAttributionId);
    assert.equal(linearLocationRefs[1].linearlyLocatedId, linearPhysicalElementId);

    iModelDb.saveChanges("Insert Test LinearReferencing elements");

    iModelDb.closeSnapshot();
  });
});
