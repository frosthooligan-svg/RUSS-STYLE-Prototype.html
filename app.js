/* RUSS STYLE prototype engine: screen images + WebGL page turns (adapted from the white-paper book demo). */
(function(){
'use strict';
const SCREENS = window.RS_SCREENS, ASSETS = window.RS_ASSETS;
const $ = id => document.getElementById(id);
const stage = $('stage'), fit = $('fit'), imgA = $('imgA'), imgB = $('imgB'), canvas = $('gl'), band = $('band'), atmo = $('atmo'), hot = $('hot');
const clamp = (x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth = t=>{t=clamp(t);return t*t*(3-2*t)};
const mix = (a,b,t)=>a+(b-a)*t;
const seg = (t,a,b)=>smooth((t-a)/(b-a));
const params = new URLSearchParams(location.search);
const DEBUG = params.has('debug');
const SLOW = +params.get('slow') || 1;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- flow ---------- */
const PAPER = new Set('j10 j11 j12 j13 j16 j16f j17 j18 j19 j20 j23 j24 j25 j26 j27 m01 m03 m04 m05 m06 m07 m08 p02 p03 p04 p05 p07'.split(' '));
const NO_TOOLBAR = new Set(['j07','j08','m02']);
const BTN=[28,686,334,60], GIGA=[8,650,374,72,'giga'], BOOK=[4,70,88,56,'book'], QR=[298,70,88,56,'camera'], ART=[26,117,338,400], CLOSE=[296,60,86,60];
const F = {
 j01:{hs:[[0,55,390,700,'j02']]},
 j02:{hs:[[28,185,334,172,'j03'],[28,367,334,172,'m01'],[28,550,334,172,'p01']]},
 j03:{hs:[[28,648,334,68,'j17','open']]},
 j05:{hs:[[40,522,150,54,'j06'],[198,522,150,54,'j07']]},
 j06:{hs:[[28,686,250,60,'j05'],[282,686,84,60,'o02'],[...CLOSE,'j02']]},
 j07:{hs:[[40,150,310,430,'j08'],[28,754,170,60,'j09'],[198,754,170,60,'book'],[...CLOSE,'j02']]},
 j08:{hs:[[0,55,390,760,'scan']],auto:[1300,'scan']},
 j09:{hs:[[20,245,350,150,'j20'],[20,400,350,150,'j19'],[...BTN,'j07'],[...CLOSE,'back']]},
 j10:{hs:[[...ART,'j11','fade'],GIGA,BOOK,QR]},
 j11:{hs:[[...ART,'j12','fade'],GIGA,BOOK,QR]},
 j12:{hs:[[...ART,'j13','fade'],GIGA,BOOK,QR]},
 j13:{hs:[[...ART,'j16','flip'],GIGA,BOOK,QR],auto:[1200,'j16','flip']},
 j16:{hs:[[40,560,310,72,'j18','flip'],GIGA,BOOK,QR]},
 j16f:{hs:[[40,560,310,72,'j18','flip'],GIGA,BOOK,QR]},
 j17:{hs:[[...BTN,'camera'],[30,370,330,300,'j19','flip'],[4,70,88,56,'j02'],QR]},
 j18:{hs:[[40,215,104,104,'j16f','flip'],[144,215,104,104,'j23','flip'],[248,215,104,104,'j19','flip'],[40,325,310,330,'j19','flip'],[...BTN,'camera'],[4,70,88,56,'j02'],QR],auto:[1700,'j21','fade'],once:true},
 j19:{hs:[[28,686,112,60,'back'],[146,686,216,60,'camera'],BOOK,QR]},
 j20:{hs:[[4,70,88,56,'back'],GIGA,QR]},
 j21:{hs:[[50,620,290,62,'m01'],[50,686,290,62,'j22','fade']]},
 j22:{hs:[[50,620,290,62,'p01'],[50,686,290,62,'j18','fade']]},
 j23:{hs:[[...BTN,'j24','flip'],BOOK,QR]},
 j24:{hs:[[40,454,310,58,'j25','fade'],[40,518,310,58,'j26','fade'],[40,582,310,58,'j25','fade'],GIGA,BOOK,QR]},
 j25:{hs:[[40,518,310,58,'j26','fade'],GIGA,BOOK,QR]},
 j26:{hs:[GIGA,BOOK,QR],auto:[1100,'j27','flip']},
 j27:{hs:[[40,580,310,64,'j18','flip'],GIGA,BOOK,QR]},
 g01:{hs:[[8,650,374,72,'g02'],[296,120,84,62,'gigaClose']]},
 g02:{hs:[[28,658,290,60,'g04'],[320,658,56,60,'g05'],[38,326,180,56,'g03'],[...CLOSE,'gigaClose']]},
 g03:{hs:[[30,418,350,56,'g04'],[28,658,290,60,'g04'],[320,658,56,60,'g05'],[...CLOSE,'gigaClose']]},
 g04:{hs:[[0,120,390,520,'g03'],[...CLOSE,'gigaClose']],auto:[1900,'g03']},
 g05:{hs:[[80,654,290,62,'g06'],[16,654,62,62,'g03'],[...CLOSE,'gigaClose']]},
 g06:{hs:[[80,654,290,62,'g07'],[16,654,62,62,'g03'],[...CLOSE,'gigaClose']],auto:[2200,'g07']},
 g07:{hs:[[20,590,370,52,'g04'],[80,654,290,62,'g06'],[16,654,62,62,'g03'],[...CLOSE,'gigaClose']]},
 m01:{hs:[[...BTN,'m04','flip'],[39,543,311,80,'m02','fade'],[196,477,100,54,'m03','fade'],[4,70,88,56,'j02'],QR]},
 m02:{hs:[[29,459,332,60,'m01','fade'],[0,527,390,317,'m01','fade']]},
 m03:{hs:[[...BTN,'m04','flip'],[96,477,100,54,'m01','fade'],BOOK,QR]},
 m04:{hs:[[30,225,330,430,'m05','fade'],BOOK,QR]},
 m05:{hs:[[...BTN,'m06','flip'],BOOK,QR]},
 m06:{hs:[[40,134,310,530,'m07','fade'],BOOK,QR]},
 m07:{hs:[[...BTN,'m08','flip'],BOOK,QR]},
 m08:{hs:[[29,686,163,60,'m01','flip'],[196,686,166,60,'m09','fade'],[4,70,88,56,'j02'],QR]},
 m09:{hs:[[334,216,54,54,'m08'],[0,60,390,140,'m08']]},
 p01:{hs:[[29,686,334,60,'p02','open'],[4,58,88,56,'j02']]},
 p02:{hs:[[40,221,310,314,'p04','flip'],[24,686,342,60,'p03','flip'],[4,70,88,56,'p01','fade']]},
 p03:{hs:[[40,233,310,440,'p04','flip'],[24,686,342,60,'p02','flip'],[4,70,88,56,'back'],[290,70,96,56,'p02','flip']]},
 p04:{hs:[GIGA,[4,70,88,56,'back']]},
 p05:{hs:[[40,193,88,60,'p07','flip'],[131,193,219,60,'p06','fade'],[40,574,310,60,'p07','flip'],GIGA,[4,70,88,56,'p03','flip']]},
 p06:{hs:[[296,70,86,62,'back']]},
 p07:{hs:[[24,686,342,60,'j02'],[298,70,88,56,'p02','flip']]},
 o02:{hs:[[0,40,390,720,'back']]}
};
for (const k in F) if (!NO_TOOLBAR.has(k)) F[k].hs.push([20,756,60,60,'back']);

/* ---------- state ---------- */
let cur = null, busy = false, autoTimer = 0;
const hist = [];           // [{id, trans}]
const seen = new Set();
const st = {scans:0, cam:false, gigaIntro:false, gigaFrom:null};
const cache = {};
function load(id){
  if (!cache[id]) cache[id] = new Promise((res,rej)=>{const i=new Image();i.decoding='async';i.onload=()=>res(i);i.onerror=()=>rej(Error('img '+id));i.src=SCREENS[id];});
  return cache[id];
}
function resolve(target){
  switch(target){
    case 'camera': return st.cam ? 'j07' : 'j05';
    case 'book': return seen.has('j18')||seen.has('j16')||seen.has('j27') ? 'j18' : 'j17';
    case 'scan': return (st.scans % 2 === 1) ? 'j10' : 'j23';
    case 'giga': return st.gigaIntro ? 'g02' : 'g01';
    default: return target;
  }
}
function defaultTrans(a,b){ return PAPER.has(a)&&PAPER.has(b) ? 'flip' : 'fade'; }

/* ---------- layout ---------- */
function layout(){
  const vw = innerWidth, vh = innerHeight;
  const desktop = vw >= 600;
  document.documentElement.classList.toggle('desktop', desktop);
  const pad = desktop ? 28 : 0;
  const s = Math.min((vw-pad*2)/390, (vh-pad*2)/844, desktop ? 1.15 : 9);
  fit.style.width = 390*s+'px'; fit.style.height = 844*s+'px';
  stage.style.transform = 'scale('+s+')';
}
addEventListener('resize', layout, {passive:true}); layout();

/* ---------- hotspots ---------- */
function renderHot(){
  hot.textContent = '';
  const f = F[cur]; if (!f) return;
  f.hs.forEach((h,i)=>{
    const b = document.createElement('button');
    b.type='button'; b.className='hs'; b.style.cssText = `left:${h[0]}px;top:${h[1]}px;width:${h[2]}px;height:${h[3]}px;z-index:${100-Math.min(99,Math.round(h[2]*h[3]/3000))}`;
    b.setAttribute('aria-label','Переход '+(i+1));
    b.addEventListener('click', e=>{e.stopPropagation(); act(h[4], h[5]);});
    hot.appendChild(b);
  });
}
stage.addEventListener('click', ()=>{ if (busy || dragMoved) return; hot.classList.remove('hint'); void hot.offsetWidth; hot.classList.add('hint'); });
if (DEBUG) hot.classList.add('debug');

function act(target, trans){
  if (busy) return;
  if (target === 'back') return back();
  if (target === 'gigaClose') { const to = st.gigaFrom || 'j10'; return go(to, 'fade', {replaceGiga:true}); }
  if (target === 'giga') st.gigaFrom = cur;
  if (target === 'scan') st.scans++;
  const to = resolve(target);
  if (to === 'j07') st.cam = true;
  if (to === 'g02' || to === 'g01') st.gigaIntro = true;
  go(to, trans || defaultTrans(cur, to));
}
function back(){
  if (busy || hist.length === 0) return;
  const h = hist.pop();
  go(h.id, h.trans === 'flip' ? 'flipBack' : 'fade', {isBack:true});
}

/* ---------- navigation ---------- */
async function go(to, trans, opt={}){
  if (to === 'j16' && seen.has('j16')) to = 'j16f';
  if (busy || !SCREENS[to] || to === cur) return;
  busy = true; clearTimeout(autoTimer); hot.textContent='';
  if (cur === 'j16') { await endSymbol(); }
  await unmountScroll();
  const from = cur;
  let toImg;
  try { toImg = await load(to); } catch(e){ busy=false; renderHot(); return; }
  if (!opt.isBack && from) {
    if (opt.replaceGiga) { while (hist.length && hist[hist.length-1].id[0]==='g') hist.pop(); if (hist.length && hist[hist.length-1].id===to) hist.pop(); }
    else hist.push({id:from, trans});
  }
  if (reduced && trans !== 'fade') trans = 'fade';
  if ((trans==='flip'||trans==='flipBack'||trans==='open') && !gl.ok) trans = 'fade';
  try {
    if (!from) { imgA.src = toImg.src; }
    else if (trans === 'flip' || trans === 'flipBack') await flip(from, to, trans === 'flipBack');
    else if (trans === 'open') await openBook(from, to);
    else await fade(to);
  } catch(e){ console.warn(e); imgA.src = toImg.src; imgA.style.opacity=1; imgB.style.opacity=0; canvas.style.opacity=0; canvas.style.visibility='hidden'; band.style.opacity=0; atmo.style.opacity=0; }
  cur = to; busy = false;
  try { history.replaceState(null,'','#'+to); } catch(e){}
  renderHot();
  const f = F[to];
  if (f && f.auto && !(f.once && seen.has(to))) autoTimer = setTimeout(()=>act(f.auto[1], f.auto[2]), f.auto[0]);
  seen.add(to);
  if (to === 'j16') playSymbol();
  if (SCROLL[to]) mountScroll(to);
  // warm the next screens
  if (f) [...new Set(f.hs.map(h=>resolve(h[4])).filter(t=>SCREENS[t]))].slice(0,6).forEach(t=>load(t).catch(()=>{}));
}
function tween(ms, fn){
  ms *= SLOW; return new Promise(res=>{ const t0=performance.now(); const step=now=>{ const t=Math.min(1,(now-t0)/ms); fn(t); t<1?requestAnimationFrame(step):res(); }; requestAnimationFrame(step); });
}
async function fade(to){
  const img = await load(to);
  imgB.src = img.src; try{ await imgB.decode(); }catch(e){}
  await tween(260, t=>{ imgB.style.opacity = smooth(t); });
  imgA.src = img.src; try{ await imgA.decode(); }catch(e){}
  imgB.style.opacity = 0;
}

/* ---------- symbol animation (timeline read from Figma, 5.35 s, played once) ---------- */
const fx = $('fx');
const E = { l:t=>t, io:smooth, o:t=>1-Math.pow(1-t,1.8), i:t=>Math.pow(t,1.8), s:()=>0 };
function track(k){ return p=>{ for (let n=k.length-1;n>=0;n--) if (p>=k[n][0]) { const a=k[n], b=k[n+1]; if (!b) return a[1]; const u=(p-a[0])/(b[0]-a[0]); return a[1]+(b[1]-a[1])*E[a[2]||'l'](u); } return k[0][1]; }; }
const SYM = {
  rot: track([[0,0],[.20561,0,'io'],[.22991,.069813,'o'],[.2785,-.349066],[.34393,-.855211,'s'],[.36075,0],[1,0]]),
  sc:  track([[0,.92],[.00748,.92,'o'],[.14953,1],[.20561,1,'io'],[.22991,1.035],[.26168,.9],[.29533,.6],[.3215,.29,'o'],[.34393,.075,'s'],[.36075,.97,'o'],[.61308,1],[1,1]]),
  tx:  track([[0,0],[.20561,0,'io'],[.22991,3,'i'],[.25421,-8],[.28037,-31],[.31028,-82,'o'],[.34393,-146.5,'s'],[.36075,0],[1,0]]),
  ty:  track([[0,0],[.20561,0,'io'],[.22991,8,'i'],[.25421,-22],[.28037,-75],[.31028,-132,'o'],[.34393,-165.5,'s'],[.36075,0],[1,0]]),
  op:  track([[0,0],[.00748,0,'io'],[.14953,1],[.30654,1,'i'],[.34393,0],[.37009,0,'io'],[.61308,1],[1,1]]),
  ny:  track([[0,-58],[.49907,-58,'o'],[.58131,0],[.86542,0,'i'],[.95514,-64],[1,-64]]),
  nop: track([[0,0],[.49907,0,'o'],[.56636,1],[.86542,1,'io'],[.95514,0],[1,0]])
};
let symRun = 0;
function playSymbol(){
  const run = ++symRun;
  fx.innerHTML = '<img class="sym" alt="" draggable="false"><div class="noti"></div>';
  const sym = fx.firstChild, noti = fx.lastChild;
  sym.src = ASSETS.symbol; noti.style.backgroundImage = 'url("'+ASSETS.notif+'")';
  const D = 5350*SLOW, t0 = performance.now();
  const step = now=>{
    if (run !== symRun) return;
    const p = Math.min(1, (now-t0)/D);
    sym.style.opacity = SYM.op(p);
    sym.style.transform = `translate(${SYM.tx(p)}px,${SYM.ty(p)}px) rotate(${SYM.rot(p)}rad) scale(${SYM.sc(p)})`;
    noti.style.opacity = SYM.nop(p); noti.style.transform = `translateY(${SYM.ny(p)}px)`;
    if (p < 1) requestAnimationFrame(step); else endSymbol();
  };
  sym.style.opacity = 0; noti.style.opacity = 0; requestAnimationFrame(step);
}
async function endSymbol(){            // settle on the finished page so page turns start from the right picture
  if (cur !== 'j16') return;
  symRun++;
  const img = await load('j16f');
  imgA.src = img.src; try{ await imgA.decode(); }catch(e){}
  fx.textContent = ''; cur = 'j16f';
  try { history.replaceState(null,'','#j16f'); } catch(e){}
}

/* ---------- scrolling page content ---------- */
const SCROLL = { p04:{x:26,y:70,w:338,h:641,sh:882, hs:[[14,364,153,60,'p05','fade'],[171,364,153,60,'p06','fade']]} };
let scroller = null, dragMoved = false;
function mountScroll(id){
  const c = SCROLL[id], A = ASSETS.scroll[id];
  const box = document.createElement('div'); box.className = 'scroll';
  box.style.cssText = `left:${c.x}px;top:${c.y}px;width:${c.w}px;height:${c.h}px`;
  const strip = document.createElement('div'); strip.className = 'strip'; strip.style.height = c.sh+'px';
  const im = new Image(); im.alt=''; im.draggable=false; im.src = A.strip; strip.appendChild(im);
  c.hs.forEach(h=>{ const b=document.createElement('button'); b.type='button'; b.className='hs'; b.style.cssText=`left:${h[0]}px;top:${h[1]}px;width:${h[2]}px;height:${h[3]}px`;
    b.addEventListener('click', e=>{ e.stopPropagation(); if (!dragMoved) act(h[4],h[5]); }); strip.appendChild(b); });
  box.appendChild(strip);
  const mk = (cls, src)=>{ const d=document.createElement('img'); d.className=cls; d.alt=''; d.draggable=false; d.src=src; return d; };
  const fl = mk('fr l', A.frameL), fr = mk('fr r', A.frameR), bk = mk('pill back', A.back), gg = mk('pill giga', A.giga);
  box.addEventListener('scroll', ()=>{ const o = box.scrollTop > .5 ? 1 : 0; fl.style.opacity = fr.style.opacity = o; }, {passive:true});
  // mouse drag on desktop (touch scrolls natively)
  let down = null;
  box.addEventListener('pointerdown', e=>{ if (e.pointerType==='mouse') { down = {y:e.clientY, s:box.scrollTop}; dragMoved = false; } });
  addEventListener('pointermove', e=>{ if (!down) return; const k = stage.getBoundingClientRect().width/390; const dy = (e.clientY-down.y)/k; if (Math.abs(dy)>4) dragMoved = true; if (dragMoved) box.scrollTop = down.s - dy; });
  addEventListener('pointerup', ()=>{ if (down) { down = null; setTimeout(()=>{ dragMoved=false; }, 0); } });
  fx.textContent = ''; fx.append(box, fl, fr, bk, gg);
  scroller = box; if (DEBUG) fx.classList.add('debug');
}
async function unmountScroll(){
  if (!scroller) return;
  const box = scroller, s0 = box.scrollTop; scroller = null;
  if (s0 > 0) await tween(Math.min(260, 90+s0)/SLOW, t=>{ box.scrollTop = s0*(1-smooth(t)); });
  fx.textContent = '';
}

/* ---------- WebGL book ---------- */
const PW=390, PH=656, PY=55, CY = 422-(PY+PH/2);   // page rect in stage px; world y of its centre
const gl = {ok:false};
function initGL(){
  if (!window.THREE) return;
  try {
    const T = THREE;
    const r = new T.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:'high-performance', premultipliedAlpha:true});
    r.setPixelRatio(Math.min(devicePixelRatio||1, 2)); r.setSize(390,844,false); r.setClearColor(0x000000,0);
    const scene = new T.Scene();
    const D = 1430, fov = T.MathUtils.radToDeg(2*Math.atan(844/(2*D)));
    const cam = new T.PerspectiveCamera(fov, 390/844, 10, 5000); cam.position.set(0,0,D); cam.lookAt(0,0,0);
    Object.assign(gl, {T, r, scene, cam});
    gl.paper = null; gl.blank = new T.DataTexture(new Uint8Array([242,240,236,255]),1,1,T.RGBAFormat); gl.blank.needsUpdate = true;
    gl.growth = absorptionMap();
    gl.root = new T.Group(); scene.add(gl.root);
    gl.backing = sheet(); gl.backing.pivot.position.z = 0; gl.root.add(gl.backing.pivot);
    gl.shadow = softShadow(); gl.root.add(gl.shadow);
    gl.stack = [0,1].map(()=>{const s=sheet(); gl.root.add(s.pivot); return s;});
    gl.leaves = [0,1,2,3].map(()=>{const s=sheet(); gl.root.add(s.pivot); return s;});
    gl.cover = sheet(); gl.root.add(gl.cover.pivot);
    gl.ok = true;
    const p = new Image(); p.onload=()=>{ gl.paper = tex(p); }; p.src = ASSETS.paper;
    hideAll(); r.render(scene, cam);
  } catch(e){ console.warn('WebGL off', e); gl.ok = false; }
}
function tex(source){
  const T = gl.T, t = new T.Texture(source);
  t.needsUpdate = true; t.generateMipmaps = false; t.minFilter = T.LinearFilter; t.magFilter = T.LinearFilter; t.wrapS = t.wrapT = T.ClampToEdgeWrapping;
  return t;
}
// Grayscale "when does this pixel get wet" map: a few pools that spread with a noisy, feathered rim (from the reference demo).
function absorptionMap(){
  const W=256,H=432,c=document.createElement('canvas'); c.width=W; c.height=H;
  const g=c.getContext('2d'), px=g.createImageData(W,H);
  const seeds=[[.48,.38,.015],[.46,.17,.13],[.24,.39,.17],[.75,.40,.21],[.51,.58,.24],[.34,.26,.29],[.67,.58,.34],[.21,.52,.41],[.47,.78,.48],[.28,.87,.52],[.75,.89,.57]];
  const hash=(x,y)=>{let n=((x*374761393+y*668265263)^(x*y*1274126177))|0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const u=x/(W-1),v=y/(H-1); let a=2;
    for(const [sx,sy,d] of seeds) a=Math.min(a,d+Math.hypot((u-sx)*1.05,(v-sy)*1.48)*.82);
    const cloud=(Math.sin(x*.109+y*.047)*Math.cos(y*.091-x*.036))*.043, grain=(hash(x>>2,y>>2)-.5)*.022+(hash(x>>1,y>>1)-.5)*.024+(hash(x,y)-.5)*.012;
    const t=Math.max(.003,Math.min(.983,a+cloud+grain)), i=(y*W+x)*4, b=Math.round(t*255);
    px.data[i]=px.data[i+1]=px.data[i+2]=b; px.data[i+3]=255;
  }
  g.putImageData(px,0,0); return tex(c);
}
function pageTex(img){           // the paper page area of a screen: stage y 55..711
  const c = document.createElement('canvas'); c.width = 780; c.height = 1312;
  const k = img.naturalWidth/390;
  c.getContext('2d').drawImage(img, 0, PY*k, 390*k, PH*k, 0, 0, 780, 1312);
  return tex(c);
}
function cropTex(img, x, y, w, h){
  const c = document.createElement('canvas'); c.width = Math.round(w*2); c.height = Math.round(h*2);
  const k = img.naturalWidth/390;
  c.getContext('2d').drawImage(img, x*k, y*k, w*k, h*k, 0, 0, c.width, c.height);
  return tex(c);
}
const VERT = `varying vec2 vUv; varying float vShade;
void main(){ vUv = uv; float face = abs(normalize(normalMatrix * normal).z);
  vShade = mix(0.80, 1.0, smoothstep(0.12, 0.91, face));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAG = `precision highp float; varying vec2 vUv; varying float vShade;
uniform sampler2D uMap; uniform sampler2D uPaper; uniform sampler2D uBackMap;
uniform float uFade; uniform float uBlank; uniform float uBackIsMap; uniform vec3 uTint;
uniform sampler2D uGrowth; uniform float uReveal;
void main(){
  vec3 paper = texture2D(uPaper, vUv).rgb * uTint;
  vec3 col;
  if (gl_FrontFacing) {
    vec3 art = texture2D(uMap, vUv).rgb;
    float zone = 1.0 - smoothstep(0.105, 0.14, vUv.y);
    vec3 page = mix(art, paper, max(uBlank, uFade * zone));
    float arrival = texture2D(uGrowth, vUv).r;
    float pig = smoothstep(arrival - 0.047, arrival + 0.021, uReveal);
    float wet = smoothstep(arrival - 0.018, arrival, uReveal) * (1.0 - smoothstep(arrival + 0.012, arrival + 0.052, uReveal));
    col = mix(paper, mix(page, vec3(0.33, 0.18, 0.10), 0.12 * wet), pig);
  } else {
    vec2 b = vec2(1.0 - vUv.x, vUv.y);
    col = mix(texture2D(uPaper, b).rgb * uTint, texture2D(uBackMap, b).rgb, uBackIsMap) * 0.97;
  }
  gl_FragColor = vec4(col * vShade, 1.0);
}`;
function sheet(){
  const T = gl.T;
  const geo = new T.PlaneGeometry(1,1,36,54);
  geo.userData.uv = geo.getAttribute('uv').array.slice();
  geo.getAttribute('position').setUsage(T.DynamicDrawUsage);
  const mat = new T.ShaderMaterial({vertexShader:VERT, fragmentShader:FRAG, side:T.DoubleSide,
    uniforms:{uMap:{value:gl.blank}, uPaper:{value:gl.blank}, uBackMap:{value:gl.blank}, uFade:{value:0}, uBlank:{value:0}, uBackIsMap:{value:0}, uTint:{value:new T.Vector3(1,1,1)}, uGrowth:{value:gl.blank}, uReveal:{value:2}}});
  const mesh = new T.Mesh(geo, mat); mesh.frustumCulled = false;
  const pivot = new T.Group(); pivot.add(mesh);
  return {pivot, mesh, u:mat.uniforms};
}
// Rounded, developable sheet hinged on its left edge (from the reference demo).
function shape(mesh, w, h, curl, radius){
  const pos = mesh.geometry.getAttribute('position'), uv = mesh.geometry.userData.uv;
  const bend = clamp(curl,0,1.38), r = Math.min(radius==null?22:radius, w*.08, h*.08), start=.43, span=1-start;
  for (let i=0;i<pos.count;i++){
    const u=uv[i*2], v=uv[i*2+1];
    const ed = Math.min(v,1-v)*h;
    const cut = ed<r ? r-Math.sqrt(Math.max(0,r*r-(r-ed)**2)) : 0;
    const width = w-cut, root = width*start, t = clamp((u-start)/span), arc = width*span;
    const x = u<=start ? width*u : root+(bend<.001 ? arc*t : arc*Math.sin(bend*t)/bend);
    const z = u<=start||bend<.001 ? 0 : arc*(1-Math.cos(bend*t))/bend;
    const warp = Math.sin(Math.PI*v)*Math.sin(Math.PI*t)*bend*.9;
    pos.setXYZ(i, x, (v-.5)*h, z+warp);
  }
  pos.needsUpdate = true; mesh.geometry.computeVertexNormals();
}
function softShadow(){
  const T = gl.T, c = document.createElement('canvas'); c.width=256; c.height=128;
  const g = c.getContext('2d'), rad = g.createRadialGradient(102,64,4,102,64,110);
  rad.addColorStop(0,'rgba(30,28,26,.30)'); rad.addColorStop(.4,'rgba(30,28,26,.14)'); rad.addColorStop(.8,'rgba(30,28,26,.03)'); rad.addColorStop(1,'rgba(30,28,26,0)');
  g.fillStyle = rad; g.fillRect(0,0,256,128);
  const geo = new T.PlaneGeometry(1,1); geo.translate(.5,0,0);
  const m = new T.Mesh(geo, new T.MeshBasicMaterial({map:new T.CanvasTexture(c), transparent:true, opacity:0, depthWrite:false}));
  m.renderOrder = 1; return m;
}
function hideAll(){ [gl.backing, gl.cover, ...gl.leaves, ...gl.stack].forEach(s=>s.pivot.visible=false); gl.shadow.visible=false; }
function setSheet(s, o){
  s.u.uMap.value = o.map || gl.blank; s.u.uPaper.value = gl.paper || gl.blank; s.u.uBackMap.value = o.back || gl.blank;
  s.u.uBackIsMap.value = o.back ? 1 : 0; s.u.uBlank.value = o.blank ? 1 : 0; s.u.uFade.value = o.fade || 0;
  s.u.uTint.value.set(...(ASSETS.tint||[1,1,1]));
  s.u.uGrowth.value = gl.growth || gl.blank; s.u.uReveal.value = o.ink ? 0 : 2;
}
const draw = ()=>gl.r.render(gl.scene, gl.cam);
const nextFrame = ()=>new Promise(r=>requestAnimationFrame(()=>r()));

/* One leaf turns over a fixed left hinge. Forward: the current page lifts off and lands out of view on the left.
   Back: the previous page comes back from the left and settles on top. */
async function flip(from, to, reverse){
  const [fi, ti] = await Promise.all([load(from), load(to)]);
  const fT = pageTex(fi), tT = pageTex(ti);
  const topT = reverse ? tT : fT, underT = reverse ? fT : tT;      // the moving leaf / the page that stays flat
  hideAll(); gl.root.rotation.set(0,0,0);
  const B = gl.backing, L = gl.leaves[0];
  setSheet(B, {map:underT, fade: reverse ? 0 : 1}); setSheet(L, {map:topT, fade: reverse ? 1 : 0});
  B.pivot.visible = L.pivot.visible = gl.shadow.visible = true;
  B.pivot.position.set(-PW/2, CY, 0); B.pivot.rotation.set(0,0,0); shape(B.mesh, PW, PH, 0, 0);
  gl.shadow.position.set(-PW/2, CY, .4); gl.shadow.scale.set(PW, PH, 1);
  L.pivot.position.set(-PW/2, CY, 1.2);
  imgB.src = ti.src; try{ await imgB.decode(); }catch(e){}
  const DUR = 900, END = DUR - 140;
  const frame = p=>{
    const t = p*DUR;
    const q0 = seg(t, 90, 800), q = reverse ? 1-q0 : q0;
    const head = seg(t, 0, 150), tail = seg(t, END, DUR);
    if (reverse) { B.u.uFade.value = head; L.u.uFade.value = 1-tail; }
    else { L.u.uFade.value = head; B.u.uFade.value = 1-tail; }
    L.pivot.rotation.y = -Math.PI*q; L.pivot.rotation.z = Math.sin(Math.PI*q)*.009;
    const env = Math.pow(Math.max(0, Math.sin(Math.PI*Math.pow(q, reverse?1.25:.62))), .78);
    shape(L.mesh, PW, PH, 1.18*env);
    gl.shadow.material.opacity = Math.pow(Math.sin(Math.PI*q),2)*.34;
    band.style.opacity = head*(1-tail);
    imgB.style.opacity = head;
    draw();
  };
  frame(0); canvas.style.visibility = 'visible'; canvas.style.opacity = 1; await nextFrame();
  await tween(DUR, frame);
  imgA.src = ti.src; try{ await imgA.decode(); }catch(e){}
  await nextFrame();
  canvas.style.opacity = 0; canvas.style.visibility = 'hidden'; imgB.style.opacity = 0; band.style.opacity = 0;
  hideAll(); draw(); fT.dispose(); tT.dispose();
}

/* A closed book grows to page size while its cover swings open and a few blank leaves follow. */
const COVERS = { j03:{x:45,y:66,w:297,h:443}, p01:{x:0,y:PY,w:PW,h:PH} };
async function openBook(from, to){
  const [fi, ti] = await Promise.all([load(from), load(to)]);
  const c = COVERS[from] || {x:0,y:PY,w:PW,h:PH};
  const cT = cropTex(fi, c.x, c.y, c.w, c.h);
  const tT = pageTex(ti);
  hideAll();
  const B = gl.backing, C = gl.cover;
  setSheet(B, {map:tT, fade:1, ink:true}); setSheet(C, {map:cT});
  gl.stack.forEach(s=>setSheet(s,{blank:true})); gl.leaves.forEach(s=>setSheet(s,{blank:true}));
  [B, C, ...gl.stack].forEach(s=>s.pivot.visible = true); gl.shadow.visible = true;
  imgB.src = ti.src; try{ await imgB.decode(); }catch(e){}
  atmo.className = 'atmo ' + (from==='p01' ? 'full' : 'page');
  const TOTAL = 2700, full = from === 'p01';
  const frame = p=>{
    const t = p*TOTAL/1000;
    const a = seg(t, .28, 2.05);
    const w = mix(c.w, PW, a), h = mix(c.h, PH, a);
    const cx = mix(c.x + c.w/2, PW/2, a) - 195, cy = mix(422-(c.y+c.h/2), CY, a);
    const left = cx - w/2;
    gl.root.rotation.x = Math.sin(a*Math.PI)*-.05; gl.root.rotation.z = full ? 0 : Math.sin(t*4)*.005*(1-clamp(t/2.2));
    B.pivot.position.set(left, cy, 0); shape(B.mesh, w, h, 0, full?0:22);
    B.u.uFade.value = 1 - seg(t, 2.35, 2.68); B.u.uReveal.value = seg(t, .95, 2.32) * 1.1;
    gl.shadow.position.set(left, cy, .4); gl.shadow.scale.set(w, h, 1);
    let act = 0;
    const oc = seg(t, .12, 1.12);
    C.pivot.visible = t < 2.2;
    C.pivot.position.set(left, cy, 9); C.pivot.rotation.y = -Math.PI*oc;
    shape(C.mesh, w, h, Math.sin(Math.PI*oc)*.17, full?0:22);
    gl.stack.forEach((s,i)=>{ s.pivot.visible = t < .78 + i*.5; s.pivot.position.set(left-.8, cy, 1+i*.8); s.pivot.rotation.y = 0; shape(s.mesh, w, h, .015); });
    gl.leaves.forEach((s,i)=>{
      const b = .74 + i*.27, e = b + .66, q = seg(t, b, e);
      s.pivot.visible = t >= b-.03 && t <= e+.04; if (!s.pivot.visible) return;
      s.pivot.position.set(left, cy, 3.8+i*.12); s.pivot.rotation.y = -Math.PI*q; s.pivot.rotation.z = Math.sin(Math.PI*q)*.008;
      const env = Math.pow(Math.max(0, Math.sin(Math.PI*Math.pow(q,.62))), .78);
      shape(s.mesh, w, h, (1.4-i*.12)*env); act += Math.pow(Math.sin(Math.PI*q),2);
    });
    gl.shadow.material.opacity = clamp(act*.24, 0, .42);
    const veil = seg(t, .06, .36) * (1 - seg(t, 2.3, 2.68));
    atmo.style.opacity = veil;
    imgB.style.opacity = seg(t, 1.9, 2.25);
    draw();
  };
  frame(0); canvas.style.visibility = 'visible'; canvas.style.opacity = 1; await nextFrame();
  await tween(TOTAL, frame);
  imgA.src = ti.src; try{ await imgA.decode(); }catch(e){}
  await nextFrame();
  canvas.style.opacity = 0; canvas.style.visibility = 'hidden'; imgB.style.opacity = 0; atmo.style.opacity = 0;
  hideAll(); gl.root.rotation.set(0,0,0); draw(); cT.dispose(); tT.dispose();
}

/* ---------- boot ---------- */
addEventListener('keydown', e=>{ if (e.key==='ArrowLeft'||e.key==='Backspace') back(); });
initGL();
const start = (location.hash||'').slice(1);
go(SCREENS[start] ? start : 'j01', 'fade').then(()=>{ $('boot').remove(); });
window.RS = {go:(id,t)=>go(id,t||'fade'), act, back, F, state:()=>({cur,busy})};
})();
