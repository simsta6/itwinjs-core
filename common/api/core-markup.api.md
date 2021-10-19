## API Report File for "@itwin/core-markup"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { BeButtonEvent } from '@itwin/core-frontend';
import { BeEvent } from '@itwin/core-bentley';
import { BeModifierKeys } from '@itwin/core-frontend';
import { BeTouchEvent } from '@itwin/core-frontend';
import { Box } from '@svgdotjs/svg.js';
import { Element } from '@svgdotjs/svg.js';
import { EventHandled } from '@itwin/core-frontend';
import { G } from '@svgdotjs/svg.js';
import { Marker } from '@svgdotjs/svg.js';
import { Matrix } from '@svgdotjs/svg.js';
import { Point2d } from '@itwin/core-geometry';
import { Point3d } from '@itwin/core-geometry';
import { PrimitiveTool } from '@itwin/core-frontend';
import { ScreenViewport } from '@itwin/core-frontend';
import { Svg } from '@svgdotjs/svg.js';
import { Text } from '@svgdotjs/svg.js';
import { Transform } from '@itwin/core-geometry';
import { Viewport } from '@itwin/core-frontend';
import { XAndY } from '@itwin/core-geometry';

// @public
export class ArrowTool extends RedlineTool {
    constructor(_arrowPos?: string | undefined);
    // (undocumented)
    protected _arrowPos?: string | undefined;
    // (undocumented)
    protected createMarkup(svgMarkup: G, ev: BeButtonEvent, isDynamics: boolean): void;
    // (undocumented)
    protected getOrCreateArrowMarker(color: string): Marker;
    // (undocumented)
    static iconSpec: string;
    // (undocumented)
    protected showPrompt(): void;
    // (undocumented)
    static toolId: string;
}

// @public
export class CircleTool extends RedlineTool {
    // (undocumented)
    protected createMarkup(svgMarkup: G, ev: BeButtonEvent, isDynamics: boolean): void;
    // (undocumented)
    static iconSpec: string;
    // (undocumented)
    protected showPrompt(): void;
    // (undocumented)
    static toolId: string;
}

// @public
export class CloudTool extends RedlineTool {
    // (undocumented)
    protected clearDynamicsMarkup(isDynamics: boolean): void;
    // (undocumented)
    protected _cloud?: Element;
    // (undocumented)
    protected createMarkup(svgMarkup: G, ev: BeButtonEvent, isDynamics: boolean): void;
    // (undocumented)
    static iconSpec: string;
    // (undocumented)
    protected showPrompt(): void;
    // (undocumented)
    static toolId: string;
}

// @public
export class DistanceTool extends ArrowTool {
    // (undocumented)
    protected createMarkup(svgMarkup: G, ev: BeButtonEvent, isDynamics: boolean): void;
    // (undocumented)
    protected getFormattedDistance(distance: number): string | undefined;
    // (undocumented)
    static iconSpec: string;
    // (undocumented)
    onDataButtonDown(ev: BeButtonEvent): Promise<EventHandled>;
    // (undocumented)
    protected setupAndPromptForNextAction(): void;
    // (undocumented)
    protected showPrompt(): void;
    // (undocumented)
    protected readonly _startPointWorld: Point3d;
    // (undocumented)
    static toolId: string;
}

// @public
export class EditTextTool extends MarkupTool {
    constructor(text?: G | Text | undefined, _fromPlaceTool?: boolean);
    // (undocumented)
    boxed?: G;
    // (undocumented)
    editDiv?: HTMLDivElement;
    // (undocumented)
    editor?: HTMLTextAreaElement;
    // (undocumented)
    static iconSpec: string;
    onCleanup(): Promise<void>;
    // (undocumented)
    onDataButtonUp(_ev: BeButtonEvent): Promise<EventHandled>;
    // (undocumented)
    onInstall(): Promise<boolean>;
    // (undocumented)
    onMouseStartDrag(_ev: BeButtonEvent): Promise<EventHandled>;
    // (undocumented)
    onResetButtonUp(_ev: BeButtonEvent): Promise<EventHandled>;
    // (undocumented)
    protected showPrompt(): void;
    startEditor(): void;
    // (undocumented)
    text?: G | Text | undefined;
    // (undocumented)
    static toolId: string;
}

// @public
export class EllipseTool extends RedlineTool {
    // (undocumented)
    protected createMarkup(svgMarkup: G, ev: BeButtonEvent, isDynamics: boolean): void;
    // (undocumented)
    static iconSpec: string;
    // (undocumented)
    protected showPrompt(): void;
    // (undocumented)
    static toolId: string;
}

