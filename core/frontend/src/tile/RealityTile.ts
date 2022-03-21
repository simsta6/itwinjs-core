/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Tiles
 */

import { BeTimePoint, dispose } from "@itwin/core-bentley";
import { ClipMaskXYZRangePlanes, ClipShape, ClipVector, Point3d, Polyface, Transform } from "@itwin/core-geometry";
import { ColorDef, Frustum } from "@itwin/core-common";
import { IModelApp } from "../IModelApp";
import { GraphicBranch, GraphicBranchOptions } from "../render/GraphicBranch";
import { GraphicBuilder } from "../render/GraphicBuilder";
import { RenderGraphic } from "../render/RenderGraphic";
import { RenderSystem } from "../render/RenderSystem";
import { ViewingSpace } from "../ViewingSpace";
import { Viewport } from "../Viewport";
import {
  RealityTileRegion, RealityTileTree, Tile, TileContent, TileDrawArgs, TileGeometryCollector, TileGraphicType, TileLoadStatus, TileParams, TileRequest, TileRequestChannel,
  TileTreeLoadStatus, TileUser, TraversalDetails, TraversalSelectionContext,
} from "./internal";

/** @internal */
export interface RealityTileParams extends TileParams {
  readonly transformToRoot?: Transform;
  readonly additiveRefinement?: boolean;
  readonly noContentButTerminateOnSelection?: boolean;
  readonly rangeCorners?: Point3d[];
  readonly region?: RealityTileRegion;
}

/** The geometry representing the contents of a reality tile.  Currently only polyfaces are returned
 * @alpha
 */
export interface RealityTileGeometry {
  polyfaces?: Polyface[];
}

/** @internal */
export interface RealityTileContent extends TileContent {
  geometry?: RealityTileGeometry;
}

const scratchLoadedChildren = new Array<RealityTile>();
const scratchCorners = [Point3d.createZero(), Point3d.createZero(), Point3d.createZero(), Point3d.createZero(), Point3d.createZero(), Point3d.createZero(), Point3d.createZero(), Point3d.createZero()];
const additiveRefinementThreshold = 10000;    // Additive tiles (Cesium OSM tileset) are subdivided until their range diagonal falls below this threshold to ensure accurate reprojection.
const additiveRefinementDepthLimit = 20;
const scratchFrustum = new Frustum();

/**
 * A specialization of tiles that represent reality tiles.  3D Tilesets and maps use this class and have their own optimized traversal and lifetime management.
 * @internal
 */
export class RealityTile extends Tile {
  public readonly transformToRoot?: Transform;
  public readonly additiveRefinement?: boolean;
  public readonly noContentButTerminateOnSelection?: boolean;
  public readonly rangeCorners?: Point3d[];
  public readonly region?: RealityTileRegion;
  protected _geometry?: RealityTileGeometry;
  private _everDisplayed = false;
  protected _reprojectionTransform?: Transform;
  private _reprojectedGraphic?: RenderGraphic;

  public constructor(props: RealityTileParams, tree: RealityTileTree) {
    super(props, tree);
    this.transformToRoot = props.transformToRoot;
    this.additiveRefinement = (undefined === props.additiveRefinement) ? this.realityParent?.additiveRefinement : props.additiveRefinement;
    this.noContentButTerminateOnSelection = props.noContentButTerminateOnSelection;
    this.rangeCorners = props.rangeCorners;
    this.region = props.region;

    if (undefined === this.transformToRoot)
      return;

    // Can transform be non-rigid?? -- if so would have to handle (readonly) radius.
    this.boundingSphere.transformBy(this.transformToRoot, this.boundingSphere);
    this.transformToRoot.multiplyRange(this.range, this.range);

    if (this.rangeCorners)
      this.transformToRoot.multiplyPoint3dArrayInPlace(this.rangeCorners);

    if (undefined !== this._contentRange)
      this.transformToRoot.multiplyRange(this._contentRange, this._contentRange);
  }

