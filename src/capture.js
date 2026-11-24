import {classify} from "./logic.js";
export class Capture{
 constructor(onFrame,onState,onGesture){this.onFrame=onFrame;this.onState=onState;this.onGesture=onGesture;this.generation=0;this.active=false;}
 stop(reason="Camera off"){this.generation++;this.active=false;clearInterval(this.timer);clearTimeout(this.timeout);this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;this.worker?.terminate();this.worker=null;if(this.video){this.video.pause();this.video.srcObject=null;this.video=null;}this.onFrame(null);this.onState(reason,false);}
 async start(facing="environment"){this.stop();const token=this.generation;this.active=true;this.onState("Requesting camera…",true);let video;try{
 if(!navigator.mediaDevices?.getUserMedia)throw Error("Camera requires HTTPS and a supported browser.");
 const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:facing==="environment"?{exact:"environment"}:{ideal:"user"},width:{ideal:640},height:{ideal:480},frameRate:{ideal:15,max:24}}});
 if(token!==this.generation){stream.getTracks().forEach(t=>t.stop());return}this.stream=stream;
 stream.getVideoTracks()[0].addEventListener("ended",()=>{if(token===this.generation)this.stop("Camera disconnected")});
 video=document.createElement("video");video.muted=true;video.playsInline=true;video.autoplay=true;video.srcObject=stream;this.video=video;await video.play();if(token!==this.generation)return;
 const worker=new Worker(import.meta.env.BASE_URL+"vision/landmarks.js");this.worker=worker;let ready=false,busy=false,last=-1,candidate=null,count=0,activeGesture=null,previous=null,lastSwipe=-1000;
 const mirror=facing!=="environment"&&(stream.getVideoTracks()[0].getSettings().facingMode||"user")==="user";
 const fail=message=>{if(token===this.generation)this.stop(message)};
 this.timeout=setTimeout(()=>fail("Hand model timed out. Check connection, then retry."),30000);
 worker.onerror=()=>fail("Hand model could not load. Retry or use touch.");
 worker.onmessage=({data})=>{if(token!==this.generation)return;if(data.error){fail("Tracking unavailable. "+data.error.slice(0,150));return}if(data.ready){ready=true;clearTimeout(this.timeout);this.onState("Show one hand",true);return}busy=false;clearTimeout(this.timeout);const p=data.landmarks;
 if(!p){previous=null;candidate=activeGesture=null;count=0;this.onFrame(null);this.onState("Show one hand",true);return}
 const points=p.map(a=>({x:mirror?1-a.x:a.x,y:a.y,z:a.z}));const g=classify(points);if(g!==candidate){candidate=g;count=0}if(++count>=3&&candidate!==activeGesture){activeGesture=candidate;if(g)this.onGesture(g);}
 if(previous){const dx=points[0].x-previous.x,dy=points[0].y-previous.y,dt=data.t-previous.t;if(dt>0&&dt<300&&Math.hypot(dx,dy)>.055&&Math.hypot(dx,dy)/dt>.001&&data.t-lastSwipe>650){this.onGesture("Swipe",[dx,-dy]);lastSwipe=data.t;}}
 previous={x:points[0].x,y:points[0].y,t:data.t};this.onFrame(points,video.videoWidth/video.videoHeight,activeGesture);this.onState(activeGesture?"Hand / "+activeGesture:"Hand detected",true);
 };
 worker.postMessage({init:true,base:location.origin+import.meta.env.BASE_URL});
 this.timer=setInterval(async()=>{if(!ready||busy||token!==this.generation||video.readyState<2||last===video.currentTime)return;busy=true;last=video.currentTime;try{const bitmap=await createImageBitmap(video);if(token!==this.generation){bitmap.close();return}this.timeout=setTimeout(()=>fail("Tracking stalled. Retry camera."),4000);worker.postMessage({bitmap,t:performance.now()},[bitmap]);}catch{fail("Camera frame unavailable. Try again.");}},83);
 }catch(e){if(token===this.generation)this.stop(facing==="environment"&&e.name==="OverconstrainedError"?"Rear camera unavailable. Use webcam in Settings.":String(e.message||e));}}
}