// @public
export class Handles {
    constructor(ss: MarkupSelected, el: Element);
    // (undocumented)
    active?: ModifyHandle;
    cancelDrag(): void;
    // (undocumented)
    drag(ev: BeButtonEvent): void;
    // (undocumented)
    dragging: boolean;
    // (undocumented)
    draw(): void;
    // (undocumented)
    el: Element;
    endDrag(undo: UndoManager): EventHandled;
    // (undocumented)
    group: G;
    // (undocumented)
    readonly handles: ModifyHandle[];
    // (undocumented)
    npcToBox(p: XAndY): Point2d;
    // (undocumented)
    npcToVb(p: XAndY, result?: Point2d): Point2d;
    // (undocumented)
    npcToVbArray(pts: Point2d[]): Point2d[];
    // (undocumented)
    npcToVbTrn: Transform;
    // (undocumented)
    remove(): void;
    // (undocumented)
    ss: MarkupSelected;
    // (undocumented)
    startDrag(ev: BeButtonEvent): EventHandled;
    // (undocumented)
    vbToBox(p: XAndY, result?: Point2d): Point2d;
    // (undocumented)
    vbToBoxTrn: Transform;
}

// @internal
export function initSvgExt(): void;

// @public
export class LineTool extends RedlineTool {
    // (undocumented)
    protected createMarkup(svgMarkup: G, ev: BeButtonEvent, isDynamics: boolean): void;
    // (undocumented)
    static iconSpec: string;
    // (undocumented)
    protected showPrompt(): void;
    // (undocumented)
    static toolId: string;
}

// @public
export class Markup {
    constructor(vp: ScreenViewport, markupData?: MarkupSvgData);
    bringToFront(): void;
    deleteSelected(): void;
    destroy(): void;
    disablePick(): void;
    enablePick(): void;
    groupSelected(): void;
    // @internal (undocumented)
    readonly markupDiv: HTMLDivElement;
    // @internal (undocumented)
    readonly selected: MarkupSelected;
    sendToBack(): void;
    setCursor(cursor: string): void;
    // @internal (undocumented)
    readonly svgContainer?: Svg;
    // @internal (undocumented)
    readonly svgDecorations?: G;
    // @internal (undocumented)
    readonly svgDynamics?: G;
    // @internal (undocumented)
    readonly svgMarkup?: G;
    // @internal (undocumented)
    readonly undo: UndoManager;
    ungroupSelected(): void;
    // (undocumented)
    vp: ScreenViewport;
}

