/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Schema
 */

import { ConcreteEntityId, ConcreteEntityIdSet,  Id64String } from "@itwin/core-bentley";
import type { Entity } from "./Entity";
import { Element } from "./Element";
import { ElementAspect } from "./ElementAspect";
import { Relationship } from "./Relationship";

// re-export so consumers don't need to manually import the basic types we are extending
export { ConcreteEntityIdSet, ConcreteEntityId };

// FIXME: Aspect needs to be split into Multi and Unique, and relationship into Drives, Refers, ModelSelectorRefersTo
/** an entity that can be created  */
type ConcreteEntity = Element | ElementAspect | Relationship;

/**
 * Utility function namespace for the ConcreteEntityId type which is a string
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare
export namespace ConcreteEntityIds {
  export function from(entity: ConcreteEntity): ConcreteEntityId {
    return `${entity instanceof Element ? "e" : entity instanceof ElementAspect ? "a" : "r"}:${entity.id}`;
  }
  export function fromClass(entityClass: typeof Entity, id: Id64String): ConcreteEntityId {
    return `${entityClass.is(Element) ? "e": entityClass.is(ElementAspect)  ? "a" : "r"}:${id}`;
  }
}
