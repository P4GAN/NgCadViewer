import { Component, ViewChild } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Button } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import { ThreejsViewerComponent } from './components/threejs-viewer/threejs-viewer.component';
import { CadTreeComponent } from './components/cad-tree/cad-tree.component';
import { CadNode } from './models/cadnode.model';
import { OCCT } from 'occt-import-js';

import * as stepHelper from './helpers/step-helper';
import * as plyHelper from './helpers/ply-helper';

// For some reason angular doesn't like WASM dependencies much, so this only seems to work when
// imported from the cdn, so we need to add a script tag to all our index.html files and declare the module here
// <script src="https://cdn.jsdelivr.net/npm/occt-import-js@0.0.22/dist/occt-import-js.min.js"></script>"
// TODO: Currently the assembly tree doesn't work properly (only goes 1 level deep), so we should either
// make our own emscripten build of OCCT or use opencascade.js, also we should fix the importing
declare function occtimportjs(): Promise<OCCT>;

@Component({
  selector: 'ng-cad-viewer',
  imports: [
    ThreejsViewerComponent,
    CadTreeComponent,
    ProgressSpinnerModule,
    Button,
    TooltipModule,
  ],
  templateUrl: './ng-cad-viewer.html',
  styleUrl: './ng-cad-viewer.scss',
})
export class NgCadViewer {
  occt!: OCCT;
  cadNodes: CadNode[] = [];
  loading: boolean = false;

  // Resolves once the OCCT WASM module has been downloaded and initialised
  private occtReady?: Promise<OCCT>;

  @ViewChild(ThreejsViewerComponent)
  threejsViewer!: ThreejsViewerComponent;

  async ngOnInit(): Promise<void> {
    this.loading = true;

    if (typeof occtimportjs !== 'function' || !occtimportjs) {
      console.error('OCCT module not found');
      this.loading = false;
      return;
    }
    this.occtReady = occtimportjs();
    this.occt = await this.occtReady;

    this.loading = false;
  }

  async loadCADFiles(files: File[]): Promise<void> {
    if (!this.occt && this.occtReady) {
      this.occt = await this.occtReady;
    }
    if (!this.occt) {
      console.error('OCCT module not loaded yet');
      return;
    }
    if (!this.threejsViewer) {
      console.error('ThreeJSViewer component not loaded yet');
      return;
    }
    this.loading = true;
    for (const file of files) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let cadRootNode: CadNode | null = null;
      switch (extension) {
        case 'step':
        case 'stp':
        case 'iges':
        case 'igs':
        case 'brep':
        case 'brp':
          cadRootNode = await stepHelper.buildCADTreeFromFile(file, this.occt);
          break;
        case 'ply':
          cadRootNode = await plyHelper.buildCADTreeFromFile(file);
          break;
        default:
          console.warn(`Unsupported file format: ${extension}`);
      }
      if (cadRootNode != null) {
        this.cadNodes = [...this.cadNodes, cadRootNode];
      }
    }
    this.loading = false;
  }

  clear(): void {
    this.cadNodes = [];
  }

  resetView(): void {
    this.threejsViewer.resetView();
  }

  toggleAxes(): void {
    this.threejsViewer.toggleAxesHelper();
  }

  toggleGrid(): void {
    this.threejsViewer.toggleGridHelper();
  }
}