// @public
export class MarkupApp {
    // @internal (undocumented)
    static get boxedTextClass(): string;
    // @internal (undocumented)
    static get containerClass(): string;
    // @internal (undocumented)
    static convertVpToVb(pt: XAndY): Point3d;
    // @internal (undocumented)
    static get cornerId(): string;
    // (undocumented)
    protected static createMarkup(view: ScreenViewport, markupData?: MarkupSvgData): Markup;
    // @internal (undocumented)
    static get decorationsClass(): string;
    // @internal (undocumented)
    static get dropShadowId(): string;
    // @internal (undocumented)
    static get dynamicsClass(): string;
    // @internal (undocumented)
    static getActionName(action: string): string;
    // @internal (undocumented)
    static getVpToScreenMtx(): Matrix;
    // @internal (undocumented)
    static getVpToVbMtx(): Matrix;
    static initialize(): Promise<void>;
    static get isActive(): boolean;
    // (undocumented)
    protected static lockViewportSize(view: ScreenViewport, markupData?: MarkupSvgData): void;
    static markup?: Markup;
    // @internal (undocumented)
    static markupPrefix: string;
    // (undocumented)
    static markupSelectToolId: string;
    // @internal (undocumented)
    static get markupSvgClass(): string;
    // @internal (undocumented)
    static get moveHandleClass(): string;
    static namespace?: string;
    static props: {
        handles: {
            size: number;
            stretch: {
                "fill-opacity": number;
                stroke: string;
                fill: string;
            };
            rotateLine: {
                stroke: string;
                "fill-opacity": number;
            };
            rotate: {
                cursor: string;
                "fill-opacity": number;
                stroke: string;
                fill: string;
            };
            moveOutline: {
                cursor: string;
                "stroke-dasharray": string;
                fill: string;
                "stroke-opacity": number;
                stroke: string;
            };
            move: {
                cursor: string;
                opacity: number;
                "stroke-width": number;
                stroke: string;
            };
            vertex: {
                cursor: string;
                "fill-opacity": number;
                stroke: string;
                fill: string;
            };
        };
        hilite: {
            color: string;
            flash: string;
        };
        dropShadow: {
            enable: boolean;
            attr: {
                stdDeviation: number;
                dx: number;
                dy: number;
                "flood-color": string;
            };
        };
        active: {
            text: {
                "font-family": string;
                "font-size": string;
                stroke: string;
                fill: string;
            };
            element: {
                stroke: string;
                "stroke-opacity": number;
                "stroke-width": number;
                "stroke-dasharray": number;
                "stroke-linecap": string;
                "stroke-linejoin": string;
                fill: string;
                "fill-opacity": number;
            };
            arrow: {
                length: number;
                width: number;
            };
            cloud: {
                path: string;
            };
        };
        text: {
            startValue: string;
            edit: {
                background: string;
                size: {
                    width: string;
                    height: string;
                };
                fontSize: string;
                textBox: {
                    fill: string;
                    "fill-opacity": number;
                    "stroke-opacity": number;
                    stroke: string;
                };
            };
        };
        borderOutline: {
            stroke: string;
            "stroke-width": number;
            "stroke-opacity": number;
            fill: string;
        };
        borderCorners: {
            stroke: string;
            "stroke-width": number;
            "stroke-opacity": number;
            fill: string;
            "fill-opacity": number;
        };
        result: {
            imageFormat: string;
            imprintSvgOnImage: boolean;
            maxWidth: number;
        };
    };
    // @internal (undocumented)
    protected static readMarkup(): Promise<MarkupData>;
    // @internal
    protected static readMarkupSvg(): string | undefined;
    // @internal
    protected static readMarkupSvgForDrawImage(): string | undefined;
    // @internal (undocumented)
    static get rotateHandleClass(): string;
    // @internal (undocumented)
    static get rotateLineClass(): string;
    // @internal (undocumented)
    static screenToVbMtx(): Matrix;
    static start(view: ScreenViewport, markupData?: MarkupSvgData): Promise<void>;
    static stop(): Promise<MarkupData>;
    // @internal (undocumented)
    static get stretchHandleClass(): string;
    // @internal (undocumented)
    static get textClass(): string;
    // @internal (undocumented)
    static get textEditorClass(): string;
    // @internal (undocumented)
    static get textOutlineClass(): string;
    // @internal (undocumented)
    static get vertexHandleClass(): string;
}

// @public (undocumented)
export interface MarkupColor {
    // (undocumented)
    fill: any;
    // (undocumented)
    stroke: any;
}

// @public
export interface MarkupData extends MarkupSvgData {
    image?: string;
}

// @public
export class MarkupSelected {
    constructor(svg: G);
    add(el: Element): void;
    // (undocumented)
    clearEditors(): void;
    // (undocumented)
    deleteAll(undo: UndoManager): void;
    drop(el: Element): boolean;
    // (undocumented)
    readonly elements: Set<Element>;
    // (undocumented)
    emptyAll(): void;
    // (undocumented)
    groupAll(undo: UndoManager): void;
    // (undocumented)
    handles?: Handles;
    // (undocumented)
    has(el: Element): boolean;
    // (undocumented)
    get isEmpty(): boolean;
    readonly onChanged: BeEvent<(selected: MarkupSelected) => void>;
    replace(oldEl: Element, newEl: Element): void;
    reposition(cmdName: string, undo: UndoManager, fn: (el: Element) => void): void;
    // (undocumented)
    restart(el?: Element): void;
    // (undocumented)
    get size(): number;
    // (undocumented)
    sizeChanged(): void;
    // (undocumented)
    svg: G;
    // (undocumented)
    ungroupAll(undo: UndoManager): void;
}

// @public
export interface MarkupSvgData {
    rect: WidthAndHeight;
    svg?: string;
}

