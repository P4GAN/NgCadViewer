import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  Input,
} from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ViewportGizmo } from 'three-viewport-gizmo';

import { CadNode } from '../../models/cadnode.model';

@Component({
  selector: 'lib-threejs-viewer',
  imports: [],
  templateUrl: './threejs-viewer.component.html',
  styleUrl: './threejs-viewer.component.scss',
})
export class ThreejsViewerComponent {
  private _cadNodes: CadNode[] = [];
  @Input()
  set cadNodes(nodes: CadNode[]) {
    this._cadNodes = nodes;
    this.loadCADNodes(this._cadNodes);
  }

  @ViewChild('webgl') canvas!: ElementRef;

  renderer!: THREE.WebGLRenderer;
  camera!: THREE.PerspectiveCamera;
  controls!: OrbitControls;
  directionalLight!: THREE.DirectionalLight;
  gridHelper!: THREE.GridHelper;
  axesHelper!: THREE.AxesHelper;
  scene: THREE.Scene;
  objectGroup: THREE.Group;

  cubeGizmo!: ViewportGizmo;
  axesGizmo!: ViewportGizmo;

  constructor(private elementRef: ElementRef) {
    this.scene = new THREE.Scene();
    this.objectGroup = new THREE.Group();
    this.scene.add(this.objectGroup);
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.testWebGL()) {
      console.error('WebGL not supported');
      return;
    }
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas.nativeElement,
      antialias: true,
    });
    this.renderer.setSize(
      this.canvas.nativeElement.parentElement.clientWidth,
      this.canvas.nativeElement.parentElement.clientHeight,
    );
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.camera = new THREE.PerspectiveCamera(
      75,
      this.canvas.nativeElement.parentElement.clientWidth /
        this.canvas.nativeElement.parentElement.clientHeight,
      0.1,
      100000,
    );
    this.camera.position.set(50, 50, 50);
    this.scene.add(this.camera);
    this.camera.lookAt(0, 0, 0);

    // Controls
    this.controls = new OrbitControls(this.camera, this.canvas.nativeElement);
    this.controls.target.set(0, 0, 0);

    this.cubeGizmo = new ViewportGizmo(this.camera, this.renderer, {
      type: 'cube',
      placement: 'top-right',
      size: 80,
      container: this.canvas.nativeElement.parentElement,
    });
    this.cubeGizmo.attachControls(this.controls);

    this.axesGizmo = new ViewportGizmo(this.camera, this.renderer, {
      type: 'sphere',
      placement: 'bottom-right',
      size: 80,
      container: this.canvas.nativeElement.parentElement,
    });
    this.axesGizmo.attachControls(this.controls);

    const ambientLight: THREE.AmbientLight = new THREE.AmbientLight(
      0xffffff,
      0.3,
    );
    this.scene.add(ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    this.directionalLight.castShadow = true;
    this.scene.add(this.directionalLight);

    this.gridHelper = new THREE.GridHelper(200, 20, 0x202020, 0x808080);
    this.scene.add(this.gridHelper);

    this.axesHelper = new THREE.AxesHelper(50);
    this.scene.add(this.axesHelper);

    this.scene.background = new THREE.Color('GhostWhite');

    const animate = () => {
      requestAnimationFrame(animate);

      const cameraDirection = this.camera.getWorldDirection(
        new THREE.Vector3(),
      );
      this.directionalLight.position.copy(cameraDirection.multiplyScalar(-1));
      this.directionalLight.updateMatrixWorld();

      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.cubeGizmo.render();
      this.axesGizmo.render();
    };
    animate();
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    event.preventDefault();
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    event.preventDefault();
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    event.preventDefault();
  }

  @HostListener('window:resize')
  onResize() {
    this.renderer.setSize(
      this.canvas.nativeElement.parentElement.clientWidth,
      this.canvas.nativeElement.parentElement.clientHeight,
    );
    this.camera.aspect =
      this.canvas.nativeElement.parentElement.clientWidth /
      this.canvas.nativeElement.parentElement.clientHeight;
    this.camera.updateProjectionMatrix();
    this.cubeGizmo.update();
    this.axesGizmo.update();
  }

  loadCADNodes(cadNodes: CadNode[]): void {
    const selectedMeshes: THREE.Mesh[] = [];
    const processNode = (node: CadNode): void => {
      if (!node.visible) {
        return;
      }
      if (node.selected) {
        node.meshes.forEach((mesh) => selectedMeshes.push(mesh));
      }
      node.meshes.forEach((mesh) => this.objectGroup.add(mesh));
      node.edgeLines.forEach((edge) => this.objectGroup.add(edge));

      node.children.forEach((child) => processNode(child));
    };
    cadNodes.forEach((node) => processNode(node));

    if (selectedMeshes.length > 0) {
      const selectedBox = new THREE.Box3();
      selectedMeshes.forEach((mesh) => {
        mesh.updateWorldMatrix(true, false);
        selectedBox.expandByObject(mesh);
      });

      const selectedBoxHelper = new THREE.Box3Helper(
        selectedBox,
        new THREE.Color('Magenta'),
      );
      this.scene.add(selectedBoxHelper);
    }

    this.resetView();
  }

  fitToScene(bbox: THREE.Box3): void {
    const center = bbox.getCenter(new THREE.Vector3());
    const dims = bbox.getSize(new THREE.Vector3());
    const largestDim = Math.max(dims.x, dims.y, dims.z);

    this.camera.position
      .copy(center)
      .add(new THREE.Vector3(largestDim / 2, largestDim / 2, largestDim / 2));
    this.camera.lookAt(center);
    this.controls.target.copy(center);
    this.controls.update();
    this.directionalLight.position.copy(this.camera.position);
    this.directionalLight.target.position.copy(this.controls.target);
    this.directionalLight.updateMatrixWorld();

    // Grid axes should be every 10mm for scale
    this.scene.remove(this.gridHelper);
    const numDivisions = 2 * Math.ceil(largestDim / 10);
    this.gridHelper = new THREE.GridHelper(
      10 * numDivisions,
      numDivisions,
      0x202020,
      0x808080,
    );
    this.gridHelper.position.set(center.x, center.y - dims.y / 2, center.z);
    this.scene.add(this.gridHelper);

    this.scene.remove(this.axesHelper);
    this.axesHelper = new THREE.AxesHelper(largestDim);
    this.axesHelper.position.set(center.x, center.y - dims.y / 2, center.z);
    this.scene.add(this.axesHelper);
  }

  resetView() {
    if (this.camera === undefined) {
      return;
    }
    const sceneBBox: THREE.Box3 = new THREE.Box3().setFromObject(
      this.objectGroup,
    );

    this.fitToScene(sceneBBox);
  }

  toggleAxesHelper(): void {
    this.axesHelper.visible = !this.axesHelper.visible;
    this.axesGizmo.visible = !this.axesGizmo.visible;
    this.cubeGizmo.visible = !this.cubeGizmo.visible;
  }

  toggleGridHelper(): void {
    this.gridHelper.visible = !this.gridHelper.visible;
  }

  testWebGL(): boolean {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return gl instanceof WebGLRenderingContext;
  }
}
