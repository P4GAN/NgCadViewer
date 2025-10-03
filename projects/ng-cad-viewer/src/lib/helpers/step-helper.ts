import * as THREE from 'three';
import * as occtImportJS from 'occt-import-js';
import { CadNode } from '../models/cadnode.model';

export function occtMeshToThreeMesh(mesh: occtImportJS.mesh): {
  threeMesh: THREE.Mesh;
  edgeLines: THREE.LineSegments;
} {
  const geometry = new THREE.BufferGeometry();
  const positions = mesh.attributes.position.array;
  const normals = mesh.attributes.normal.array;
  const indices = mesh.index.array;

  const edgePositions: number[] = [];
  // Create edges separating brep_faces by removing duplicate internal edges
  for (const face of mesh.brep_faces) {
    const edgeMap = new Map<string, [number, number]>();
    for (let i = face.first; i <= face.last; i += 1) {
      const tri = [indices[i * 3], indices[i * 3 + 1], indices[i * 3 + 2]];

      for (let e = 0; e < 3; e++) {
        const v0 = tri[e];
        const v1 = tri[(e + 1) % 3];

        const key = v0 < v1 ? `${v0}-${v1}` : `${v1}-${v0}`;
        if (edgeMap.has(key)) {
          edgeMap.delete(key);
        } else {
          edgeMap.set(key, [v0, v1]);
        }
      }
    }

    for (const [v0, v1] of edgeMap.values()) {
      edgePositions.push(
        positions[v0 * 3],
        positions[v0 * 3 + 1],
        positions[v0 * 3 + 2],
        positions[v1 * 3],
        positions[v1 * 3 + 1],
        positions[v1 * 3 + 2],
      );
    }
  }

  const edgeGeometry = new THREE.BufferGeometry();
  edgeGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(edgePositions, 3),
  );

  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
  const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);

  // Now create the mesh
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  );
  if (normals) {
    geometry.setAttribute(
      'normal',
      new THREE.Float32BufferAttribute(normals, 3),
    );
  }
  const index = Uint32Array.from(indices);
  geometry.setIndex(new THREE.BufferAttribute(index, 1));

  let material = null;
  if (mesh.color) {
    const color = new THREE.Color(mesh.color[0], mesh.color[1], mesh.color[2]);
    material = new THREE.MeshStandardMaterial({ color: color });
  } else {
    // Light gray as default color
    material = new THREE.MeshStandardMaterial({
      color: new THREE.Color('LightGray'),
    });
  }
  const threeMesh = new THREE.Mesh(geometry, material);
  threeMesh.castShadow = true;
  threeMesh.receiveShadow = true;

  return { threeMesh, edgeLines };
}

export async function readFile(
  file: File,
  occt: occtImportJS.OCCT,
): Promise<occtImportJS.OCCTResult> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension) {
    throw new Error('File has no extension');
  }
  const fileBuffer = await file.arrayBuffer();
  switch (fileExtension) {
    case 'step':
    case 'stp': {
      return occt.ReadStepFile(new Uint8Array(fileBuffer), {});
    }
    case 'iges':
    case 'igs': {
      const fileBuffer = await file.arrayBuffer();
      return occt.ReadIgesFile(new Uint8Array(fileBuffer), {});
    }
    case 'brep':
    case 'brp': {
      const fileBuffer = await file.arrayBuffer();
      return occt.ReadBrepFile(new Uint8Array(fileBuffer), {});
    }
    default:
      throw new Error(`Unsupported file format: ${fileExtension}`);
  }
}

export async function buildCADTreeFromFile(
  file: File,
  occt: occtImportJS.OCCT,
): Promise<CadNode> {
  const result = await readFile(file, occt);

  // Traverse through result.root to build CAD assembly tree
  const processNode = (node: occtImportJS.node): CadNode => {
    const nodeMeshesAndEdgeLines = node.meshes.map((meshIndex) =>
      occtMeshToThreeMesh(result.meshes[meshIndex]),
    );
    const cadNode: CadNode = {
      name: node.name,
      visible: true,
      selected: false,
      meshes: nodeMeshesAndEdgeLines.map((item) => item.threeMesh),
      edgeLines: nodeMeshesAndEdgeLines.map((item) => item.edgeLines),
      children: [],
    };

    for (const child of node.children) {
      cadNode.children.push(processNode(child));
    }

    return cadNode;
  };

  // Root node is usually empty
  const rootCadNode = processNode(result.root);
  rootCadNode.name = file.name;
  return rootCadNode;
}
