import test from "node:test";
import assert from "node:assert/strict";
import {FORMS,point,estimatedDepth,classify} from "../src/logic.js";
test("six distinct finite shapes",()=>{assert.equal(FORMS.length,6);const points=FORMS.map(f=>point(f,.21,.37,.73));assert.equal(new Set(points.map(p=>p.join(","))).size,6);for(const p of points)assert.ok(p.every(Number.isFinite));});
test("depth clamping and calibration",()=>{assert.equal(estimatedDepth(.17),4);assert.equal(estimatedDepth(.001),6.5);assert.equal(estimatedDepth(2),2.1);assert.equal(estimatedDepth(.25,.25),4);});
test("invalid landmarks are ignored",()=>{assert.equal(classify(null),null);assert.equal(classify([]),null);});
test("pinch recognition",()=>{const p=Array.from({length:21},()=>({x:.5,y:.4,z:0}));p[9]={x:.5,y:.2,z:0};assert.equal(classify(p),"Pinch");});
