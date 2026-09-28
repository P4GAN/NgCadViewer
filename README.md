# NgCadViewer

An Angular component for viewing CAD files in the browser. STEP, IGES and BREP files are parsed with
[OpenCascade](https://dev.opencascade.org/) compiled to WebAssembly, and rendered with three.js. Everything
runs client-side: files are never uploaded anywhere.

**[Try the live demo →](https://p4gan.github.io/NgCadViewer/)**

[![Deploy demo](https://github.com/P4GAN/NgCadViewer/actions/workflows/deploy-demo.yml/badge.svg)](https://github.com/P4GAN/NgCadViewer/actions/workflows/deploy-demo.yml)
![Angular 20](https://img.shields.io/badge/Angular-20-DD0031?logo=angular&logoColor=white)
![three.js](https://img.shields.io/badge/three.js-r172-000000?logo=threedotjs&logoColor=white)
![WebAssembly](https://img.shields.io/badge/WebAssembly-OpenCascade-654FF0?logo=webassembly&logoColor=white)

[![Screenshot of the demo showing a robot arm assembly with its part tree](docs/screenshot.png)](https://p4gan.github.io/NgCadViewer/)


## Project structure

```text
projects/
├── ng-cad-viewer/                      # the library
│   └── src/lib/
│       ├── ng-cad-viewer.ts            # <ng-cad-viewer>: public API, toolbar, loading overlay
│       ├── components/threejs-viewer/  # three.js scene, camera, controls, gizmos
│       ├── components/cad-tree/        # assembly tree panel
│       ├── helpers/step-helper.ts      # OCCT result → three.js meshes + B-rep edge outlines
│       ├── helpers/ply-helper.ts       # PLY → three.js mesh
│       └── types/occt-import-js.d.ts   # type declarations for occt-import-js
└── demo-app/                           # the GitHub Pages demo
scripts/generate_sample.py              # CadQuery script that generates the demo's sample model
.github/workflows/deploy-demo.yml       # builds and deploys the demo to GitHub Pages
```

## Development

Requires Node.js 20.19+, 22.12+ or 24+.

```bash
npm install
npm start       # builds the library, then serves the demo at http://localhost:4200
npm test        # unit tests for the library and demo (headless Chrome)
npm run build   # production build of the library and demo
```

The demo imports the library from `dist/`, so after changing library code, rebuild it with `npm run build:lib`,
or keep `npx ng build NgCadViewer --watch` running in a second terminal.


## Acknowledgements

- [occt-import-js](https://github.com/kovacsv/occt-import-js) by Viktor Kovacs, which packages
  [Open CASCADE Technology](https://dev.opencascade.org/) for the browser (LGPL-2.1, loaded at runtime from jsDelivr)
- [three.js](https://threejs.org/) and [three-viewport-gizmo](https://github.com/Fennec-hub/three-viewport-gizmo)
- [PrimeNG](https://primeng.org/) for the UI components