  public override setContent(content: RealityTileContent): void {
    super.setContent(content);
    this._geometry = content.geometry;
  }

  public get realityChildren(): RealityTile[] | undefined { return this.children as RealityTile[] | undefined; }
  public get realityParent(): RealityTile { return this.parent as RealityTile; }
  public get realityRoot(): RealityTileTree { return this.tree as RealityTileTree; }
  public get graphicType(): TileGraphicType | undefined { return undefined; }     // If undefined, use tree type.
  public get maxDepth(): number { return this.realityRoot.loader.maxDepth; }
  public get isPointCloud() { return this.realityRoot.loader.containsPointClouds; }
  public get isLoaded() { return this.loadStatus === TileLoadStatus.Ready; }      // Reality tiles may depend on secondary tiles (maps) so can ge loaded but not ready.
  public get geometry(): RealityTileGeometry | undefined { return this._geometry;  }

  public override get isDisplayable(): boolean {
    if (this.noContentButTerminateOnSelection)
      return false;
    else
      return super.isDisplayable;
  }

  public markUsed(args: TileDrawArgs): void {
    args.markUsed(this);
  }

  public markDisplayed(): void {
    this._everDisplayed = true;
  }

  public isOccluded(_viewingSpace: ViewingSpace): boolean {
    return false;
  }

  public get channel(): TileRequestChannel {
    return this.realityRoot.loader.getRequestChannel(this);
  }

  public async requestContent(isCanceled: () => boolean): Promise<TileRequest.Response> {
    return this.realityRoot.loader.requestTileContent(this, isCanceled);
  }
  private useAdditiveRefinementStepchildren() {
    // Create additive stepchildren only if we are this tile is additive and we are repojecting and the radius exceeds the additiveRefinementThreshold.
    // This criteria is currently only met by the Cesium OSM tileset.
    const rangeDiagonal = this.rangeCorners ? this.rangeCorners[0].distance(this.rangeCorners[3]) : 0;
    return this.additiveRefinement && this.isDisplayable && rangeDiagonal > additiveRefinementThreshold && this.depth < additiveRefinementDepthLimit && this.realityRoot.doReprojectChildren(this);
  }

  protected _loadChildren(resolve: (children: Tile[] | undefined) => void, reject: (error: Error) => void): void {
    this.realityRoot.loader.loadChildren(this).then((children: Tile[] | undefined) => {

      /* If this is a large tile is to be included additively, but we are reprojecting (Cesium OSM) then we must add step-children to display the geometry as an overly large
         tile cannot be reprojected accurately.  */
      if (this.useAdditiveRefinementStepchildren())
        this.loadAdditiveRefinementChildren((stepChildren: Tile[]) => { children = children ? children?.concat(stepChildren) : stepChildren; });

      if (children)
        this.realityRoot.reprojectAndResolveChildren(this, children, resolve);   /* Potentially reprojecect and resolve these children */

    }).catch((err) => {
      reject(err);
    });
  }

  public async readContent(data: TileRequest.ResponseData, system: RenderSystem, isCanceled?: () => boolean): Promise<TileContent> {
    return this.realityRoot.loader.loadTileContent(this, data, system, isCanceled);
  }

  public override computeLoadPriority(viewports: Iterable<Viewport>, users: Iterable<TileUser>): number {
    return this.realityRoot.loader.computeTilePriority(this, viewports, users);
  }

  public getContentClip(): ClipVector | undefined {
    return ClipVector.createCapture([ClipShape.createBlock(this.contentRange, ClipMaskXYZRangePlanes.All)]);
  }

  // Allow tile to select additional tiles (Terrain Imagery...)
  public selectSecondaryTiles(_args: TileDrawArgs, _context: TraversalSelectionContext) { }

  // An upsampled tile is not loadable - will override to return loadable parent.
  public get loadableTile(): RealityTile { return this; }

