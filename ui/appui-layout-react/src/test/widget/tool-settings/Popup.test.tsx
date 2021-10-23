/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { shallow } from "enzyme";
import * as React from "react";
import { ToolSettingsPopup } from "../../../appui-layout-react";
import { mount } from "../../Utils";

describe("<ToolSettingsPopup />", () => {
  it("should render", () => {
    mount(<ToolSettingsPopup />);
  });

  it("renders correctly", () => {
    shallow(<ToolSettingsPopup />).should.matchSnapshot();
  });
});
