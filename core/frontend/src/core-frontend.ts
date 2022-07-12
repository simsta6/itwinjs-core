/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

export * from "./AccuDraw";
export * from "./AccuSnap";
export * from "./AuxCoordSys";
export * from "./BingLocation";
export * from "./BriefcaseConnection";
export * from "./BriefcaseTxns";
export * from "./CategorySelectorState";
export * from "./ChangeFlags";
export * from "./CheckpointConnection";
export * from "./ContextRealityModelState";
export * from "./CoordSystem";
export * from "./DecorationsCache";
export * from "./DevTools";
export * from "./DisplayStyleState";
export * from "./DrawingViewState";
export * from "./ElementLocateManager";
export * from "./EmphasizeElements";
export * from "./EntityState";
export * from "./EnvironmentDecorations";
export * from "./FeatureOverrideProvider";
export * from "./FlashSettings";
export * from "./FrontendLoggerCategory";
export * from "./FrontendHubAccess";
export * from "./Frustum2d";
export * from "./FrustumAnimator";
export * from "./FuzzySearch";
export * from "./GeoServices";
export * from "./GlobeAnimator";
export * from "./GraphicalEditingScope";
export * from "./HitDetail";
export * from "./ImageUtil";
export * from "./IModelApp";
export * from "./IModelConnection";
export * from "./IModelRoutingContext";
export * from "./IpcApp";
export * from "./LinePlaneIntersect";
export * from "./MarginPercent";
export * from "./Marker";
export * from "./ModelSelectorState";
export * from "./ModelState";
export * from "./NativeApp";
export * from "./NativeAppLogger";
export * from "./NoRenderApp";
export * from "./NotificationManager";
export * from "./PerModelCategoryVisibility";
export * from "./PlanarClipMaskState";
export * from "./SelectionSet";
export * from "./SheetViewState";
export * from "./SpatialViewState";
export * from "./Sprites";
export * from "./StandardView";
export * from "./SubCategoriesCache";
export * from "./TentativePoint";
export * from "./Tiles";
export * from "./UserPreferences";
export * from "./ViewAnimation";
export * from "./ViewContext";
export * from "./ViewGlobalLocation";
export * from "./ViewingSpace";
export * from "./ViewManager";
export * from "./Viewport";
export * from "./ViewportSync";
export * from "./ViewPose";
export * from "./ViewRect";
export * from "./ViewState";
export * from "./ViewStatus";
export * from "./extension/Extension";
export * from "./extension/providers/LocalExtensionProvider";
export * from "./extension/providers/RemoteExtensionProvider";
export * from "./properties/AngleDescription";
export * from "./properties/FormattedQuantityDescription";
export * from "./properties/LengthDescription";
export * from "./quantity-formatting/QuantityFormatter";
export * from "./quantity-formatting/BaseUnitFormattingSettingsProvider";
export * from "./quantity-formatting/LocalUnitFormatProvider";
export * from "./quantity-formatting/QuantityTypesEditorSpecs";
export * from "./render/CanvasDecoration";
export * from "./render/Decorations";
export * from "./render/FeatureSymbology";
export * from "./render/FrameStats";
export * from "./render/GraphicBranch";
export * from "./render/GraphicBuilder";
export * from "./render/GraphicPrimitive";
export * from "./render/InstancedGraphicParams";
export * from "./render/MockRender";
export * from "./render/ParticleCollectionBuilder";
export * from "./render/Pixel";
export * from "./render/RenderClipVolume";
export * from "./render/RenderGraphic";
export * from "./render/RenderMaterial";
export * from "./render/RenderMemory";
export * from "./render/RenderPlan";
export * from "./render/RenderPlanarClassifier";
export * from "./render/RenderTarget";
export * from "./render/RenderSystem";
export * from "./render/RenderTexture";
export * from "./render/Scene";
export * from "./render/ScreenSpaceEffectBuilder";
export * from "./render/VisibleFeature";
export * from "./render/webgl/PerformanceMetrics";
export * from "./render/webgl/Target";
export * from "./render/webgl/IModelFrameLifecycle";
export * from "./tile/internal";
export * from "./tools/AccuDrawTool";
export * from "./tools/ClipViewTool";
export * from "./tools/EditManipulator";
export * from "./tools/ElementSetTool";
export * from "./tools/EventController";
export * from "./tools/IdleTool";
export * from "./tools/MeasureTool";
export * from "./tools/PrimitiveTool";
export * from "./tools/SelectTool";
export * from "./tools/Tool";
export * from "./tools/ToolSettings";
export * from "./tools/ToolAdmin";
export * from "./tools/ToolAssistance";
export * from "./tools/ViewTool";
export * from "./BackgroundMapGeometry";
export * from "./ViewCreator2d";
export * from "./ViewCreator3d";
export * from "./LocalhostIpcApp";
export * from "./RealityDataSource";
// TODO/FIX: "./extension/ExtensionRuntime" import has to be last to avoid circular dependency errors.
import "./extension/ExtensionRuntime";

