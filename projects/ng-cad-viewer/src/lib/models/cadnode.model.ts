import { Mesh, LineSegments } from 'three';

export interface CadNode {
  name: string;
  visible: boolean;
  selected: boolean;
  meshes: Mesh[];
  edgeLines: LineSegments[];
  children: CadNode[];
}
