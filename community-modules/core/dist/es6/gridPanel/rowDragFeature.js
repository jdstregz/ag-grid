/**
 * @ag-grid-community/core - Advanced Data Grid / Data Table supporting Javascript / React / AngularJS / Web Components
 * @version v23.1.0
 * @link http://www.ag-grid.com/
 * @license MIT
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
import { DragAndDropService, DragSourceType, VerticalDirection } from "../dragAndDrop/dragAndDropService";
import { Autowired, Optional, PostConstruct, PreDestroy } from "../context/context";
import { Events } from "../eventKeys";
import { last } from '../utils/array';
import { _ } from "../utils";
var RowDragFeature = /** @class */ (function () {
    function RowDragFeature(eContainer, gridPanel) {
        this.isMultiRowDrag = false;
        this.events = [];
        this.isGridSorted = false;
        this.isGridFiltered = false;
        this.isRowGroupActive = false;
        this.eContainer = eContainer;
        this.gridPanel = gridPanel;
    }
    RowDragFeature.prototype.postConstruct = function () {
        if (this.gridOptionsWrapper.isRowModelDefault()) {
            this.clientSideRowModel = this.rowModel;
        }
        this.events.push(this.eventService.addEventListener(Events.EVENT_SORT_CHANGED, this.onSortChanged.bind(this)), this.eventService.addEventListener(Events.EVENT_FILTER_CHANGED, this.onFilterChanged.bind(this)), this.eventService.addEventListener(Events.EVENT_COLUMN_ROW_GROUP_CHANGED, this.onRowGroupChanged.bind(this)));
        this.onSortChanged();
        this.onFilterChanged();
        this.onRowGroupChanged();
    };
    RowDragFeature.prototype.destroy = function () {
        if (this.events.length) {
            this.events.forEach(function (func) { return func(); });
        }
    };
    RowDragFeature.prototype.onSortChanged = function () {
        var sortModel = this.sortController.getSortModel();
        this.isGridSorted = !_.missingOrEmpty(sortModel);
    };
    RowDragFeature.prototype.onFilterChanged = function () {
        this.isGridFiltered = this.filterManager.isAnyFilterPresent();
    };
    RowDragFeature.prototype.onRowGroupChanged = function () {
        var rowGroups = this.columnController.getRowGroupColumns();
        this.isRowGroupActive = !_.missingOrEmpty(rowGroups);
    };
    RowDragFeature.prototype.getContainer = function () {
        return this.eContainer;
    };
    RowDragFeature.prototype.isInterestedIn = function (type) {
        return type === DragSourceType.RowDrag;
    };
    RowDragFeature.prototype.getIconName = function () {
        var managedDrag = this.gridOptionsWrapper.isRowDragManaged();
        if (managedDrag && this.shouldPreventRowMove()) {
            return DragAndDropService.ICON_NOT_ALLOWED;
        }
        return DragAndDropService.ICON_MOVE;
    };
    RowDragFeature.prototype.shouldPreventRowMove = function () {
        return this.isGridSorted || this.isGridFiltered || this.isRowGroupActive;
    };
    RowDragFeature.prototype.getRowNodes = function (draggingEvent) {
        if (!this.isFromThisGrid(draggingEvent)) {
            return draggingEvent.dragItem.rowNodes;
        }
        var enableMultiRowDragging = this.gridOptionsWrapper.isEnableMultiRowDragging();
        var selectedNodes = this.selectionController.getSelectedNodes();
        var currentNode = draggingEvent.dragItem.rowNode;
        if (enableMultiRowDragging && selectedNodes.indexOf(currentNode) !== -1) {
            this.isMultiRowDrag = true;
            return __spreadArrays(selectedNodes);
        }
        this.isMultiRowDrag = false;
        return [currentNode];
    };
    RowDragFeature.prototype.onDragEnter = function (draggingEvent) {
        // when entering, we fire the enter event, then in onEnterOrDragging,
        // we also fire the move event. so we get both events when entering.
        this.dispatchEvent(Events.EVENT_ROW_DRAG_ENTER, draggingEvent);
        this.getRowNodes(draggingEvent).forEach(function (rowNode) {
            rowNode.setDragging(true);
        });
        this.onEnterOrDragging(draggingEvent);
    };
    RowDragFeature.prototype.onDragging = function (draggingEvent) {
        this.onEnterOrDragging(draggingEvent);
    };
    RowDragFeature.prototype.isFromThisGrid = function (draggingEvent) {
        return this.gridPanel.getGui().contains(draggingEvent.dragSource.eElement);
    };
    RowDragFeature.prototype.isDropZoneWithinThisGrid = function (draggingEvent) {
        var gridGui = this.gridPanel.getGui();
        var dropZoneTarget = draggingEvent.dropZoneTarget;
        return !gridGui.contains(dropZoneTarget);
    };
    RowDragFeature.prototype.onEnterOrDragging = function (draggingEvent) {
        // this event is fired for enter and move
        this.dispatchEvent(Events.EVENT_ROW_DRAG_MOVE, draggingEvent);
        this.lastDraggingEvent = draggingEvent;
        var pixel = this.mouseEventService.getNormalisedPosition(draggingEvent).y;
        var managedDrag = this.gridOptionsWrapper.isRowDragManaged();
        if (managedDrag) {
            this.doManagedDrag(draggingEvent, pixel);
        }
        this.checkCenterForScrolling(pixel);
    };
    RowDragFeature.prototype.doManagedDrag = function (draggingEvent, pixel) {
        var _this = this;
        var rowNodes;
        var isFromThisGrid = this.isFromThisGrid(draggingEvent);
        if (isFromThisGrid) {
            rowNodes = [draggingEvent.dragItem.rowNode];
            if (this.isMultiRowDrag) {
                rowNodes = __spreadArrays(this.selectionController.getSelectedNodes()).sort(function (a, b) { return _this.getRowIndexNumber(a) - _this.getRowIndexNumber(b); });
            }
            draggingEvent.dragItem.rowNodes = rowNodes;
        }
        else {
            rowNodes = draggingEvent.dragItem.rowNodes;
        }
        var managedDrag = this.gridOptionsWrapper.isRowDragManaged();
        if (managedDrag && this.shouldPreventRowMove()) {
            return;
        }
        if (this.gridOptionsWrapper.isSuppressMoveWhenRowDragging() || !isFromThisGrid) {
            if (!this.isDropZoneWithinThisGrid(draggingEvent)) {
                this.clientSideRowModel.highlightRowAtPixel(rowNodes[0], pixel);
            }
        }
        else {
            this.moveRows(rowNodes, pixel);
        }
    };
    RowDragFeature.prototype.getRowIndexNumber = function (rowNode) {
        return parseInt(last(rowNode.getRowIndexString().split('-')), 10);
    };
    RowDragFeature.prototype.moveRowAndClearHighlight = function (draggingEvent) {
        var _this = this;
        var lastHighlightedRowNode = this.clientSideRowModel.getLastHighlightedRowNode();
        var isBelow = lastHighlightedRowNode && lastHighlightedRowNode.highlighted === 'below';
        var pixel = this.mouseEventService.getNormalisedPosition(draggingEvent).y;
        var rowNodes = draggingEvent.dragItem.rowNodes;
        var increment = isBelow ? 1 : 0;
        if (this.isFromThisGrid(draggingEvent)) {
            rowNodes.forEach(function (rowNode) {
                if (rowNode.rowTop < pixel) {
                    increment -= 1;
                }
            });
            this.moveRows(rowNodes, pixel, increment);
        }
        else {
            var getRowNodeId_1 = this.gridOptionsWrapper.getRowNodeIdFunc();
            var addIndex = this.clientSideRowModel.getRowIndexAtPixel(pixel) + 1;
            if (this.clientSideRowModel.getHighlightPosition(pixel) === 'above') {
                addIndex--;
            }
            this.clientSideRowModel.updateRowData({
                add: rowNodes
                    .map(function (node) { return node.data; })
                    .filter(function (data) { return !_this.clientSideRowModel.getRowNode(getRowNodeId_1 ? getRowNodeId_1(data) : data.id); }),
                addIndex: addIndex
            });
        }
        this.clearRowHighlight();
    };
    RowDragFeature.prototype.clearRowHighlight = function () {
        this.clientSideRowModel.highlightRowAtPixel(null);
    };
    RowDragFeature.prototype.moveRows = function (rowNodes, pixel, increment) {
        if (increment === void 0) { increment = 0; }
        var rowWasMoved = this.clientSideRowModel.ensureRowsAtPixel(rowNodes, pixel, increment);
        if (rowWasMoved) {
            this.focusController.clearFocusedCell();
            if (this.rangeController) {
                this.rangeController.removeAllCellRanges();
            }
        }
    };
    RowDragFeature.prototype.checkCenterForScrolling = function (pixel) {
        // scroll if the mouse is within 50px of the grid edge
        var pixelRange = this.gridPanel.getVScrollPosition();
        // console.log(`pixelRange = (${pixelRange.top}, ${pixelRange.bottom})`);
        this.needToMoveUp = pixel < (pixelRange.top + 50);
        this.needToMoveDown = pixel > (pixelRange.bottom - 50);
        // console.log(`needToMoveUp = ${this.needToMoveUp} = pixel < (pixelRange.top + 50) = ${pixel} < (${pixelRange.top} + 50)`);
        // console.log(`needToMoveDown = ${this.needToMoveDown} = pixel < (pixelRange.top + 50) = ${pixel} < (${pixelRange.top} + 50)`);
        if (this.needToMoveUp || this.needToMoveDown) {
            this.ensureIntervalStarted();
        }
        else {
            this.ensureIntervalCleared();
        }
    };
    RowDragFeature.prototype.ensureIntervalStarted = function () {
        if (this.movingIntervalId) {
            return;
        }
        this.intervalCount = 0;
        this.movingIntervalId = window.setInterval(this.moveInterval.bind(this), 100);
    };
    RowDragFeature.prototype.ensureIntervalCleared = function () {
        if (!this.moveInterval) {
            return;
        }
        window.clearInterval(this.movingIntervalId);
        this.movingIntervalId = null;
    };
    RowDragFeature.prototype.moveInterval = function () {
        // the amounts we move get bigger at each interval, so the speed accelerates, starting a bit slow
        // and getting faster. this is to give smoother user experience. we max at 100px to limit the speed.
        var pixelsToMove;
        this.intervalCount++;
        pixelsToMove = 10 + (this.intervalCount * 5);
        if (pixelsToMove > 100) {
            pixelsToMove = 100;
        }
        var pixelsMoved;
        if (this.needToMoveDown) {
            pixelsMoved = this.gridPanel.scrollVertically(pixelsToMove);
        }
        else if (this.needToMoveUp) {
            pixelsMoved = this.gridPanel.scrollVertically(-pixelsToMove);
        }
        if (pixelsMoved !== 0) {
            this.onDragging(this.lastDraggingEvent);
        }
    };
    RowDragFeature.prototype.addRowDropZone = function (params) {
        var _this = this;
        if (!params.getContainer()) {
            _.doOnce(function () { return console.warn('ag-Grid: addRowDropZone - A container target needs to be provided'); }, 'add-drop-zone-empty-target');
            return;
        }
        if (this.dragAndDropService.findExternalZone(params)) {
            console.warn('ag-Grid: addRowDropZone - target already exists in the list of DropZones. Use `removeRowDropZone` before adding it again.');
            return;
        }
        var processedParams = {
            getContainer: params.getContainer
        };
        if (params.fromGrid) {
            params.fromGrid = undefined;
            processedParams = params;
        }
        else {
            if (params.onDragEnter) {
                processedParams.onDragEnter = function (e) {
                    params.onDragEnter(_this.draggingToRowDragEvent(Events.EVENT_ROW_DRAG_ENTER, e));
                };
            }
            if (params.onDragLeave) {
                processedParams.onDragLeave = function (e) {
                    params.onDragLeave(_this.draggingToRowDragEvent(Events.EVENT_ROW_DRAG_LEAVE, e));
                };
            }
            if (params.onDragging) {
                processedParams.onDragging = function (e) {
                    params.onDragging(_this.draggingToRowDragEvent(Events.EVENT_ROW_DRAG_MOVE, e));
                };
            }
            if (params.onDragStop) {
                processedParams.onDragStop = function (e) {
                    params.onDragStop(_this.draggingToRowDragEvent(Events.EVENT_ROW_DRAG_END, e));
                };
            }
        }
        this.dragAndDropService.addDropTarget(__assign({ isInterestedIn: function (type) { return type === DragSourceType.RowDrag; }, getIconName: function () { return DragAndDropService.ICON_MOVE; }, external: true }, processedParams));
    };
    RowDragFeature.prototype.getRowDropZone = function (events) {
        var _this = this;
        var getContainer = this.getContainer.bind(this);
        var onDragEnter = this.onDragEnter.bind(this);
        var onDragLeave = this.onDragLeave.bind(this);
        var onDragging = this.onDragging.bind(this);
        var onDragStop = this.onDragStop.bind(this);
        if (!events) {
            return { getContainer: getContainer, onDragEnter: onDragEnter, onDragLeave: onDragLeave, onDragging: onDragging, onDragStop: onDragStop, fromGrid: true };
        }
        return {
            getContainer: getContainer,
            onDragEnter: events.onDragEnter
                ? (function (e) {
                    onDragEnter(e);
                    events.onDragEnter(_this.draggingToRowDragEvent(Events.EVENT_ROW_DRAG_ENTER, e));
                })
                : onDragEnter,
            onDragLeave: events.onDragLeave
                ? (function (e) {
                    onDragLeave(e);
                    events.onDragLeave(_this.draggingToRowDragEvent(Events.EVENT_ROW_DRAG_LEAVE, e));
                })
                : onDragLeave,
            onDragging: events.onDragging
                ? (function (e) {
                    onDragging(e);
                    events.onDragging(_this.draggingToRowDragEvent(Events.EVENT_ROW_DRAG_MOVE, e));
                })
                : onDragging,
            onDragStop: events.onDragStop
                ? (function (e) {
                    onDragStop(e);
                    events.onDragStop(_this.draggingToRowDragEvent(Events.EVENT_ROW_DRAG_END, e));
                })
                : onDragStop,
            fromGrid: true
        };
    };
    RowDragFeature.prototype.draggingToRowDragEvent = function (type, draggingEvent) {
        var yNormalised = this.mouseEventService.getNormalisedPosition(draggingEvent).y;
        var mouseIsPastLastRow = yNormalised > this.rowModel.getCurrentPageHeight();
        var overIndex = -1;
        var overNode = null;
        if (!mouseIsPastLastRow) {
            overIndex = this.rowModel.getRowIndexAtPixel(yNormalised);
            overNode = this.rowModel.getRow(overIndex);
        }
        var vDirectionString;
        switch (draggingEvent.vDirection) {
            case VerticalDirection.Down:
                vDirectionString = 'down';
                break;
            case VerticalDirection.Up:
                vDirectionString = 'up';
                break;
            default:
                vDirectionString = null;
                break;
        }
        var event = {
            type: type,
            api: this.gridOptionsWrapper.getApi(),
            columnApi: this.gridOptionsWrapper.getColumnApi(),
            event: draggingEvent.event,
            node: draggingEvent.dragItem.rowNode,
            nodes: draggingEvent.dragItem.rowNodes,
            overIndex: overIndex,
            overNode: overNode,
            y: yNormalised,
            vDirection: vDirectionString
        };
        return event;
    };
    RowDragFeature.prototype.dispatchEvent = function (type, draggingEvent) {
        var event = this.draggingToRowDragEvent(type, draggingEvent);
        this.eventService.dispatchEvent(event);
    };
    RowDragFeature.prototype.onDragLeave = function (draggingEvent) {
        this.dispatchEvent(Events.EVENT_ROW_DRAG_LEAVE, draggingEvent);
        this.stopDragging(draggingEvent);
        this.clearRowHighlight();
        if (this.isFromThisGrid(draggingEvent)) {
            this.isMultiRowDrag = false;
        }
    };
    RowDragFeature.prototype.onDragStop = function (draggingEvent) {
        this.dispatchEvent(Events.EVENT_ROW_DRAG_END, draggingEvent);
        this.stopDragging(draggingEvent);
        if (this.gridOptionsWrapper.isRowDragManaged() &&
            (this.gridOptionsWrapper.isSuppressMoveWhenRowDragging() || !this.isFromThisGrid(draggingEvent)) &&
            !this.isDropZoneWithinThisGrid(draggingEvent)) {
            this.moveRowAndClearHighlight(draggingEvent);
        }
    };
    RowDragFeature.prototype.stopDragging = function (draggingEvent) {
        this.ensureIntervalCleared();
        this.getRowNodes(draggingEvent).forEach(function (rowNode) {
            rowNode.setDragging(false);
        });
    };
    __decorate([
        Autowired('dragAndDropService')
    ], RowDragFeature.prototype, "dragAndDropService", void 0);
    __decorate([
        Autowired('rowModel')
    ], RowDragFeature.prototype, "rowModel", void 0);
    __decorate([
        Autowired('columnController')
    ], RowDragFeature.prototype, "columnController", void 0);
    __decorate([
        Autowired('focusController')
    ], RowDragFeature.prototype, "focusController", void 0);
    __decorate([
        Autowired('sortController')
    ], RowDragFeature.prototype, "sortController", void 0);
    __decorate([
        Autowired('filterManager')
    ], RowDragFeature.prototype, "filterManager", void 0);
    __decorate([
        Autowired('gridOptionsWrapper')
    ], RowDragFeature.prototype, "gridOptionsWrapper", void 0);
    __decorate([
        Autowired('selectionController')
    ], RowDragFeature.prototype, "selectionController", void 0);
    __decorate([
        Optional('rangeController')
    ], RowDragFeature.prototype, "rangeController", void 0);
    __decorate([
        Autowired('mouseEventService')
    ], RowDragFeature.prototype, "mouseEventService", void 0);
    __decorate([
        Autowired('eventService')
    ], RowDragFeature.prototype, "eventService", void 0);
    __decorate([
        PostConstruct
    ], RowDragFeature.prototype, "postConstruct", null);
    __decorate([
        PreDestroy
    ], RowDragFeature.prototype, "destroy", null);
    return RowDragFeature;
}());
export { RowDragFeature };
