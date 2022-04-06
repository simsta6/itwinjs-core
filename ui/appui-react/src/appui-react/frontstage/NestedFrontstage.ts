/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Frontstage
 */

import { CommandItemDef } from "../shared/CommandItemDef";
import { FrontstageManager } from "./FrontstageManager";
import { IconSpecUtilities } from "@itwin/appui-abstract";
import svgProgressBackwardCircular from "@bentley/icons-generic/icons/progress-backward.svg";

/**
 * Nested Frontstage related classes and commands
 * @public
 */
export class NestedFrontstage {
  /** Command that returns to the previous Frontstage */
  private static iconSpec = IconSpecUtilities.createWebComponentIconSpec(svgProgressBackwardCircular);
  public static get backToPreviousFrontstageCommand() {
    return new CommandItemDef({
      commandId: "backToPreviousFrontstage",
      iconSpec: NestedFrontstage.iconSpec,
      labelKey: "UiFramework:commands.backToPreviousFrontstage",
      execute: async () => {
        await FrontstageManager.closeNestedFrontstage();
      },
    });
  }
}
