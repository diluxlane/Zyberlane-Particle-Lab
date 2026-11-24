# Implementation and physical acceptance

Plan: preserve XR identity; render a world-anchored particle sculpture; permission-gated orientation and touch; detached camera and worker; map landmarks to approximate world position; retain tracking in phone stereo; native headset input; test and optimize.

Pending on a real HTTPS deployment:
- [ ] Verify Vercel build and browser console on desktop and Android.
- [ ] On Redmi 15, rotate yaw through 360°, pitch up/down, roll, and repeat after portrait/landscape changes. Verify recenter and no-heading fallback.
- [ ] Grant/deny rear camera permission, check browser indicator, confirm no footage is visible, and verify camera release when stopped or backgrounded.
- [ ] Test all six forms and gestures, both hands separately, lighting changes, loss/reacquisition, calibration and finger-to-particle alignment.
- [ ] Verify split view while camera is active, exit controls, CSS fullscreen fallback, and portrait/landscape layout.
- [ ] Verify headset mode and supported controller/hand rays on real WebXR hardware.
- [ ] Profile sustained FPS, latency, temperature, memory; tune quality before sign-off.

No physical-device results or deployment success are asserted.

## Regression checks
Verify slow horizontal movement, tilted starting poses, compass/relative source switching, generic sensors where available, and smooth heading continuity. Check mesh lines, spring pull/release, ripples and all six shape changes. Record rendering and hand-tracking FPS separately.
