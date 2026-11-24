import test from "node:test";
import assert from "node:assert/strict";
import {COUNT,topology,writeMesh} from "../src/mesh-field.js";
import {MeshPhysics} from "../src/mesh-physics.js";
test("all six connected surfaces have finite geometry and valid indices",()=>{for(const f of ["Silk","Orbit","Wave","Knot","Sphere","Cube"]){const p=new Float32Array(COUNT*3);writeMesh(p,f,1,.2);assert.ok(p.every(Number.isFinite));const t=topology(f);assert.ok(t.points.length>6000&&t.edges.length>10000);assert.ok(t.edges.every(i=>i<COUNT));}});
test("spring simulation stays finite during pull, release and changing shapes",()=>{const s=new MeshPhysics();s.setPointer({x:s.p[0],y:s.p[1],z:s.p[2],down:true,t:0});s.setPointer({x:1,y:.7,z:.3,down:true,t:40});s.pulse(0,0,0,1);for(let i=0;i<15;i++)s.step();s.setPointer(null);s.select("Cube");for(let i=0;i<25;i++)s.step();assert.ok(s.p.every(Number.isFinite));assert.ok(s.p.every(v=>Math.abs(v)<=8));});
