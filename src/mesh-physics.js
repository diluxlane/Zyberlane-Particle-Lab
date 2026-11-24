import {COUNT,topology,writeMesh} from "./mesh-field.js";
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export class MeshPhysics{
 constructor(){this.form="Silk";this.p=new Float32Array(COUNT*3);this.v=new Float32Array(COUNT*3);this.anchor=new Float32Array(COUNT*3);this.goal=new Float32Array(COUNT*3);this.prev=new Float32Array(COUNT*3);this.time=0;this.tick=0;this.pointer=null;this.grab=-1;this.pulses=[];this.twist=0;this.twistV=0;this.mode=null;this.modeTime=0;this.low=true;writeMesh(this.anchor,this.form);this.p.set(this.anchor);this.goal.set(this.anchor);this.setup();}
 setup(){this.edges=topology(this.form).edges;this.lengths=new Float32Array(this.edges.length/2);this.updateLengths();}
 updateLengths(){const a=this.anchor;for(let j=0;j<this.lengths.length;j++){const i=this.edges[2*j]*3,k=this.edges[2*j+1]*3;const x=a[i]-a[k],y=a[i+1]-a[k+1],z=a[i+2]-a[k+2];this.lengths[j]=Math.sqrt(x*x+y*y+z*z);}}
 select(form){if(form===this.form)return;this.form=form;this.grab=-1;this.setup();writeMesh(this.goal,form,this.time,this.twist);}
 nearest(p){let best=-1,d2=.95*.95;for(const i of topology(this.form).points){const a=i*3,x=this.p[a]-p.x,y=this.p[a+1]-p.y,z=this.p[a+2]-p.z,d=x*x+y*y+z*z;if(d<d2){d2=d;best=i}}return best;}
 setPointer(p){if(!p){if(this.pointer?.down&&this.grab>=0){const prev=this.pointer;this.pulse(prev.x,prev.y,prev.z,.45,prev.vx,prev.vy,prev.vz);}this.pointer=null;this.grab=-1;return;}
 const old=this.pointer,dt=old?clamp((p.t-old.t)/1000,.012,.12):.05;
 p.vx=old?clamp((p.x-old.x)/dt,-8,8):0;p.vy=old?clamp((p.y-old.y)/dt,-8,8):0;p.vz=old?clamp((p.z-old.z)/dt,-8,8):0;
 if(p.down&&(!old?.down||this.grab<0))this.grab=this.nearest(p);if(!p.down&&old?.down){this.pulse(p.x,p.y,p.z,.45,old.vx,old.vy,old.vz);this.grab=-1;}this.pointer=p;}
 pulse(x=0,y=0,z=0,force=1,vx=0,vy=0,vz=0){if(![x,y,z,force,vx,vy,vz].every(Number.isFinite))return;this.pulses.push({x,y,z,age:0,force:clamp(force,0,2),vx,vy,vz});if(this.pulses.length>5)this.pulses.shift();}
 effect(mode){this.mode=mode;this.modeTime=0;}
 kick(delta){this.twistV=clamp(this.twistV+clamp(delta,-.55,.55)*8,-6,6);}
 step(dt=1/60){dt=clamp(dt,1/120,1/30);this.time+=dt;this.tick++;this.modeTime+=dt;this.twistV=(this.twistV-this.twist*10*dt)*Math.exp(-4*dt);this.twist=clamp(this.twist+this.twistV*dt,-2,2);
 const a=this.anchor,p=this.p,v=this.v;writeMesh(this.goal,this.form,this.time,this.twist);const follow=1-Math.exp(-dt*6);for(let i=0;i<a.length;i++)a[i]+=(this.goal[i]-a[i])*follow;this.updateLengths();this.prev.set(p);
 const damp=Math.exp(-dt*3.4),ptr=this.pointer,grab=this.grab*3,gx=ptr&&this.grab>=0?ptr.x-a[grab]:0,gy=ptr&&this.grab>=0?ptr.y-a[grab+1]:0,gz=ptr&&this.grab>=0?ptr.z-a[grab+2]:0;
 for(let i=0;i<COUNT;i++){const k=i*3,x=p[k],y=p[k+1],z=p[k+2],t=this.time*.7;let fx=(a[k]-x)*24+.2*Math.sin(z*2+t),fy=(a[k+1]-y)*24+.18*Math.cos(x*2-t),fz=(a[k+2]-z)*24+.2*Math.sin(y*2+t);
 if(ptr){const dx=x-ptr.x,dy=y-ptr.y,dz=z-ptr.z,d2=dx*dx+dy*dy+dz*dz;if(ptr.down&&this.grab>=0){const ax=a[k]-a[grab],ay=a[k+1]-a[grab+1],az=a[k+2]-a[grab+2],d=ax*ax+ay*ay+az*az;if(d<1.8){const w=Math.exp(-d*5)*105;fx+=(a[k]+gx-x)*w;fy+=(a[k+1]+gy-y)*w;fz+=(a[k+2]+gz-z)*w;}}else if(d2<2){const w=Math.exp(-d2*3);fx+=(dx*16+ptr.vx*.9)*w;fy+=(dy*16+ptr.vy*.9)*w;fz+=(dz*16+ptr.vz*.9)*w;}}
 for(const pulse of this.pulses){const dx=x-pulse.x,dy=y-pulse.y,dz=z-pulse.z,d=Math.hypot(dx,dy,dz)+.001,shell=d-pulse.age*3.1;if(Math.abs(shell)<.7){const w=Math.exp(-shell*shell*20-pulse.age*2.5)*pulse.force*34/d;fx+=dx*w+pulse.vx*w*.08;fy+=dy*w+pulse.vy*w*.08;fz+=dz*w+pulse.vz*w*.08;}}
 if(this.mode&&this.modeTime<1.2){const power=Math.exp(-this.modeTime*3);if(this.mode==="scatter"){fx+=x*power*12;fy+=y*power*12;fz+=z*power*12;}if(this.mode==="vortex"){fx+=-z*power*11;fz+=x*power*11;fy+=power*2.5;}}
 v[k]=(v[k]+fx*dt)*damp;v[k+1]=(v[k+1]+fy*dt)*damp;v[k+2]=(v[k+2]+fz*dt)*damp;p[k]+=v[k]*dt;p[k+1]+=v[k+1]*dt;p[k+2]+=v[k+2]*dt;}
 for(let iter=0;iter<(this.low?1:2);iter++)for(let j=0;j<this.lengths.length;j++){const i=this.edges[2*j]*3,k=this.edges[2*j+1]*3,dx=p[k]-p[i],dy=p[k+1]-p[i+1],dz=p[k+2]-p[i+2],d=Math.sqrt(dx*dx+dy*dy+dz*dz)+1e-7,w=(d-this.lengths[j])/d*.19;p[i]+=dx*w;p[i+1]+=dy*w;p[i+2]+=dz*w;p[k]-=dx*w;p[k+1]-=dy*w;p[k+2]-=dz*w;}
 for(let i=0;i<p.length;i++){if(!Number.isFinite(p[i])||Math.abs(p[i])>8){p[i]=a[i];v[i]=0;}else v[i]=clamp((p[i]-this.prev[i])/dt,-14,14);}
 for(const p of this.pulses)p.age+=dt;this.pulses=this.pulses.filter(p=>p.age<1.6);if(this.pointer){this.pointer.vx*=.82;this.pointer.vy*=.82;this.pointer.vz*=.82;}}
}
