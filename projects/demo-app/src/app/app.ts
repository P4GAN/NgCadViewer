import { Component, ViewChild } from '@angular/core';
import { Button } from 'primeng/button';

import { NgCadViewer } from 'NgCadViewer';

const SAMPLE_FILE = 'samples/robot-arm.step';

@Component({
  selector: 'app-root',
  imports: [NgCadViewer, Button],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  @ViewChild(NgCadViewer) cadViewer!: NgCadViewer;

  readonly acceptedExtensions = '.step,.stp,.iges,.igs,.brep,.brp,.ply';
  dragging = false;

  ngAfterViewInit(): void {
    // Show something straight away so visitors don't need a CAD file to try it
    this.loadSample();
  }

  async loadSample(): Promise<void> {
    const response = await fetch(SAMPLE_FILE);
    if (!response.ok) {
      console.error(`Failed to fetch sample file: ${response.status}`);
      return;
    }
    const blob = await response.blob();
    const fileName = SAMPLE_FILE.split('/').pop()!;
    await this.showFiles([new File([blob], fileName)]);
  }

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    await this.showFiles(Array.from(input.files));
    // Allow selecting the same file again
    input.value = '';
  }

  async onFilesDropped(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.dragging = false;
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    await this.showFiles(Array.from(files));
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging = true;
  }

  onDragLeave(event: DragEvent): void {
    // Ignore dragleave events fired when moving between child elements
    const target = event.currentTarget as HTMLElement;
    if (!target.contains(event.relatedTarget as Node)) {
      this.dragging = false;
    }
  }

  clear(): void {
    this.cadViewer.clear();
  }

  private async showFiles(files: File[]): Promise<void> {
    this.cadViewer.clear();
    try {
      await this.cadViewer.loadCADFiles(files);
    } catch (err) {
      console.error('Error loading CAD files:', err);
    }
  }
}