  public preloadRealityTilesAtDepth(depth: number, context: TraversalSelectionContext, args: TileDrawArgs) {
    if (this.depth === depth) {
      context.preload(this, args);
      return;
    }

    this.loadChildren();

    if (undefined !== this.realityChildren) {
      for (const child of this.realityChildren)
        child.preloadRealityTilesAtDepth(depth, context, args);
    }
  }

  // Preload tiles that are protected:
  // * used tiles (where "used" may mean: selected/preloaded for display or content requested);
  // * parents and siblings of other protected tiles.
  public preloadProtectedTiles(args: TileDrawArgs, context: TraversalSelectionContext): boolean {
    const children = this.realityChildren;
    let hasProtectedChildren = false;

    if (children) {
      for (const child of children) {
        hasProtectedChildren = child.preloadProtectedTiles(args, context) || hasProtectedChildren;
      }
    }

    if (children && hasProtectedChildren) {
      for (const child of children) {
        if (child.isDisplayable && !child.isLoaded)
          context.preload(child, args);
      }

      return true; // Parents of protected tiles are protected
    }

    // Special case of the root tile
    if (this === this.realityRoot.rootTile) {
      context.preload(this, args);
      return true;
    }

    return context.selected.find((tile) => tile === this) !== undefined;
  }

  public addBoundingGraphic(builder: GraphicBuilder, color: ColorDef) {
    builder.setSymbology(color, color, 3);
    let corners = this.rangeCorners ? this.rangeCorners : this.range.corners();
    if (this._reprojectionTransform)
      corners = this._reprojectionTransform.multiplyPoint3dArray(corners);
    builder.addRangeBoxFromCorners(corners);
  }

  public reproject(rootReprojection: Transform) {
    this._reprojectionTransform = rootReprojection;
    rootReprojection.multiplyRange(this.range, this.range);
    this.boundingSphere.transformBy(rootReprojection, this.boundingSphere);
    if (this.contentRange)
      rootReprojection.multiplyRange(this.contentRange, this.contentRange);
    if (this.rangeCorners)
      rootReprojection.multiplyPoint3dArrayInPlace(this.rangeCorners);
  }

  public allChildrenIncluded(tiles: Tile[]) {
    if (this.children === undefined || tiles.length !== this.children.length)
      return false;
    for (const tile of tiles)
      if (tile.parent !== this)
        return false;
    return true;
  }

  protected getLoadedRealityChildren(args: TileDrawArgs): boolean {
    if (this._childrenLoadStatus !== TileTreeLoadStatus.Loaded || this.realityChildren === undefined)
      return false;

    for (const child of this.realityChildren) {
      if (child.isReady && child.computeVisibilityFactor(args) > 0) {
        scratchLoadedChildren.push(child);
      } else if (!child.getLoadedRealityChildren(args)) {
        return false;
      }
    }
    return true;
  }

  protected forceSelectRealityTile(): boolean { return false; }
  protected minimumVisibleFactor(): Number { return 0; }

