import * as T from "three";
import {FORMS} from "./logic.js";
import {COUNT,topology,writeMesh} from "./mesh-field.js";
export class Sculpture{
 constructor(scene){this.p=new Float32Array(COUNT*3);writeMesh(this.p,"Silk");this.attribute=new T.BufferAttribute(this.p,3).setUsage(T.DynamicDrawUsage);this.pointsGeo=new T.BufferGeometry().setAttribute("position",this.attribute);this.linesGeo=new T.BufferGeometry().setAttribute("position",this.attribute);this.form="Silk";this.object=new T.Group();this.object.position.set(0,0,-4);
 this.uniforms={pixelRatio:{value:1},pointer:{value:new T.Vector3(100,100,100)},charge:{value:0}};
 const vertex=`uniform float pixelRatio,charge;uniform vec3 pointer;varying float vLight,vAlpha;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);float depth=max(.7,-mv.z);float hit=exp(-dot(position-pointer,position-pointer)*6.);vLight=.38+.38*clamp(position.y*.34+.5,0.,1.)+.75*hit+.12*charge;vAlpha=clamp(1.2-depth*.10,.20,.86);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((1.55+hit*1.9)*pixelRatio*4./depth,1.,6.*pixelRatio);}`;
 const pointFrag=`varying float vLight,vAlpha;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;float halo=pow(1.-r,1.1),core=pow(1.-r,4.);gl_FragColor=vec4(mix(vec3(.25,.57,.94),vec3(.88,.96,1.),clamp(vLight,0.,1.))*(.6+vLight),vAlpha*(halo*.7+core*.7));}`;
 const lineFrag=`varying float vLight,vAlpha;void main(){gl_FragColor=vec4(mix(vec3(.20,.43,.76),vec3(.64,.85,1.),clamp(vLight,0.,1.)),vAlpha*(.10+.12*vLight));}`;
 const opts={uniforms:this.uniforms,vertexShader:vertex,transparent:true,depthWrite:false,blending:T.AdditiveBlending};this.points=new T.Points(this.pointsGeo,new T.ShaderMaterial({...opts,fragmentShader:pointFrag}));this.lines=new T.LineSegments(this.linesGeo,new T.ShaderMaterial({...opts,fragmentShader:lineFrag}));this.points.frustumCulled=this.lines.frustumCulled=false;this.object.add(this.lines,this.points);scene.add(this.object);this.setTopology();
 this.lastPointer=null;this.lastSent=0;this.lastQuality=null;this.worker=new Worker(new URL("./mesh.worker.js",import.meta.url),{type:"module"});this.worker.onmessage=({data})=>{if(data.buffer){this.p.set(new Float32Array(data.buffer));this.attribute.needsUpdate=true;this.worker.postMessage({type:"return",buffer:data.buffer},[data.buffer]);}};this.worker.onerror=()=>{this.worker?.terminate();this.worker=null;this.failed=true;};this.worker.postMessage({type:"init"});}
 post(m){this.worker?.postMessage(m)}
 setTopology(){const t=topology(this.form);this.pointsGeo.setIndex(new T.BufferAttribute(t.points,1));this.linesGeo.setIndex(new T.BufferAttribute(t.edges,1));}
 select(form){if(!FORMS.includes(form)||this.form===form)return;this.form=form;this.setTopology();this.post({type:"form",form});if(this.failed){writeMesh(this.p,form);this.attribute.needsUpdate=true;}}
 interact(world,pull=false){const now=performance.now();if(!world){this.uniforms.pointer.value.set(100,100,100);if(this.lastPointer){this.lastPointer=null;this.post({type:"pointer",pointer:null})}return;}const v=this.uniforms.pointer.value.copy(world).sub(this.object.position),p={x:v.x,y:v.y,z:v.z,down:pull,t:now};const old=this.lastPointer;if(!old||old.down!==pull||now-this.lastSent>=24&&Math.hypot(p.x-old.x,p.y-old.y,p.z-old.z)>.002){this.lastPointer=p;this.lastSent=now;this.post({type:"pointer",pointer:p});}}
 burst(direction=new T.Vector3()){const v=this.lastPointer||{x:0,y:0,z:0};this.uniforms.charge.value=1;this.post({type:"pulse",args:[v.x,v.y,v.z,1,direction.x*5,direction.y*5,direction.z*5]});}
 effect(mode){this.post({type:"effect",mode});}
 kick(delta){this.post({type:"kick",delta});}
 quality(low,ratio){this.uniforms.pixelRatio.value=ratio;if(this.lastQuality!==low){this.lastQuality=low;this.post({type:"quality",low});}}
 active(active){this.post({type:"active",active});}
 update(dt){this.uniforms.charge.value*=Math.exp(-dt*3);}
}
