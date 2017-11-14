/*---------------------------------------------------------------------------------------------
|  $Copyright: (c) 2017 Bentley Systems, Incorporated. All rights reserved. $
 *--------------------------------------------------------------------------------------------*/
import { Id64 } from "@bentley/bentleyjs-core/lib/Id";
import { JsonUtils } from "@bentley/bentleyjs-core/lib/JsonUtils";
import { ModelProps } from "../common/ModelProps";
import { Entity } from "./Entity";
import { IModelDb } from "./IModelDb";

/** A Model within an iModel */
export class Model extends Entity implements ModelProps {
  public modeledElement: Id64;
  public parentModel: Id64;
  public jsonProperties: any;
  public isPrivate: boolean;
  public isTemplate: boolean;

  constructor(props: ModelProps, iModel: IModelDb) {
    super(props, iModel);
    this.id = new Id64(props.id);
    this.modeledElement = new Id64(props.modeledElement);
    this.parentModel = new Id64(props.parentModel);
    this.isPrivate = JsonUtils.asBool(props.isPrivate);
    this.isTemplate = JsonUtils.asBool(props.isTemplate);
    this.jsonProperties = Object.assign({}, props.jsonProperties); // make sure we have our own copy
  }

  /** Add all custom-handled properties of a Model to a json object. */
  public toJSON(): ModelProps {
    const val = super.toJSON() as ModelProps;
    if (this.id.isValid())
      val.id = this.id;
    if (this.modeledElement.isValid())
      val.modeledElement = this.modeledElement;
    if (this.parentModel.isValid())
      val.parentModel = this.parentModel;
    if (this.isPrivate)
      val.isPrivate = this.isPrivate;
    if (this.isTemplate)
      val.isTemplate = this.isTemplate;
    if (Object.keys(this.jsonProperties).length > 0)
      val.jsonProperties = this.jsonProperties;
    return val;
  }

  /** Get the Id of the special dictionary model */
  public static getDictionaryId(): Id64 { return new Id64("0x10"); }
}

/** A geometric model */
export class GeometricModel extends Model {
}
