function qMultiply(a,b) {
  const [ax,ay,az,aw]=a, [bx,by,bz,bw]=b;
  return [ax*bw+aw*bx+ay*bz-az*by, ay*bw+aw*by+az*bx-ax*bz, az*bw+aw*bz+ax*by-ay*bx, aw*bw-ax*bx-ay*by-az*bz];
}
function qInverse(q) { return [-q[0],-q[1],-q[2],q[3]]; }
function qNormalize(q) { const n = Math.hypot(...q) || 1; return q.map(v=>v/n); }
function qSlerp(a, b, t) {
  let dot = a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3];
  if (dot < 0) { dot = -dot; b = b.map(v=>-v); }
  if (dot > 0.9995) return qNormalize(a.map((v,i)=>v+(b[i]-v)*t));
  const theta = Math.acos(Math.max(-1, Math.min(1,dot)));
  const sin = Math.sin(theta);
  const w1 = Math.sin((1-t)*theta)/sin;
  const w2 = Math.sin(t*theta)/sin;
  return a.map((v,i)=>v*w1+b[i]*w2);
}
function qFromEuler(x,y,z) {
  // Euler YXZ, as in the established DeviceOrientationControls convention.
  const c1=Math.cos(x/2),c2=Math.cos(y/2),c3=Math.cos(z/2);
  const s1=Math.sin(x/2),s2=Math.sin(y/2),s3=Math.sin(z/2);
  return [s1*c2*c3+c1*s2*s3, c1*s2*c3-s1*c2*s3, c1*c2*s3-s1*s2*c3, c1*c2*c3+s1*s2*s3];
}
function sensorQuaternion(alpha,beta,gamma) {
  const rad=Math.PI/180;
  // 0° is a valid screen angle; do not replace it with legacy window.orientation.
  const screenAngle = Number.isFinite(screen.orientation?.angle) ? screen.orientation.angle : (Number.isFinite(window.orientation) ? window.orientation : 0);
  const q = qFromEuler(beta*rad, alpha*rad, -gamma*rad);
  const fixed = qMultiply(q,[ -Math.SQRT1_2,0,0,Math.SQRT1_2 ]);
  return qNormalize(qMultiply(fixed,[0,0,-Math.sin(screenAngle*rad/2),Math.cos(screenAngle*rad/2)]));
}
// Choose an orientation stream by usable heading, not just its absolute flag.
function headingRoute(router,source,alpha,now) {
  const streams=router.streams||(router.streams=Object.create(null));
  const s=streams[source]||(streams[source]={last:NaN,headingAt:-Infinity,seen:-Infinity,valid:false});
  const valid=Number.isFinite(alpha);
  if(valid && Number.isFinite(s.last)) {
    const difference=Math.abs(((alpha-s.last+540)%360)-180);
    if(difference>=.35 && difference<120) {s.headingAt=now;s.last=alpha;} else if(difference>=120)s.last=alpha;
  }
  if(valid&&!Number.isFinite(s.last))s.last=alpha;
  s.valid=valid;s.seen=now;
  const current=streams[router.active];
  if(!current || now-current.seen>650 || (!current.valid&&valid) ||
     (valid&&now-s.headingAt<220&&now-current.headingAt>400) ||
     (source==='relative'&&router.active==='absolute'&&valid&&now-current.headingAt>900&&now-s.headingAt<650)) router.active=source;
  return router.active===source;
}
function qRotate(q,v) {
  return qMultiply(qMultiply(q,[v[0],v[1],v[2],0]),qInverse(q)).slice(0,3);
}
// Align the initial view's heading to the virtual up axis. Unlike inverse(base)*current,
// world yaw stays horizontal even when the phone was calibrated at a steep pitch.
function leveledDelta(base,current) {
  const f=qRotate(base,[0,0,-1]),r=qRotate(base,[1,0,0]);
  const yaw=Math.hypot(f[0],f[2])>.08?Math.atan2(-f[0],-f[2]):Math.atan2(-r[2],r[0]);
  const h=qFromEuler(0,yaw,0);
  return qNormalize(qMultiply(qMultiply(qMultiply(qInverse(h),current),qInverse(base)),h));
}

// Optional Generic Sensor API: native quaternions, converted from Earth Z-up to renderer Y-up.
function genericOrientation(raw) {
  const angle=Number.isFinite(screen.orientation?.angle)?screen.orientation.angle:(Number.isFinite(window.orientation)?window.orientation:0);
  const rad=angle*Math.PI/180;
  return qNormalize(qMultiply(qMultiply([-Math.SQRT1_2,0,0,Math.SQRT1_2],Array.from(raw)),[0,0,-Math.sin(rad/2),Math.cos(rad/2)]));
}
function genericEvent(raw,source) {
  if(!raw||raw.length!==4||!Array.from(raw).every(Number.isFinite))return null;
  const q=genericOrientation(raw),f=qRotate(q,[0,0,-1]),r=qRotate(q,[1,0,0]);
  const alpha=(Math.atan2(-r[2],r[0])*180/Math.PI+360)%360;
  return {alpha,beta:Math.asin(Math.max(-1,Math.min(1,f[1])))*180/Math.PI,gamma:0,rawQuaternion:q,source};
}
function startQuaternionSensors(callback) {
  const sensors=[];
  for(const [name,source] of [['RelativeOrientationSensor','sensor-relative'],['AbsoluteOrientationSensor','sensor-absolute']]){
    const C=window[name];if(typeof C!=='function')continue;
    try {
      const s=new C({frequency:60,referenceFrame:'device'});
      s.addEventListener('reading',()=>{const event=genericEvent(s.quaternion,source);if(event)callback(event);});
      s.addEventListener('error',()=>{try{s.stop()}catch{}});
      s.start();sensors.push(s);
    } catch {}
  }
  return ()=>{for(const s of sensors)try{s.stop()}catch{}};
}

export {qMultiply,qInverse,qNormalize,qFromEuler,sensorQuaternion,headingRoute,leveledDelta,genericOrientation,startQuaternionSensors};