// @public
export abstract class MarkupTool extends PrimitiveTool {
    // @internal (undocumented)
    createBoxedText(g: G, text: Text): G;
    // (undocumented)
    isCompatibleViewport(vp: Viewport | undefined, isSelectedViewChange: boolean): boolean;
    // (undocumented)
    markup: Markup;
    // (undocumented)
    onInstall(): Promise<boolean>;
    // (undocumented)
    onPostInstall(): Promise<void>;
    // (undocumented)
    onRestartTool(): Promise<void>;
    // (undocumented)
    onTouchCancel(ev: BeTouchEvent): Promise<void>;
    // (undocumented)
    onTouchComplete(ev: BeTouchEvent): Promise<void>;
    // (undocumented)
    onTouchMove(ev: BeTouchEvent): Promise<void>;
    // (undocumented)
    onTouchMoveStart(ev: BeTouchEvent, startEv: BeTouchEvent): Promise<EventHandled>;
    // (undocumented)
    onUnsuspend(): Promise<void>;
    // (undocumented)
    protected outputMarkupPrompt(msg: string): void;
    pickElement(pt: XAndY): Element | undefined;
    // (undocumented)
    redoPreviousStep(): Promise<boolean>;
    // (undocumented)
    requireWriteableTarget(): boolean;
    // (undocumented)
    protected setCurrentStyle(element: Element, canBeFilled: boolean): void;
    // (undocumented)
    protected setCurrentTextStyle(element: Element): void;
    // (undocumented)
    protected setupAndPromptForNextAction(): void;
    // (undocumented)
    protected showPrompt(): void;
    // (undocumented)
    static toolKey: string;
    // (undocumented)
    undoPreviousStep(): Promise<boolean>;
}

// @public
export abstract class ModifyHandle {
    constructor(handles: Handles);
    // (undocumented)
    addTouchPadding(visible: Element, handles: Handles): Element;
    // (undocumented)
    handles: Handles;
    abstract modify(ev: BeButtonEvent): void;
    // (undocumented)
    onClick(_ev: BeButtonEvent): Promise<void>;
    // (undocumented)
    setMouseHandler(target: Element): void;
    abstract setPosition(): void;
    startDrag(_ev: BeButtonEvent, makeCopy?: boolean): void;
    // (undocumented)
    startModify(makeCopy: boolean): void;
    // (undocumented)
    vbToStartTrn: Transform;
}

// @public
export class PlaceTextTool extends RedlineTool {
    // (undocumented)
    protected createMarkup(svg: G, ev: BeButtonEvent, isDynamics: boolean): Promise<void>;
    // (undocumented)
    static iconSpec: string;
    // (undocumented)
    protected _minPoints: number;
    // (undocumented)
    protected _nRequiredPoints: number;
    // (undocumented)
    onPostInstall(): Promise<void>;
    // (undocumented)
    onResetButtonUp(_ev: BeButtonEvent): Promise<EventHandled>;
    // (undocumented)
    protected showPrompt(): void;
    // (undocumented)
    static toolId: string;
    // (undocumented)
    protected _value: string;
}

// @public
export class PolygonTool extends RedlineTool {
    constructor(_numSides?: number | undefined);
    // (undocumented)
    protected createMarkup(svgMarkup: G, ev: BeButtonEvent, isDynamics: boolean): void;
    // (undocumented)
    protected getPoints(points: number[], center: Point3d, edge: Point3d, numSides: number, inscribe: boolean): boolean;
    // (undocumented)
    static iconSpec: string;
    // (undocumented)
    protected _numSides?: number | undefined;
    // (undocumented)
    protected showPrompt(): void;
    // (undocumented)
    static toolId: string;
}

// @public
export class RectangleTool extends RedlineTool {
    constructor(_cornerRadius?: number | undefined);
    // (undocumented)
    protected _cornerRadius?: number | undefined;
    // (undocumented)
    protected createMarkup(svgMarkup: G, ev: BeButtonEvent, isDynamics: boolean): void;
    // (undocumented)
    static iconSpec: string;
    // (undocumented)
    protected showPrompt(): void;
    // (undocumented)
    static toolId: string;
}

// @public
export abstract class RedlineTool extends MarkupTool {
    // (undocumented)
    protected clearDynamicsMarkup(_isDynamics: boolean): void;
    // (undocumented)
    protected createMarkup(_svgMarkup: G, _ev: BeButtonEvent, _isDynamics: boolean): void;
    // (undocumented)
    protected isComplete(_ev: BeButtonEvent): boolean;
    // (undocumented)
    protected _minPoints: number;
    // (undocumented)
    protected _nRequiredPoints: number;
    // (undocumented)
    protected onAdded(el: Element): void;
    // (undocumented)
    onCleanup(): Promise<void>;
    // (undocumented)
    onDataButtonDown(ev: BeButtonEvent): Promise<EventHandled>;
    // (undocumented)
    onMouseMotion(ev: BeButtonEvent): Promise<void>;
    // (undocumented)
    onReinitialize(): Promise<void>;
    // (undocumented)
    onResetButtonUp(_ev: BeButtonEvent): Promise<EventHandled>;
    // (undocumented)
    onRestartTool(): Promise<void>;
    // (undocumented)
    onUndoPreviousStep(): Promise<boolean>;
    // (undocumented)
    protected readonly _points: Point3d[];
    // (undocumented)
    protected provideToolAssistance(mainInstrKey: string, singlePoint?: boolean): void;
    // (undocumented)
    protected setupAndPromptForNextAction(): void;
}

