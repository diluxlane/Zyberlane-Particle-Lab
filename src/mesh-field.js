// Original XR mesh topology and parametric surfaces. No upstream source is bundled.
export const ROWS=192,COLS=40,COUNT=ROWS*COLS;
const TAU=Math.PI*2,S=35,slots=6*S*S;
const surface=(()=>{const xyz=new Float32Array(COUNT*3),canonical=new Uint16Array(slots),points=[],edges=[],keys=new Map(),links=new Set();
 const at=(face,r,c)=>face*S*S+r*S+c;
 for(let face=0;face<6;face++)for(let r=0;r<S;r++)for(let c=0;c<S;c++){const a=2*c/(S-1)-1,b=2*r/(S-1)-1,i=at(face,r,c),p=face===0?[1,b,a]:face===1?[-1,b,a]:face===2?[a,1,b]:face===3?[a,-1,b]:face===4?[a,b,1]:[a,b,-1];xyz.set(p,i*3);const key=p.map(v=>Math.round(v*(S-1))).join("/");let q=keys.get(key);if(q===undefined){q=i;keys.set(key,q);points.push(q)}canonical[i]=q;}
 function edge(a,b){a=canonical[a];b=canonical[b];if(a===b)return;const k=Math.min(a,b)*COUNT+Math.max(a,b);if(!links.has(k)){links.add(k);edges.push(a,b)}}
 for(let face=0;face<6;face++)for(let r=0;r<S;r++)for(let c=0;c<S;c++){const i=at(face,r,c);if(r+1<S)edge(i,at(face,r+1,c));if(c+1<S)edge(i,at(face,r,c+1));if(r+1<S&&c+1<S&&(r+c)%2===0)edge(i,at(face,r+1,c+1));}
 return {xyz,points:Uint16Array.from(points),edges:Uint16Array.from(edges)};
})();
const cache=new Map();
export function topology(form){if(cache.has(form))return cache.get(form);if(form==="Cube"||form==="Sphere"){const t={points:surface.points,edges:surface.edges};cache.set(form,t);return t}
 const edges=[],points=Uint16Array.from({length:COUNT},(_,i)=>i),closed=form!=="Wave",tube=form==="Orbit";
 for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const i=r*COLS+c,rr=(r+1)%ROWS,cc=(c+1)%COLS;if(r+1<ROWS||closed)edges.push(i,rr*COLS+c);if(c+1<COLS||tube)edges.push(i,r*COLS+cc);if((r+c)%2===0&&(r+1<ROWS||closed)&&(c+1<COLS||tube))edges.push(i,rr*COLS+cc);}
 const t={points,edges:Uint16Array.from(edges)};cache.set(form,t);return t;}
export function writeMesh(out,form,time=0,twist=0){
 if(form==="Cube"||form==="Sphere"){out.fill(0);for(let i=0;i<slots;i++){let x=surface.xyz[i*3],y=surface.xyz[i*3+1],z=surface.xyz[i*3+2];if(form==="Sphere"){const k=1.34/Math.hypot(x,y,z);x*=k;y*=k;z*=k;}else{x*=1.02;y*=1.02;z*=1.02;}const t=twist*y*.42,c=Math.cos(t),s=Math.sin(t);const k=i*3;out[k]=x*c-z*s;out[k+1]=y;out[k+2]=x*s+z*c;}return;}
 for(let row=0;row<ROWS;row++){const u=row/(form==="Wave"?ROWS-1:ROWS),a=u*TAU,ca=Math.cos(a),sa=Math.sin(a);for(let col=0;col<COLS;col++){const v=col/(form==="Orbit"?COLS:COLS-1),w=v*2-1,i=(row*COLS+col)*3;let x,y,z;
 if(form==="Silk"){const t=a+twist*sa+.22*Math.sin(time*.36),width=w*(.62+.09*Math.cos(3*a+time*.24)),r=1.18+width*Math.cos(t);x=r*ca;y=.25*Math.sin(2*a+time*.21)+width*Math.sin(t);z=r*sa;}
 else if(form==="Orbit"){const b=v*TAU+twist*sa,r=1.08+.36*Math.cos(b);x=r*ca;y=.36*Math.sin(b)+.22*Math.sin(3*a+time*.2);z=r*sa;}
 else if(form==="Knot"){const t=2*a+twist*sa,rr=.93+.34*Math.cos(3*a),width=w*.21;const r=rr+width*Math.cos(t);x=r*Math.cos(2*a);y=.46*Math.sin(3*a)+width*Math.sin(t);z=r*Math.sin(2*a);}
 else {x=(u-.5)*3.65;z=w*1.14;y=.32*Math.sin(x*2.4+z*2+time*.55)+.13*Math.cos(z*4-x+time*.23);const t=twist*x*.35,c=Math.cos(t),s=Math.sin(t),ny=y*c-z*s;z=y*s+z*c;y=ny;}
 out[i]=x;out[i+1]=y;out[i+2]=z;}}
}
