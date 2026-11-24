import * as T from "three";
import {clamp} from "./logic.js";
import {qMultiply,sensorQuaternion,headingRoute,leveledDelta,startQuaternionSensors} from "./orientation.js";
const euler=new T.Euler(0,0,0,"YXZ");
export class Motion{
 constructor(camera,report){this.camera=camera;this.report=report;this.raw=null;this.base=null;this.offset=[0,0,0,1];this.router={};this.target=new T.Quaternion();this.sensor=new T.Quaternion();this.yaw=0;this.pitch=0;this.enabled=false;this.pending=false;this.smoothing=16;this.last=0;this.source=null;this.heading=null;this.hasHeading=false;this.listener=e=>this.receive(e,false);this.absolute=e=>this.receive(e,true);}
 delta(){return this.base&&this.raw?qMultiply(this.offset,leveledDelta(this.base,this.raw)):this.offset;}
 receive(e,absolute){if(!this.enabled||!Number.isFinite(e.beta)||!Number.isFinite(e.gamma))return;const now=performance.now(),source=e.source||(absolute||e.absolute?"absolute":"relative"),alpha=Number.isFinite(e.alpha)?e.alpha:Number.isFinite(e.webkitCompassHeading)?(360-e.webkitCompassHeading)%360:NaN;
 const interrupted=this.raw&&now-this.last>3500;if(interrupted)this.router={};
 if(!headingRoute(this.router,source,alpha,now))return;
 const changed=this.source&&source!==this.source;
 if(changed||interrupted){this.offset=this.delta();this.base=null;this.heading=null;}
 if(Number.isFinite(alpha))this.heading=alpha;
 this.raw=e.rawQuaternion||sensorQuaternion(this.heading??0,e.beta,e.gamma);if(!this.base)this.base=this.raw.slice();
 const report=!this.source||changed||interrupted||this.hasHeading!==Number.isFinite(alpha);this.source=source;this.hasHeading=Number.isFinite(alpha);this.last=now;if(report)this.report(this.hasHeading?"Motion / "+source:"Tilt only · drag for heading",true);}
 async toggle(){if(this.pending)return;if(this.enabled){this.stop();return}this.pending=true;try{if(!window.isSecureContext)throw Error("Motion requires HTTPS");const D=window.DeviceOrientationEvent;if(!D&&!window.RelativeOrientationSensor&&!window.AbsoluteOrientationSensor)throw Error("Motion sensor unavailable");if(typeof D?.requestPermission==="function"){let permission;try{permission=await D.requestPermission(true)}catch{permission=await D.requestPermission()}if(permission!=="granted")throw Error("Motion permission denied");}if(document.hidden)throw Error("Motion paused");this.enabled=true;this.raw=this.base=this.source=this.heading=null;this.offset=[0,0,0,1];this.router={};this.yaw=this.pitch=0;this.report("Waiting for motion…",true);window.addEventListener("deviceorientation",this.listener);window.addEventListener("deviceorientationabsolute",this.absolute);this.stopQuaternionSensors=startQuaternionSensors(e=>this.receive(e,false));this.timer=setTimeout(()=>{if(!this.raw)this.stop("No orientation readings. Drag to look.")},3500)}catch(e){this.stop(e.message)}finally{this.pending=false}}
 stop(message="Touch look"){this.stopQuaternionSensors?.();this.stopQuaternionSensors=null;clearTimeout(this.timer);window.removeEventListener("deviceorientation",this.listener);window.removeEventListener("deviceorientationabsolute",this.absolute);this.enabled=false;this.raw=this.base=this.source=null;this.offset=[0,0,0,1];this.yaw=this.pitch=0;this.report(message,false)}
 center(){this.yaw=this.pitch=0;if(this.raw)this.base=this.raw.slice();this.offset=[0,0,0,1];this.camera.quaternion.identity();}
 drag(dx,dy){this.yaw-=dx*.004;this.pitch=clamp(this.pitch-dy*.004,-Math.PI/2+.01,Math.PI/2-.01);}
 update(dt){this.target.setFromEuler(euler.set(this.pitch,this.yaw,0,"YXZ"));if(this.enabled&&this.raw){this.sensor.fromArray(this.delta());this.target.multiply(this.sensor);}this.camera.quaternion.slerp(this.target,1-Math.exp(-dt*this.smoothing));if(this.enabled&&this.raw&&performance.now()-this.last>3500&&!this.stale){this.stale=true;this.report("Sensors paused · drag to look",true)}else if(performance.now()-this.last<3500)this.stale=false;}
}