/** @docs-package-description
 * The core-frontend package always runs in a web browser. It contains classes for [querying iModels and showing views]($docs/learning/frontend/index.md).
 */

/**
 * @docs-group-description IModelApp
 * Classes for configuring and administering an iTwin.js application.
 * See [the learning articles]($docs/learning/frontend/index.md).
 */
/**
 * @docs-group-description IModelConnection
 * Classes for working with a connection to an [iModel briefcase]($docs/learning/IModels.md)
 */
/**
 * @docs-group-description ElementState
 * Classes for working with the *state* of Elements in the frontend.
 * See [the learning articles]($docs/learning/frontend/index.md).
 */
/**
 * @docs-group-description ModelState
 * Classes for working with the *state* of Models in the frontend.
 * See [the learning articles]($docs/learning/frontend/index.md).
 */
/**
 * @docs-group-description Tools
 * Classes for [working with Tools]($docs/learning/frontend/Tools.md)
 */
/**
 * @docs-group-description Measure
 * Classes for reporting point to point distances and mass properties of elements.
 */
/**
 * @docs-group-description Views
 * Classes for [working with Views]($docs/learning/frontend/Views.md)
 */
/**
 * @docs-group-description LocatingElements
 * Classes for locating and snapping to elements in views.
 * See [the learning articles]($docs/learning/frontend/index.md).
 */
/**
 * @docs-group-description AccuDraw
 * AccuDraw provides helpful assistance for creating and modifying elements in a view.
 * See [the learning articles]($docs/learning/frontend/index.md).
 */
/**
 * @docs-group-description Notifications
 * Notifications provide feedback to the user of something of interest.
 * See [the learning articles]($docs/learning/frontend/index.md).
 */
/**
 * @docs-group-description Extensions
 * Classes for creating and managing Extensions.
 */
/**
 * @docs-group-description Properties
 * Classes for working with property records and descriptions.
 */
/**
 * @docs-group-description Rendering
 * Classes for rendering the contents of views.
 */
/**
 * @docs-group-description SelectionSet
 * Classes for working with the set of selected elements.
 * See [the learning articles]($docs/learning/frontend/index.md).
 */
/**
 * @docs-group-description NativeApp
 * Classes for working with Native Applications
 */
/**
 * @docs-group-description Utils
 * Miscellaneous utility classes.
 */
/**
 * @docs-group-description Logging
 * Logger categories used by this package
 */
/**
 * @docs-group-description QuantityFormatting
 * Classes for formatting and parsing quantity values.
 */
/**
 * @docs-group-description Tiles
 * Classes representing graphics as [hierarchical 3d tiles](https://github.com/CesiumGS/3d-tiles).
 */
/**
 * @docs-group-description HubAccess
 * APIs for working with IModelHub
 */
/**
 * @docs-group-description UserPreferences
 * APIs for working with user preferences in an iModelApp.
 * See [the learning articles]($docs/learning/frontend/preferences.md).
 */
/**
 * @docs-group-description MapLayers
 * Classes supporting map layers display.
 */
