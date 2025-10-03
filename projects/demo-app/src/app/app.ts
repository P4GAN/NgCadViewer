import { Component, ViewChild } from '@angular/core';

import { NgCadViewer } from 'NgCadViewer';

@Component({
  selector: 'app-root',
  imports: [NgCadViewer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  @ViewChild(NgCadViewer) cadViewer!: NgCadViewer;

  async onFilesDropped(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    try {
      await this.cadViewer.loadCADFiles(Array.from(files));
      console.log('CAD files loaded successfully');
    } catch (err) {
      console.error('Error loading CAD files:', err);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }
}
