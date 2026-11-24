import test from "node:test";
import assert from "node:assert/strict";
import {qMultiply,qFromEuler,leveledDelta,headingRoute} from "../src/orientation.js";
test("world yaw remains horizontal across pitch and roll",()=>{for(const initial of [[.3,.4,.8],[1.1,2,.3],[-.9,-.4,1]]){const base=qFromEuler(...initial);for(const angle of [0,.5,1.57,3.14,4.71,6.2]){const y=qFromEuler(0,angle,0),q=leveledDelta(base,qMultiply(y,base));assert.ok(1-Math.abs(q.reduce((s,v,i)=>s+v*y[i],0))<1e-8);}}});
test("stationary absolute heading yields to responsive relative heading",()=>{const r={};headingRoute(r,"absolute",30,1000);headingRoute(r,"relative",10,1020);headingRoute(r,"absolute",30,1100);assert.equal(headingRoute(r,"relative",25,1120),true);assert.equal(headingRoute(r,"absolute",30,1140),false);});
