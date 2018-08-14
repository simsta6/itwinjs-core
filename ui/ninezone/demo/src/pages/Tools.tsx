/*---------------------------------------------------------------------------------------------
|  $Copyright: (c) 2018 Bentley Systems, Incorporated. All rights reserved. $
 *--------------------------------------------------------------------------------------------*/
import * as React from "react";

import Tray from "@src/toolbar/item/expandable/history/Tray";
import HistoryIcon from "@src/toolbar/item/expandable/history/Icon";
import Panel from "@src/toolbar/item/expandable/group/Panel";
import Group from "@src/toolbar/item/expandable/group/Group";
import Column from "@src/toolbar/item/expandable/group/Column";
import Nested from "@src/toolbar/item/expandable/group/Nested";
import Tool from "@src/toolbar/item/expandable/group/tool/Tool";
import Expander from "@src/toolbar/item/expandable/group/tool/Expander";
import Overflow from "@src/toolbar/item/Overflow";
import Expandable from "@src/toolbar/item/expandable/Expandable";
import Icon from "@src/toolbar/item/Icon";
import Toolbar from "@src/toolbar/Toolbar";
import Scrollable from "@src/toolbar/Scrollable";
import { Direction } from "@src/utilities/Direction";
import Button from "@src/toolbar/button/Button";
import App from "@src/toolbar/button/App";
import Back from "@src/toolbar/button/Back";
import ExpandableButton from "@src/toolbar/button/Expandable";
import IconButton from "@src/toolbar/button/Icon";

export interface State {
  onBackCount: number;
  isPanelVisible: boolean;
  direction: Direction;
}

export const cols2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gridAutoRows: "1fr",
  gridGap: "20px",
  alignItems: "center",
  justifyItems: "center",
};

export default class Tools extends React.Component<{}, State> {
  public readonly state: Readonly<State> = {
    onBackCount: 0,
    isPanelVisible: false,
    direction: Direction.Right,
  };

  private toggleIsPanelVisible = () => {
    this.setState((prevState) => ({
      ...prevState,
      isPanelVisible: !prevState.isPanelVisible,
    }));
  }

  private toggleDirection = () => {
    this.setState((prevState) => {
      let direction = prevState.direction;
      switch (direction) {
        case Direction.Left: {
          direction = Direction.Top;
          break;
        }
        case Direction.Top: {
          direction = Direction.Right;
          break;
        }
        case Direction.Right: {
          direction = Direction.Bottom;
          break;
        }
        case Direction.Bottom: {
          direction = Direction.Left;
          break;
        }
      }
      return {
        ...prevState,
        direction,
      };
    });
  }

  private getToolbarIcons1(direction: Direction) {
    return [
      <Expandable
        key={0}
        history={
          <Tray
            direction={direction}
            items={
              <HistoryIcon>
                <i className="icon icon-3d-cube" />
              </HistoryIcon>
            }
          />
        }
      >
        <Icon
          icon={
            <i className="icon icon-3d" />
          }
        />
      </Expandable>,
      <Expandable
        key={1}
        panel={!this.state.isPanelVisible ? undefined :
          <Panel>
            Other Tools
          </Panel>
        }
        history={this.state.isPanelVisible ? undefined :
          <Tray
            direction={direction}
            items={
              <>
                <HistoryIcon>
                  <i className="icon icon-3d-cube" />
                </HistoryIcon>
                <HistoryIcon>
                  <i className="icon icon-2d" />
                </HistoryIcon>
              </>
            }
          />
        }
      >
        <Icon
          icon={
            <i className="icon icon-2d" />
          }
          onClick={this.toggleIsPanelVisible}
        />
      </Expandable>,
      <Icon
        icon={
          <i className="icon icon-3d-cube" />
        }
        key={2} />,
    ];
  }

  private getToolbarIcons2(direction: Direction) {
    return [
      <Icon
        icon={
          <i className="icon icon-angle" />
        }
        key={3} />,
      <Icon
        icon={
          <i className="icon icon-apps-generic" />
        }
        key={4} />,
      <Icon
        icon={
          <i className="icon icon-filter" />
        }
        key={5}
      />,
      <Icon
        icon={
          <i className="icon icon-find" />
        }
        key={6}
      />,
      <Icon
        icon={
          <i className="icon icon-flag" />
        }
        key={7}
      />,
      ...this.getToolbarIcons1(direction),
    ];
  }

  public render() {
    let path = "../";
    for (let i = 0; i < this.state.onBackCount; i++) {
      path = "../" + path;
    }

    const icon = <i className="icon icon-3d-cube" />;
    return (
      <div style={{ padding: "10px" }}>
        <h1>Toolbar</h1>
        <div style={cols2}>
          <Toolbar
            expandsTo={Direction.Left}
            items={this.getToolbarIcons1(Direction.Left)}
          />
          <Toolbar
            expandsTo={Direction.Bottom}
            items={this.getToolbarIcons1(Direction.Bottom)}
          />
          <Toolbar
            expandsTo={Direction.Right}
            items={this.getToolbarIcons1(Direction.Right)}
          />
        </div>
        <h1>Overflow</h1>
        <Toolbar
          expandsTo={Direction.Right}
          items={
            <Overflow
              key="0"
              onClick={this.toggleIsPanelVisible}
              panel={!this.state.isPanelVisible ? undefined :
                <Panel>
                  Other Tools
                </Panel>
              }
            />
          }
        />
        <br />
        <div style={cols2}>
          <Scrollable
            expandsTo={Direction.Left}
            items={this.getToolbarIcons2(Direction.Left)}
          />
          <Scrollable
            expandsTo={Direction.Bottom}
            items={this.getToolbarIcons2(Direction.Bottom)}
          />
          <Scrollable
            expandsTo={Direction.Right}
            items={this.getToolbarIcons2(Direction.Right)}
          />
          <Scrollable
            expandsTo={Direction.Bottom}
            items={this.getToolbarIcons1(Direction.Bottom)}
          />
        </div>
        <h1>Tool Buttons</h1>
        <div style={cols2}>
          <Button>
            Anything here :)
          </Button>
          <IconButton
            icon={
              <i className="icon icon-camera" />
            }
          />
          <App
            icon={
              <i className="icon icon-home" />
            }
          />
          <Back
            icon={
              <i className="icon icon-progress-backward-2" />
            }
          />
          <ExpandableButton
            expanded={
              !this.state.isPanelVisible ? undefined :
                <div style={{ backgroundColor: "teal" }}>
                  Hello world
                </div>
            }
            direction={this.state.direction}
            button={
              <IconButton
                onClick={() => {
                  this.toggleIsPanelVisible();
                  if (!this.state.isPanelVisible)
                    return;
                  this.toggleDirection();
                }}
                icon={
                  <i className="icon icon-camera-animation" />
                }
              />
            }
          />
        </div>
        <h1>Tool Group</h1>
        <Panel>
          Panel with custom content
        </Panel>
        <br />
        <Group
          title="Tool Group"
          columns={
            <>
              <Column>
                <Tool icon={icon} label="Tool1" />
                <Expander icon={icon} label="Expander" />
              </Column>
              <Column>
                <Tool icon={icon} label="Tool3" />
                <Tool icon={icon} label="Tool4" />
              </Column>
            </>
          }
        />
        <br />
        <Nested
          title="Nested"
          columns={path}
          onBack={() => this.setState((prevState) => ({
            ...prevState,
            onBackCount: prevState.onBackCount + 1,
          }))}
        />
      </div >
    );
  }
}
