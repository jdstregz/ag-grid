// Type definitions for @ag-grid-community/core v23.1.0
// Project: http://www.ag-grid.com/
// Definitions by: Niall Crosby <https://github.com/ag-grid/>
import { GridPanel } from '../gridPanel/gridPanel';
import { HeaderRowComp } from './headerRowComp';
import { Component } from '../widgets/component';
export declare class HeaderContainer {
    private gridOptionsWrapper;
    private context;
    private columnController;
    private eventService;
    private scrollVisibleService;
    private eContainer;
    private eViewport;
    private headerRowComps;
    private pinned;
    private scrollWidth;
    private dropTarget;
    private events;
    constructor(eContainer: HTMLElement, eViewport: HTMLElement, pinned: string);
    registerGridComp(gridPanel: GridPanel): void;
    forEachHeaderElement(callback: (renderedHeaderElement: Component) => void): void;
    private init;
    private onColumnRowGroupChanged;
    private onColumnValueChanged;
    private onColumnResized;
    private onDisplayedColumnsChanged;
    private onScrollVisibilityChanged;
    private setWidthOfPinnedContainer;
    destroy(): void;
    getRowComps(): HeaderRowComp[];
    private onGridColumnsChanged;
    private removeAndCreateAllRowComps;
    refresh(): void;
    private setupDragAndDrop;
    private removeHeaderRowComps;
    private createHeaderRowComps;
}
