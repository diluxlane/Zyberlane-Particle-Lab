# Zyberlane Spatial Particle Lab

Standalone experiment 002 in Zyberlane XR / Labs. Six connected, worker-simulated elastic mesh sculptures, orientation-based 360° viewing, touch fallback, a rear-camera driven digital skeleton and phone stereo view.

## Develop
Node.js 22 LTS recommended. Run `npm install`, `npm run dev`, `npm test`, and `npm run build`. Vercel uses Vite and the dist directory. The build copies pinned MediaPipe WASM and bundles the classic inference worker. First camera use downloads the versioned model from Google; the application does not send camera images to any service.

## Use
Open in an HTTPS browser. Select a form, enable Motion, recenter, then enable Rear camera. The video element is detached from the document; only digital landmarks and the virtual sculpture render. Settings includes calibration, quality, a webcam alternative, manual gestures and supported immersive WebXR entry. Phone split view preserves camera tracking. Native headset sessions stop the phone camera and use controller or supported headset hand rays.

## Scope and constraints
- Orientation-only anchoring, not SLAM or measured physical translation. Depth estimates use hand size, calibration and landmark relative depth; accuracy is approximate.
- Browser sensor availability varies, especially heading on phones without suitable sensors. Drag look is available. Fullscreen includes a CSS fallback.
- Native WebXR and concurrent phone VR camera use require real hardware acceptance. No lens-specific optical correction. Use seated in a clear space and stop on discomfort.
- Camera stops on explicit stop, hidden page, page exit, native headset entry, or capture failure. No recording, account, analytics, backend or frame upload.
- Brand SVGs sourced from the owner's Zyberlane XR repository; Inter Tight uses the pinned XR-hosted font files (OFL license included).
- Original implementation inspired by the behavior of [mesh.](https://github.com/DanDekker/mesh.) and [gesture-particle](https://github.com/ppongtong/gesture-particle); no external reference code copied. Existing [My 3D World](https://github.com/diluxlane/3Dworld) informed the worker and interaction architecture.

## Release checks
`npm test` covers pure shape/depth/classification logic and runs during build. See [QA checklist](docs/QA.md).

## Motion and mesh revision
The browser selects responsive relative, absolute or supported Generic Sensor quaternion streams. Tilt-only and touch fallback remain explicit. Mesh physics uses connected points and edges, local springs, pinches, directional ripples, release momentum, and wheel torsion in a worker. Camera uses frame-driven capture (up to requested 30 FPS), a single outstanding inference, and a measured hand-detection rate. Actual sustained frame rate and accuracy require device testing. Reference behavior: mesh. public demo and gesture-particle; no upstream copyrighted code included.
