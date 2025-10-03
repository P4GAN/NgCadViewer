import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { CadNode } from '../models/cadnode.model';
import * as THREE from 'three';

const defaultColor = new THREE.Color('LightGray');
const meshStandardMaterial = new THREE.MeshStandardMaterial({
  side: THREE.DoubleSide,
});

// Currently this just makes one node from a PLY file
// TODO: Add function to build tree structure from PLY files
export async function buildCADTreeFromFile(file: File): Promise<CadNode> {
  const fileBuffer = await file.arrayBuffer();
  const plyLoader = new PLYLoader();
  plyLoader.customPropertyMapping = {
    topo: ['topo'],
    meshIndex: ['meshIndex'],
  };
  const geometry = plyLoader.parse(fileBuffer);
  if (!geometry.hasAttribute('color')) {
    const colorArray = new Uint8Array(
      geometry.getAttribute('position').count * 3,
    );
    for (let i = 0; i < colorArray.length; i += 3) {
      colorArray[i] = defaultColor.r * 255;
      colorArray[i + 1] = defaultColor.g * 255;
      colorArray[i + 2] = defaultColor.b * 255;
    }
    const colorAttr = new THREE.Uint8BufferAttribute(colorArray, 3);
    colorAttr.normalized = true;
    geometry.setAttribute('color', colorAttr);
  }

  // Clone the color attribute into an original color attribute.
  geometry.setAttribute(
    'originalColor',
    geometry.getAttribute('color').clone(),
  );

  const mesh = new THREE.Mesh(geometry, meshStandardMaterial);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const cadNode: CadNode = {
    name: file.name,
    visible: true,
    selected: false,
    meshes: [mesh],
    edgeLines: [],
    children: [],
  };
  return cadNode;
}
