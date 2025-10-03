declare module 'occt-import-js' {
  export interface brep_face {
    first: number;
    last: number;
    color: [number, number, number] | null;
  }

  export interface mesh {
    name: string;
    color: [number, number, number] | null;
    brep_faces: brep_face[];
    attributes: {
      position: {
        array: number[];
      };
      normal: {
        array: number[];
      };
    };
    index: {
      array: number[];
    };
  }

  export interface node {
    name: string;
    meshes: number[];
    children: node[];
  }

  export interface OCCTResult {
    success: boolean;
    root: node;
    meshes: mesh[];
  }

  export interface OCCT {
    ReadStepFile: (
      fileBuffer: Uint8Array,
      options: object | null,
    ) => OCCTResult;
    ReadBrepFile: (
      fileBuffer: Uint8Array,
      options: object | null,
    ) => OCCTResult;
    ReadIgesFile: (
      fileBuffer: Uint8Array,
      options: object | null,
    ) => OCCTResult;
  }

  export default function occtimportjs(): Promise<OCCT>;
}