  public selectRealityTiles(context: TraversalSelectionContext, args: TileDrawArgs, traversalDetails: TraversalDetails) {
    const visibility = this.computeVisibilityFactor(args);

    const isNotVisible = visibility < 0;

    if (isNotVisible)
      return;

    // Force loading if loader requires this tile. (cesium terrain visibility).
    if (this.realityRoot.loader.forceTileLoad(this) && !this.isReady) {
      context.selectOrQueue(this, args, traversalDetails);
      return;
    }

    // Force to return early without selecting
    if (visibility >= 1 && this.noContentButTerminateOnSelection)
      return;

    const shouldSelectThisTile = visibility >= 1 || this._anyChildNotFound || this.forceSelectRealityTile() || context.selectionCountExceeded;
    if (shouldSelectThisTile && this.isDisplayable) { // Select this tile

      // Return early if tile is totally occluded
      if (this.isOccluded(args.viewingSpace))
        return;

      // Attempt to select this tile. If not ready, queue it
      context.selectOrQueue(this, args, traversalDetails);

      // This tile is visible but not loaded - Use higher resolution children if present
      if (!this.isReady)
        this.selectRealityChildrenAsFallback(context, args, traversalDetails);

    } else { // Select children instead of this tile

      // With additive refinement it is necessary to display this tile along with any displayed children
      if (this.additiveRefinement && this.isDisplayable && !this.useAdditiveRefinementStepchildren())
        context.selectOrQueue(this, args, traversalDetails);

      this.selectRealityChildren(context, args, traversalDetails);

      // Children are not ready: use this tile to avoid leaving a hole
      traversalDetails.shouldSelectParent = traversalDetails.shouldSelectParent || traversalDetails.queuedChildren.length !== 0;

      if (traversalDetails.shouldSelectParent) {
        // If the tile has not yet been displayed in this viewport -- display only if it is visible enough. Avoid overly tiles popping into view unexpectedly (terrain)
        if (visibility > this.minimumVisibleFactor() || this._everDisplayed) {
          context.selectOrQueue(this, args, traversalDetails);
        }
      }
    }
  }

  // Attempt to select the children of a tile in case they could be displayed while this tile is loading. This does not take into account visibility.
  protected selectRealityChildrenAsFallback(context: TraversalSelectionContext, args: TileDrawArgs, traversalDetails: TraversalDetails){
    const childrenReady = this.getLoadedRealityChildren(args);

    if (childrenReady) {
      context.select(scratchLoadedChildren, args);
      traversalDetails.shouldSelectParent = false;
    }

    scratchLoadedChildren.length = 0;
  }

  // Recurse through children to select them normally
  protected selectRealityChildren(context: TraversalSelectionContext, args: TileDrawArgs, traversalDetails: TraversalDetails) {

    // Load children if not yet requested
    const childrenLoadStatus = this.loadChildren(); // NB: asynchronous

    // Children are not ready yet
    if (childrenLoadStatus === TileTreeLoadStatus.Loading) {
      args.markChildrenLoading();
      traversalDetails.shouldSelectParent = true;
      return;
    }

    if (this.realityChildren !== undefined) {
      // Attempt to select the children
      const traversalChildren = this.realityRoot.getTraversalChildren(this.depth);
      traversalChildren.initialize();

      for (let i = 0; i < this.children!.length; i++)
        this.realityChildren[i].selectRealityTiles(context, args, traversalChildren.getChildDetail(i));

      traversalChildren.combine(traversalDetails);
    }
  }

  public purgeContents(olderThan: BeTimePoint): void{
    const tilesToPurge = new Set<RealityTile>();

    // Get the list of tiles to purge
    this.getTilesToPurge(olderThan, tilesToPurge);

    // Discard contents of tiles that have been marked.
    // Note we do not discard the child Tile objects themselves.
    for (const tile of tilesToPurge)
      tile.disposeContents();
  }

  // Populate a set with tiles that should be disposed. Prevent some tile to be disposed to avoid holes when moving.
  // Return true if the current tile is "protected".
  private getTilesToPurge(olderThan: BeTimePoint, tilesToPurge: Set<RealityTile>): boolean {
    const children = this.realityChildren;

    // Protected tiles cannot be purged. They are:
    // * used tiles (where "used" may mean: selected/preloaded for display or content requested);
    // * parents and siblings of other protected tiles.
    let hasProtectedChildren = false;

    if (children) {
      for (const child of children) {
        hasProtectedChildren = child.getTilesToPurge(olderThan, tilesToPurge) || hasProtectedChildren;
      }
    }

    if (children && hasProtectedChildren) {
      // Siblings of protected tiles are protected too. We need to remove them from it
      for (const child of children) {
        tilesToPurge.delete(child);
      }

      return true; // Parents of protected tiles are protected
    }

    const isInUse = this.usageMarker.getIsTileInUse();
    if (!isInUse && this.usageMarker.isTimestampExpired(olderThan)) {
      tilesToPurge.add(this);
    }

    return isInUse;
  }

