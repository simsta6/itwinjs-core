/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis
const globalSymbol = Symbol.for("itwin.core.frontend.globals");
const ext = globalThis[globalSymbol].getExtensionApi("import.meta.url");

// export extension stuff
export const { registerTool } = ext.api;
// exception for ExtensionHost
export const { ExtensionHost } = ext.exports;

// BEGIN GENERATED CODE
export const {
// @itwin/core-frontend:
	ContextRotationId,
	ACSType,
	ACSDisplayOptions,
	CoordSystem,
	LocateAction,
	LocateFilterStatus,
	SnapStatus,
	FlashMode,
	FrontendLoggerCategory,
	SnapMode,
	SnapHeat,
	HitSource,
	HitGeomType,
	HitParentGeomType,
	HitPriority,
	HitDetailType,
	OutputMessageType,
	OutputMessagePriority,
	OutputMessageAlert,
	ActivityMessageEndReason,
	MessageBoxType,
	MessageBoxIconType,
	MessageBoxValue,
	SelectionSetEventType,
	StandardViewId,
	ViewStatus,
	GraphicType,
	UniformType,
	VaryingType,
	TileLoadStatus,
	TileVisibility,
	TileLoadPriority,
	TileBoundingBoxes,
	TileTreeLoadStatus,
	TileGraphicType,
	ClipEventType,
	SelectionMethod,
	SelectionMode,
	SelectionProcessing,
	BeButton,
	CoordinateLockOverrides,
	InputSource,
	CoordSource,
	BeModifierKeys,
	EventHandled,
	ParseAndRunResult,
	KeyinParseError,
	StartOrResume,
	ManipulatorToolEvent,
	ToolAssistanceImage,
	ToolAssistanceInputMethod,
	AccuDrawHintBuilder,
	AccuSnap,
	AuxCoordSystemState,
	AuxCoordSystem2dState,
	AuxCoordSystem3dState,
	AuxCoordSystemSpatialState,
	BingLocationProvider,
	CategorySelectorState,
	ChangeFlags,
	ContextRealityModelState,
	DisplayStyleState,
	DisplayStyle2dState,
	DisplayStyle3dState,
	DrawingViewState,
	LocateOptions,
	LocateResponse,
	ElementPicker,
	ElementLocateManager,
	EmphasizeElements,
	EntityState,
	ElementState,
	FlashSettings,
	FrustumAnimator,
	GlobeAnimator,
	HitDetail,
	SnapDetail,
	IntersectDetail,
	HitList,
	IModelConnection,
	canvasToResizedCanvasWithBars,
	imageBufferToCanvas,
	canvasToImageBuffer,
	getImageSourceMimeType,
	getImageSourceFormatForMimeType,
	imageElementFromImageSource,
	imageElementFromUrl,
	extractImageSourceDimensions,
	imageBufferToPngDataUrl,
	imageBufferToBase64EncodedPng,
	getCompressedJpegFromCanvas,
	NotificationHandler,
	MarginPercent,
	Marker,
	Cluster,
	MarkerSet,
	ModelSelectorState,
	ModelState,
	GeometricModelState,
	GeometricModel2dState,
	GeometricModel3dState,
	SheetModelState,
	SpatialModelState,
	PhysicalModelState,
	SpatialLocationModelState,
	DrawingModelState,
	SectionDrawingModelState,
	NotifyMessageDetails,
	ActivityMessageDetails,
	NotificationManager,
	PerModelCategoryVisibility,
	HiliteSet,
	SelectionSet,
	SheetViewState,
	SpatialViewState,
	OrthographicViewState,
	Sprite,
	IconSprites,
	SpriteLocation,
	TentativePoint,
	Tiles,
	ViewCreator2d,
	ViewCreator3d,
	queryTerrainElevationOffset,
	ViewManager,
	ViewPose,
	ViewRect,
	ViewState,
	ViewState3d,
	ViewState2d,
	ViewingSpace,
	connectViewports,
	synchronizeViewportViews,
	synchronizeViewportFrusta,
	connectViewportFrusta,
	connectViewportViews,
	TwoWayViewportSync,
	TwoWayViewportFrustumSync,
	Decorations,
	FeatureSymbology,
	GraphicBranch,
	GraphicBuilder,
	Pixel,
	RenderClipVolume,
	RenderGraphic,
	RenderGraphicOwner,
	RenderSystem,
	Scene,
	DisclosedTileTreeSet,
	readElementGraphics,
	Tile,
	TileAdmin,
	TileDrawArgs,
	TileRequest,
	TileRequestChannelStatistics,
	TileRequestChannel,
	TileRequestChannels,
	TileTree,
	TileTreeReference,
	TileUsageMarker,
	BingElevationProvider,
	ViewClipTool,
	ViewClipClearTool,
	ViewClipDecorationProvider,
	EditManipulator,
	EventController,
	PrimitiveTool,
	BeButtonState,
	BeButtonEvent,
	BeTouchEvent,
	BeWheelEvent,
	Tool,
	InteractiveTool,
	InputCollector,
	ToolAdmin,
	ToolAssistance,
	ToolSettings,
	ViewTool,
	ViewManip,
// @itwin/core-common:
	BackgroundMapType,
	GlobeMode,
	BriefcaseIdValue,
	SyncMode,
	TypeOfChange,
	ChangesetType,
	BisCodeSpec,
	CommonLoggerCategory,
	QueryRowFormat,
	MonochromeMode,
	ECSqlValueType,
	ChangeOpCode,
	ChangedValueState,
	ECSqlSystemProperty,
	SectionType,
	Rank,
	FeatureOverrideType,
	BatchType,
	FontType,
	Npc,
	GeoCoordStatus,
	FillDisplay,
	BackgroundFill,
	GeometryClass,
	GeometrySummaryVerbosity,
	FillFlags,
	HSVConstants,
	ImageBufferFormat,
	ImageSourceFormat,
	LinePixels,
	MassPropertiesOperation,
	TextureMapUnits,
	PlanarClipMaskMode,
	PlanarClipMaskPriority,
	SkyBoxImageType,
	SpatialClassifierInsideDisplay,
	SpatialClassifierOutsideDisplay,
	TerrainHeightOriginMode,
	ThematicGradientMode,
	ThematicGradientColorScheme,
	ThematicDisplayMode,
	TxnAction,
	GridOrientationType,
	RenderMode,
	ElementGeometryOpcode,
	GeometryStreamFlags,
	ColorByName,
	ColorDef,
} = ext.exports;
// END GENERATED CODE