// @public
export class SelectTool extends MarkupTool {
    // (undocumented)
    protected boxSelect(ev: BeButtonEvent, isDynamics: boolean): boolean;
    // (undocumented)
    protected boxSelectInit(): void;
    // (undocumented)
    protected boxSelectStart(ev: BeButtonEvent): boolean;
    // (undocumented)
    get flashedElement(): Element | undefined;
    set flashedElement(el: Element | undefined);
    // (undocumented)
    static iconSpec: string;
    // (undocumented)
    onCleanup(): Promise<void>;
    onDataButtonUp(ev: BeButtonEvent): Promise<EventHandled>;
    onKeyTransition(wentDown: boolean, key: KeyboardEvent): Promise<EventHandled>;
    onModifierKeyTransition(_wentDown: boolean, modifier: BeModifierKeys, _event: KeyboardEvent): Promise<EventHandled>;
    onMouseEndDrag(ev: BeButtonEvent): Promise<EventHandled>;
    onMouseMotion(ev: BeButtonEvent): Promise<void>;
    onMouseStartDrag(ev: BeButtonEvent): Promise<EventHandled>;
    // (undocumented)
    onPostInstall(): Promise<void>;
    // (undocumented)
    onResetButtonUp(_ev: BeButtonEvent): Promise<EventHandled>;
    // (undocumented)
    onRestartTool(): Promise<void>;
    // (undocumented)
    onTouchTap(ev: BeTouchEvent): Promise<EventHandled>;
    // (undocumented)
    protected showPrompt(): void;
    // (undocumented)
    static toolId: string;
    // (undocumented)
    protected unflashSelected(): void;
}

// @public
export class SketchTool extends RedlineTool {
    // (undocumented)
    protected createMarkup(svgMarkup: G, ev: BeButtonEvent, isDynamics: boolean): void;
    // (undocumented)
    static iconSpec: string;
    // (undocumented)
    protected _minDistSquared: number;
    // (undocumented)
    onMouseMotion(ev: BeButtonEvent): Promise<void>;
    // (undocumented)
    protected showPrompt(): void;
    // (undocumented)
    static toolId: string;
}

// @public
export class SymbolTool extends RedlineTool {
    constructor(_symbolData?: string | undefined, _applyCurrentStyle?: boolean | undefined);
    // (undocumented)
    protected _applyCurrentStyle?: boolean | undefined;
    // (undocumented)
    protected clearDynamicsMarkup(isDynamics: boolean): void;
    // (undocumented)
    protected createMarkup(svgMarkup: G, ev: BeButtonEvent, isDynamics: boolean): void;
    // (undocumented)
    static iconSpec: string;
    // (undocumented)
    onDataButtonUp(ev: BeButtonEvent): Promise<EventHandled>;
    // (undocumented)
    onInstall(): Promise<boolean>;
    // (undocumented)
    onResetButtonUp(_ev: BeButtonEvent): Promise<EventHandled>;
    // (undocumented)
    protected showPrompt(): void;
    // (undocumented)
    protected _symbol?: Element;
    // (undocumented)
    protected _symbolData?: string | undefined;
    // (undocumented)
    static toolId: string;
}

// @internal
export class Title extends Element {
    constructor(node: any);
    // (undocumented)
    bbox(): Box;
    // (undocumented)
    dmove(): this;
    // (undocumented)
    move(): this;
    // (undocumented)
    scale(): this;
    // (undocumented)
    screenCTM(): Matrix;
    // (undocumented)
    size(): this;
}

// @public
export class UndoManager {
    doRedo(): void;
    doUndo(): void;
    onAdded(elem: Element): void;
    onDelete(elem: Element): void;
    onModified(newElem: Element, oldElem: Element): void;
    onRepositioned(elem: Element, oldIndex: number, oldParent: Element): void;
    performOperation(cmdName: string, fn: VoidFunction): void;
    get redoPossible(): boolean;
    get redoString(): string | undefined;
    // @internal (undocumented)
    get size(): number;
    get undoPossible(): boolean;
    get undoString(): string | undefined;
}

// @public
export interface WidthAndHeight {
    // (undocumented)
    height: number;
    // (undocumented)
    width: number;
}


// (No @packageDocumentation comment for this package)

```