  public computeVisibilityFactor(args: TileDrawArgs): number {
    if (this.isEmpty)
      return -1;

    if (this.rangeCorners)
      scratchFrustum.setFromCorners(this.rangeCorners);
    else
      Frustum.fromRange(this.range, scratchFrustum);

    if (this.isFrustumCulled(scratchFrustum, args, true, this.boundingSphere))
      return -1;

    // some nodes are merely for structure and don't have any geometry
    if (0 === this.maximumSize)
      return 0;

    if (this.isLeaf)
      return this.hasContentRange && this.isContentCulled(args) ? -1 : 1;

    return this.maximumSize / args.getPixelSize(this);
  }

  protected get _anyChildNotFound(): boolean {
    if (undefined !== this.children)
      for (const child of this.children)
        if (child.isNotFound)
          return true;

    return this._childrenLoadStatus === TileTreeLoadStatus.NotFound;
  }
  public override getSizeProjectionCorners(): Point3d[] | undefined {
    if (!this.tree.isContentUnbounded)
      return undefined;           // For a non-global tree use the standard size algorithm.

    // For global tiles (as in OSM buildings) return the range corners or X-Y corners only if bounded by region- this allows an algorithm that uses the area of the projected corners to attenuate horizon tiles.
    if (!this.rangeCorners)
      return this.range.corners(scratchCorners);

    return this.region ? this.rangeCorners.slice(4) : this.rangeCorners;
  }

  public get isStepChild() { return false; }

  protected loadAdditiveRefinementChildren(resolve: (children: Tile[]) => void): void {
    const region = this.region;
    const corners = this.rangeCorners;
    if (!region || !corners)
      return;

    const maximumSize = this.maximumSize;
    const rangeDiagonal = corners[0].distance(corners[3]);
    const isLeaf = rangeDiagonal < additiveRefinementThreshold || this.depth > additiveRefinementDepthLimit;

    const stepChildren = new Array<AdditiveRefinementStepChild>();
    const latitudeDelta = (region.maxLatitude - region.minLatitude) / 2;
    const longitudeDelta = (region.maxLongitude - region.minLongitude) / 2;
    const minHeight = region.minHeight;
    const maxHeight = region.maxHeight;

    for (let i = 0, minLongitude = region.minLongitude, step = 0; i < 2; i++, minLongitude += longitudeDelta, step++) {
      for (let j = 0, minLatitude = region.minLatitude; j < 2; j++, minLatitude += latitudeDelta) {
        const childRegion = new RealityTileRegion({ minLatitude, maxLatitude: minLatitude + latitudeDelta, minLongitude, maxLongitude: minLongitude + longitudeDelta, minHeight, maxHeight });
        const childRange = childRegion.getRange();

        const contentId = `${this.contentId}_S${step++}`;
        const childParams: RealityTileParams = { rangeCorners: childRange.corners, contentId, range: childRange.range, maximumSize, parent: this, additiveRefinement: false, isLeaf, region: childRegion };

        stepChildren.push(new AdditiveRefinementStepChild(childParams, this.realityRoot));
      }
    }
    resolve(stepChildren);
  }
  public override produceGraphics(): RenderGraphic | undefined {
    if (undefined === this._reprojectionTransform)
      return super.produceGraphics();

    if (undefined === this._reprojectedGraphic && undefined !== this._graphic) {
      const branch = new GraphicBranch(false);
      branch.add(this._graphic);
      this._reprojectedGraphic = IModelApp.renderSystem.createGraphicBranch(branch, this._reprojectionTransform);
    }
    return this._reprojectedGraphic;
  }

