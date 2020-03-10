/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Toolbar
 */
import * as React from "react";

import {
  ToolbarItemUtilities, CommonToolbarItem, ActionButton, GroupButton,
  CustomButtonDefinition,
  OnItemExecutedFunc,
  ConditionalStringValue,
  StringGetter,
} from "@bentley/ui-abstract";

import { IconHelper } from "@bentley/ui-core";
import { ToolItemDef } from "../shared/ToolItemDef";
import { CommandItemDef } from "../shared/CommandItemDef";
import { AnyItemDef } from "../shared/AnyItemDef";
import { CustomItemDef } from "../shared/CustomItemDef";
import { GroupItemDef } from "./GroupItem";
import { GroupButtonItem } from "./GroupButtonItem";
import { ActionButtonItem } from "./ActionButtonItem";
import { CustomToolbarItem } from "@bentley/ui-components";

/** Helper functions for defining an ToolbarComposer.
 * @beta
 */
export class ToolbarHelper {
  /** Construct CustomToolbarItem definitions given a CustomItemDef. */
  public static createCustomDefinitionToolbarItem(itemPriority: number, itemDef: CustomItemDef, overrides?: Partial<CustomButtonDefinition>): CustomToolbarItem {
    const isHidden = itemDef.isHidden;
    const isDisabled = itemDef.isDisabled;
    const internalData = new Map<string, any>();  // used to store ReactNode if iconSpec hold a ReactNode
    const icon = IconHelper.getIconData(itemDef.iconSpec, internalData);
    const label = this.getStringOrConditionalString(itemDef.rawLabel);
    const badgeType = itemDef.badgeType;

    // istanbul ignore else
    return {
      id: itemDef.id,
      itemPriority,
      icon,
      label,
      isCustom: true,
      isHidden,
      isDisabled,
      internalData,
      badgeType,
      buttonNode: itemDef.toolbarReactNode(),  // used by createNodeForToolbarItem below
      panelContentNode: itemDef.popupPanelNode,
      ...overrides,
    };
  }

  /** Construct ActionButton and GroupButton definitions given an array to ItemDefs. */
  public static constructChildToolbarItems(itemDefs: AnyItemDef[]): Array<ActionButton | GroupButton> {
    let count = 10;
    const items: Array<ActionButton | GroupButton> = [];
    for (const itemDef of itemDefs) {
      const item = this.createToolbarItemFromItemDef(count, itemDef);
      count = count + 10;
      // istanbul ignore else
      if (ToolbarItemUtilities.isActionButton(item) || ToolbarItemUtilities.isGroupButton(item))
        items.push(item);
    }
    return items;
  }

  private static getStringOrConditionalString(inString: string | StringGetter | ConditionalStringValue): string | ConditionalStringValue {
    if (inString instanceof ConditionalStringValue || typeof inString === "string")
      return inString;

    return inString();
  }

  public static getIconReactNode(item: ActionButton | GroupButton): React.ReactNode {
    return IconHelper.getIconReactNode(item.icon, item.internalData);
  }

  /** Helper method to creates a generic toolbar item entry */
  public static createToolbarItemFromItemDef(itemPriority: number, itemDef: AnyItemDef): CommonToolbarItem {
    const isHidden = itemDef.isHidden;
    const isDisabled = itemDef.isDisabled;
    const internalData = new Map<string, any>();  // used to store ReactNode if iconSpec hold a ReactNode
    const icon = IconHelper.getIconData(itemDef.iconSpec, internalData);
    const label = this.getStringOrConditionalString(itemDef.rawLabel);
    const badgeType = itemDef.badgeType;

    // istanbul ignore else
    if (itemDef instanceof CommandItemDef) {
      return {
        id: itemDef.id,
        itemPriority,
        icon,
        label,
        isHidden,
        isDisabled,
        isActive: itemDef.isActive,
        execute: itemDef.execute,
        badgeType,
        internalData,
      };
    } else if (itemDef instanceof CustomItemDef) {
      return ToolbarHelper.createCustomDefinitionToolbarItem(itemPriority, itemDef);
    } else if (itemDef instanceof GroupItemDef) {
      const children: Array<ActionButton | GroupButton> = this.constructChildToolbarItems(itemDef.items);
      return {
        id: itemDef.id,
        itemPriority,
        icon,
        label,
        panelLabel: itemDef.panelLabel,
        isHidden,
        isDisabled,
        items: children,
        isActive: false,
        badgeType,
        internalData,
      };
    } else if (itemDef instanceof ToolItemDef) {
      return {
        id: itemDef.id,
        itemPriority,
        icon,
        label,
        isHidden,
        isDisabled,
        isActive: itemDef.isActive,
        execute: itemDef.execute,
        badgeType,
        internalData,
      };
    } else {
      throw new Error(`Invalid Item type encountered, item id=${itemDef.id}`);
    }
  }

  public static createToolbarItemsFromItemDefs(itemDefs: AnyItemDef[], startingItemPriority = 10): CommonToolbarItem[] {
    let itemPriority = startingItemPriority;
    const items = itemDefs.map((itemDef: AnyItemDef) => {
      const item = ToolbarHelper.createToolbarItemFromItemDef(itemPriority, itemDef);
      itemPriority = itemPriority + 10;
      return item;
    });
    return items;
  }

  public static createNodeForToolbarItem(item: CommonToolbarItem, onItemExecuted?: OnItemExecutedFunc): React.ReactNode {
    if (ToolbarItemUtilities.isActionButton(item)) {
      return ActionButtonItem({ item, onItemExecuted });
    }

    if (ToolbarItemUtilities.isGroupButton(item)) {
      return GroupButtonItem({ item, onItemExecuted });
    }

    if (ToolbarHelper.isCustomToolbarButton(item)) {
      return item.buttonNode ? item.buttonNode : null;
    }

    return null;
  }

  /** CustomToolbarButton type guard.
   * @alpha
   */
  public static isCustomToolbarButton = (item: CommonToolbarItem): item is CustomToolbarItem => {
    return !!(item as CustomToolbarItem).isCustom && ("buttonNode" in item);
  }
}
