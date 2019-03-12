/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
/** @module Toolbar */

import * as classnames from "classnames";
import * as React from "react";
import { CommonProps } from "../../../utilities/Props";
import "./Button.scss";

/** Properties of [[ToolbarButton]] component. */
export interface ToolbarButtonProps extends CommonProps {
  /** Button content. */
  children?: React.ReactNode;
  /** Function called when the button is clicked. */
  onClick?: () => void;
}

/** Basic toolbar button. Used in [[Toolbar]] component. */
export class ToolbarButton extends React.PureComponent<ToolbarButtonProps> {
  public render() {
    const onClick = (): void => {
      // tslint:disable-next-line:no-console
      console.log("got onClick");
      if (this.props.onClick)
        this.props.onClick();
    };

    const className = classnames(
      "nz-toolbar-button-button",
      this.props.className);

    return (
      <button
        className={className}
        style={this.props.style}
        onClick={onClick}
      >
        <div className="nz-gradient" />
        {this.props.children}
      </button>
    );
  }
}
