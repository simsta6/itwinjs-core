/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { shallow } from "enzyme";
import * as React from "react";
import { ToolAssistanceInstruction } from "../../../appui-layout-react";
import { mount } from "../../Utils";
import { SvgPlaceholder } from "@itwin/itwinui-icons-react";

describe("<ToolAssistanceInstruction />", () => {
  it("should render", () => {
    mount(<ToolAssistanceInstruction image={<SvgPlaceholder />} text="Test" />);
  });

  it("renders correctly", () => {
    shallow(<ToolAssistanceInstruction image={<SvgPlaceholder />} text="Test" />).should.matchSnapshot();
  });

  it("should render correctly with new", () => {
    mount(<ToolAssistanceInstruction image={<SvgPlaceholder />} text="Test" isNew />).should.matchSnapshot();
  });

  it("renders correctly with new", () => {
    shallow(<ToolAssistanceInstruction image={<SvgPlaceholder />} text="Test" isNew />).should.matchSnapshot();
  });
});
