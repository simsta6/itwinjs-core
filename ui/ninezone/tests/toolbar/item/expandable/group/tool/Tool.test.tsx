/*---------------------------------------------------------------------------------------------
|  $Copyright: (c) 2018 Bentley Systems, Incorporated. All rights reserved. $
 *--------------------------------------------------------------------------------------------*/
import { mount, shallow } from "enzyme";
import * as React from "react";

import Tool from "../../../../../../src/toolbar/item/expandable/group/tool/Tool";

describe("<Tool />", () => {
  it("should render", () => {
    mount(<Tool />);
  });

  it("renders correctly", () => {
    shallow(<Tool />).should.matchSnapshot();
  });
});