  public get unprojectedGraphic(): RenderGraphic | undefined {
    return this._graphic;
  }
  public override disposeContents(): void {
    super.disposeContents();
    this._reprojectedGraphic = dispose(this._reprojectedGraphic);
  }

  public collectTileGeometry(collector: TileGeometryCollector): void {
    const status = collector.collectTile(this);

    switch(status) {
      case "reject":
        return;

      case "continue":
        if (!this.isLeaf && !this._anyChildNotFound) {
          const childrenLoadStatus = this.loadChildren();
          if (TileTreeLoadStatus.Loading === childrenLoadStatus) {
            collector.markLoading();
          } else if (undefined !== this.realityChildren && !this._anyChildNotFound) {
            for (const child of this.realityChildren)
              child.collectTileGeometry(collector);
          }

          break;
        } // else fall through to "accept"
      // eslint-disable-next-line no-fallthrough
      case "accept":
        if (!this.isReady)
          collector.addMissingTile(this.loadableTile);
        else if (this.geometry?.polyfaces)
          collector.polyfaces.push(...this.geometry.polyfaces);

        break;
    }
  }
}

/** When additive refinement is used (as in the Cesium OSM tileset) it is not possible to accurately reproject very large, low level tiles
 * In this case we create additional "step" children (grandchildren etc. ) that will clipped portions display the their ancestor's additive geometry.
 * These step children are subdivided until they are small enough to be accurately reprojected - this is controlled by the additiveRefinementThreshold (currently 2KM).
 * The stepchildren do not contain any tile graphics - they just create a branch with clipping and reprojection to display their additive refinement ancestor graphics.
 */
class AdditiveRefinementStepChild extends RealityTile {
  public override get isStepChild() { return true; }
  private _loadableTile: RealityTile;

  public constructor(props: RealityTileParams, tree: RealityTileTree) {
    super(props, tree);
    this._loadableTile = this.realityParent;
    for (; this._loadableTile && this._loadableTile.isStepChild; this._loadableTile = this._loadableTile.realityParent)
      ;
  }
  public override get loadableTile(): RealityTile {
    return this._loadableTile;
  }
  public override get isLoading(): boolean { return this._loadableTile.isLoading; }
  public override get isQueued(): boolean { return this._loadableTile.isQueued; }
  public override get isNotFound(): boolean { return this._loadableTile.isNotFound; }
  public override get isReady(): boolean { return this._loadableTile.isReady; }
  public override get isLoaded(): boolean { return this._loadableTile.isLoaded; }
  public override get isEmpty() { return false; }
  public override produceGraphics(): RenderGraphic | undefined {
    if (undefined === this._graphic) {
      const parentGraphics = this._loadableTile.unprojectedGraphic;

      if (!parentGraphics || !this._reprojectionTransform)
        return undefined;

      const branch = new GraphicBranch(false);
      branch.add(parentGraphics);
      const renderSystem = IModelApp.renderSystem;
      const branchOptions: GraphicBranchOptions = {};
      if (this.rangeCorners) {
        const clipPolygon = [this.rangeCorners[0], this.rangeCorners[1], this.rangeCorners[3], this.rangeCorners[2]];
        branchOptions.clipVolume = renderSystem.createClipVolume(ClipVector.create([ClipShape.createShape(clipPolygon, undefined, undefined, this.tree.iModelTransform)!]));
      }
      this._graphic = renderSystem.createGraphicBranch(branch, this._reprojectionTransform, branchOptions);
    }
    return this._graphic;
  }

  public override markUsed(args: TileDrawArgs): void {
    args.markUsed(this);
    args.markUsed(this._loadableTile);
  }
  protected override _loadChildren(resolve: (children: Tile[] | undefined) => void, _reject: (error: Error) => void): void {
    this.loadAdditiveRefinementChildren((stepChildren: Tile[]) => {
      if (stepChildren)
        this.realityRoot.reprojectAndResolveChildren(this, stepChildren, resolve);
    });
  }
}
