import test from "node:test";
import assert from "node:assert/strict";
import {qMultiply,sensorQuaternion,genericOrientation,headingRoute} from "../src/orientation.js";
globalThis.screen={orientation:{angle:90}};globalThis.window={};
const axis=(i,a)=>{const q=[0,0,0,Math.cos(a/2)];q[i]=Math.sin(a/2);return q;};
test("generic native quaternion matches device event conversion",()=>{for(const [a,b,g] of [[0,0,0],[35,25,15],[170,90,0],[315,-15,60]]){const k=Math.PI/180,raw=qMultiply(qMultiply(axis(2,a*k),axis(0,b*k)),axis(1,g*k)),q=genericOrientation(raw),v=sensorQuaternion(a,b,g);assert.ok(1-Math.abs(q.reduce((s,x,i)=>s+x*v[i],0))<1e-8);}});
test("slow heading changes accumulate",()=>{const r={};for(let i=0;i<10;i++)headingRoute(r,"relative",10+i*.1,1000+i*20);assert.ok(r.streams.relative.headingAt>=1060);});
