import {cp,mkdir} from "node:fs/promises";
import {build} from "esbuild";
await mkdir("public/vision",{recursive:true});
await cp("node_modules/@mediapipe/tasks-vision/wasm","public/vision",{recursive:true});
await build({entryPoints:["src/vision.worker.js"],bundle:true,minify:true,format:"iife",outfile:"public/vision/landmarks.js"});
