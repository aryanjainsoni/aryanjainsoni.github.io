// THE COVE — turns the photo (public/images/bucket/cove-*.webp) into a living cinemagraph with one WebGL shader.
//  water: flowing ripples + travelling reflections + a lapping line at the shore · boat: gentle rocking
//  sunbeam: visible breathing, drifting light streaks, dust motes, a flare at the crack · walls: rippling caustics
//  lantern: real flame flicker that lights the sand · gold: travelling specular glints
//  unlock: light bloom from the book + cross-fade (book area only) to the "book open & glowing" photo + rising dust
// Masks are polygons in image space (0..1, y down), one set per photo (wide 16:9 laptop, tall 9:16 phone).
type Pt = [number, number];
type Rect = { x: number; y: number; w: number; h: number; rot: number };
type Scene = {
  src: string; srcSmall?: string; open: string; openSmall?: string; aspect: number;
  water: Pt[]; beam: Pt[]; gold: Pt[]; walls: Pt[][]; boat: Pt[]; shore: Pt[]; bookArea: Pt[];
  lamp: [number, number, number]; flare: [number, number]; boatPivot: [number, number]; bookGlow: [number, number];
  book: Rect; bookOpen: Rect;
};

export const SCENES: Record<'wide' | 'tall', Scene> = {
  wide: {
    src: '/images/bucket/cove-wide.webp', srcSmall: '/images/bucket/cove-wide-1000.webp',
    open: '/images/bucket/cove-wide-open.webp', openSmall: '/images/bucket/cove-wide-open-1000.webp', aspect: 1376 / 768,
    water: [[0.27, 0.535], [0.31, 0.49], [0.45, 0.48], [0.62, 0.48], [0.665, 0.52], [0.635, 0.6], [0.6, 0.66], [0.54, 0.7], [0.46, 0.715], [0.425, 0.66], [0.415, 0.6], [0.4, 0.565], [0.31, 0.56]],
    beam: [[0.49, 0.0], [0.575, 0.0], [0.53, 0.3], [0.5, 0.53], [0.3, 0.535], [0.38, 0.3]],
    gold: [[0.61, 0.54], [0.89, 0.53], [0.9, 0.8], [0.84, 0.95], [0.7, 0.93], [0.68, 0.79], [0.6, 0.72]],
    walls: [[[0.0, 0.0], [0.33, 0.0], [0.3, 0.52], [0.0, 0.58]], [[0.74, 0.0], [1.0, 0.0], [1.0, 0.5], [0.76, 0.42]]],
    boat: [[0.11, 0.575], [0.425, 0.55], [0.425, 0.6], [0.36, 0.69], [0.2, 0.745], [0.12, 0.7]],
    shore: [[0.36, 0.72], [0.44, 0.735], [0.52, 0.708], [0.59, 0.665], [0.63, 0.61], [0.66, 0.535]],
    bookArea: [[0.42, 0.69], [0.73, 0.68], [0.74, 0.98], [0.41, 0.98]],
    lamp: [0.166, 0.507, 0.07], flare: [0.555, 0.03], boatPivot: [0.27, 0.66], bookGlow: [0.57, 0.8],
    book: { x: 0.5, y: 0.765, w: 0.205, h: 0.2, rot: -6 },
    bookOpen: { x: 0.43, y: 0.71, w: 0.275, h: 0.24, rot: -4 },
  },
  tall: {
    src: '/images/bucket/cove-tall.webp', open: '/images/bucket/cove-tall-open.webp', aspect: 768 / 1376,
    water: [[0.06, 0.53], [0.3, 0.5], [0.7, 0.49], [0.97, 0.505], [0.97, 0.545], [0.69, 0.56], [0.66, 0.635], [0.6, 0.69], [0.5, 0.715], [0.42, 0.7], [0.45, 0.62], [0.46, 0.565], [0.22, 0.555], [0.05, 0.585]],
    beam: [[0.52, 0.2], [0.6, 0.205], [0.55, 0.35], [0.5, 0.52], [0.16, 0.52], [0.36, 0.33]],
    gold: [[0.47, 0.66], [0.68, 0.6], [1.0, 0.6], [1.0, 0.96], [0.86, 0.96], [0.8, 0.8], [0.62, 0.72]],
    walls: [[[0.0, 0.03], [0.27, 0.03], [0.22, 0.55], [0.0, 0.6]], [[0.74, 0.08], [1.0, 0.05], [1.0, 0.5], [0.8, 0.46]]],
    boat: [[0.02, 0.585], [0.47, 0.545], [0.45, 0.61], [0.3, 0.665], [0.08, 0.7], [0.02, 0.66]],
    shore: [[0.4, 0.705], [0.5, 0.72], [0.6, 0.692], [0.66, 0.64], [0.69, 0.565]],
    bookArea: [[0.3, 0.68], [0.9, 0.69], [0.9, 0.96], [0.3, 0.96]],
    lamp: [0.117, 0.567, 0.08], flare: [0.565, 0.215], boatPivot: [0.24, 0.63], bookGlow: [0.58, 0.8],
    book: { x: 0.445, y: 0.775, w: 0.42, h: 0.165, rot: -4 },
    bookOpen: { x: 0.32, y: 0.7, w: 0.54, h: 0.24, rot: -3 },
  },
};

const VS = `attribute vec2 p; varying vec2 v; void main(){ v = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }`;
const FS = `precision highp float;
varying vec2 v;
uniform sampler2D uImg, uOpen, uMask, uMask2;
uniform float uT, uZoom, uIA, uFx, uReveal, uBloom;
uniform vec2 uCover, uMouse, uFlare, uPivot, uGlow;
uniform vec3 uLamp;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++) { s += a * noise(p); p *= 2.03; a *= .5; } return s; }
float luma(vec3 c){ return dot(c, vec3(.299, .587, .114)); }
vec2 asp(vec2 d){ return d * vec2(uIA, 1.); }
void main(){
  vec2 base = (v - .5) * uCover + .5;
  float depth = smoothstep(.3, 1., base.y);
  vec2 uv = (base - .5) / uZoom + .5 + uMouse * (.004 + .014 * depth) * uFx;
  vec4 m = texture2D(uMask, uv);    // r water, g beam, b gold, a walls
  vec4 n = texture2D(uMask2, uv);   // r book area, g boat, b shore line
  float t = uT, fx = uFx;

  // ---- boat: rock around its keel (rotate the sampled region a little) ----
  float ang = (sin(t * .9) * .012 + sin(t * .37) * .006) * n.g * fx;
  vec2 q = asp(uv - uPivot); q = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * q;
  vec2 suv = mix(uv, uPivot + q / vec2(uIA, 1.) + vec2(0., sin(t * .9 + 1.2) * .0022 * n.g * fx), n.g);

  // ---- water: flowing ripples (long horizontal waves drifting toward the shore) ----
  vec2 wp = uv * vec2(7., 38.);
  float w1 = fbm(wp + vec2(t * .35, t * .12));
  float w2 = fbm(wp * 1.7 - vec2(t * .22, -t * .2) + 4.);
  vec2 wd = vec2(w1 - .5, (w2 - .5) * 1.4) * vec2(.012, .016) * m.r;
  // ---- walls: caustics wobble like light thrown up from moving water ----
  vec2 cw = vec2(fbm(uv * 11. + vec2(t * .25, -t * .2)) - .5, fbm(uv * 11. - vec2(t * .18, t * .23) + 3.) - .5);
  vec2 d = (wd + cw * .009 * m.a) * fx;
  vec2 suv2 = clamp(suv + d, .001, .999);
  vec3 col = texture2D(uImg, suv2).rgb;
  // unlock: cross-fade the book area to the open, glowing photo
  float rv = uReveal * n.r;
  if (rv > .001) col = mix(col, texture2D(uOpen, suv2).rgb, smoothstep(0., 1., rv));
  float L0 = luma(col);

  // water: travelling reflections (stretched streaks catching the light)
  float streak = fbm(uv * vec2(5., 80.) + vec2(t * .6, t * .05));
  col += m.r * fx * pow(max(0., streak - .5) * 2.4, 2.6) * (.45 + L0) * vec3(.82, 1., .94) * .95;
  // shore: soft lapping line that comes and goes
  float lap = .5 + .5 * sin(uv.x * 46. - t * 1.6 + fbm(uv * 9. + t * .2) * 5.);
  col += n.b * fx * lap * lap * .16 * vec3(.9, 1., .96);
  // walls: caustic brightness ripple on the bright golden veins
  col += m.a * fx * max(0., fbm(uv * vec2(16., 16.) + vec2(t * .45, -t * .3)) - .42) * 2.2 * pow(L0, 1.6) * vec3(1., .92, .7);

  // ---- sunbeam: breathing, drifting streaks, dust, flare ----
  float breathe = .55 + .45 * sin(t * .55) * (.7 + .3 * sin(t * .21));
  float rays = noise(vec2((uv.x * uIA + uv.y * .55) * 26., t * .35)) * noise(vec2((uv.x * uIA + uv.y * .55) * 9. + 2., t * .2));
  col += m.g * fx * (.05 + .19 * breathe + rays * .34) * vec3(1., .86, .62);
  for (int k = 0; k < 2; k++) {
    float fk = float(k);
    vec2 g = uv * vec2((90. + fk * 70.) * uIA, 90. + fk * 70.) + vec2(sin(t * .17 + fk) * 2.5, -t * (1.1 + fk * .7));
    vec2 id = floor(g), f = fract(g) - .5;
    float h = hash(id + fk * 17.);
    vec2 o = (vec2(hash(id + 1.7), hash(id + 3.1)) - .5) * .7;
    float mote = step(.965, h) * smoothstep(.16 - fk * .05, 0., length(f - o)) * (.4 + .6 * sin(t * 1.9 + h * 60.));
    col += m.g * fx * mote * vec3(1., .94, .8) * (1.1 - fk * .4);
  }
  float fd = length(asp(uv - uFlare));
  col += fx * vec3(1., .9, .7) * smoothstep(.16, 0., fd) * (.18 + .12 * breathe);

  // ---- lantern: flame flicker lighting the boat and the sand ----
  float fl = .72 + .16 * sin(t * 11.3) + .09 * sin(t * 27.1 + 1.3) + .2 * (noise(vec2(t * 7., 0.)) - .5);
  float ld = length(asp(uv - uLamp.xy));
  vec3 flame = mix(vec3(1., .55, .2), vec3(1., .78, .42), fl - .5);
  col += fx * flame * smoothstep(uLamp.z, 0., ld) * fl * .32;
  col *= 1. + fx * smoothstep(uLamp.z * 3.5, 0., ld) * (fl - .72) * .7;

  // ---- gold: travelling specular glints ----
  float L = luma(col);
  float band = pow(max(0., sin((uv.x * uIA * .9 + uv.y * .8) * 30. - t * 1.4)), 24.);
  float spark = step(.992, hash(floor(uv * vec2(380. * uIA, 380.)) + floor(t * 3.)));
  col += m.b * fx * pow(L, 4.) * (band * 3.4 + spark * 3.4) * vec3(1., .93, .75);

  // ---- unlock bloom + rising golden dust from the pages ----
  float bd = length(asp(uv - uGlow));
  col += vec3(1., .82, .5) * smoothstep(.32, 0., bd) * uBloom * .55;
  vec2 gd = uv * vec2(120. * uIA, 120.) + vec2(sin(t * .6) * 1.5, t * 2.2);
  vec2 gid = floor(gd), gf = fract(gd) - .5;
  float gh = hash(gid + 9.);
  float gold = step(.955, gh) * smoothstep(.15, 0., length(gf)) * (.5 + .5 * sin(t * 3. + gh * 40.));
  col += n.r * uReveal * smoothstep(.0, .25, uGlow.y - uv.y + .12) * gold * vec3(1., .86, .45) * 1.2;

  col *= mix(1., .74, smoothstep(.45, .95, length((v - .5) * vec2(1.1, 1.))));
  gl_FragColor = vec4(col, 1.);
}`;

export type Cove = ReturnType<typeof createCove>;
export function createCove(canvas: HTMLCanvasElement, opts: { onLayout?: (s: Scene, map: (x: number, y: number) => [number, number]) => void }) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) return null;
  let scene: Scene = SCENES.wide, kind: 'wide' | 'tall' | '' = '';
  let ready = false, running = false, start = performance.now(), mouse = [0, 0], target = [0, 0], fx = 1;
  let reveal = 0, revealTo = 0, bloom = 0, revealStart = 0;
  const W = () => canvas.clientWidth, H = () => canvas.clientHeight;
  function cover() { const sa = W() / Math.max(1, H()), ia = scene.aspect; return sa > ia ? { sx: 1, sy: ia / sa } : { sx: sa / ia, sy: 1 }; }
  function toScreen(x: number, y: number): [number, number] { const c = cover(); return [((x - 0.5) / c.sx + 0.5) * W(), ((y - 0.5) / c.sy + 0.5) * H()]; }

  const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader'); return s; };
  const prog = gl.createProgram()!;
  try { gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); } catch (e) { console.warn('cove shader', e); return null; }
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n: string) => gl.getUniformLocation(prog, n);
  ['uImg', 'uOpen', 'uMask', 'uMask2'].forEach((n, i) => gl.uniform1i(U(n), i));
  const u = { t: U('uT'), zoom: U('uZoom'), ia: U('uIA'), fx: U('uFx'), reveal: U('uReveal'), bloom: U('uBloom'), cover: U('uCover'), mouse: U('uMouse'), flare: U('uFlare'), pivot: U('uPivot'), glow: U('uGlow'), lamp: U('uLamp') };

  function tex(unit: number, source: TexImageSource) {
    gl!.activeTexture(gl!.TEXTURE0 + unit); const t = gl!.createTexture(); gl!.bindTexture(gl!.TEXTURE_2D, t);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE); gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR); gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, source);
  }
  function masks(s: Scene) {
    const N = 512;
    const layer = (draw: (x: CanvasRenderingContext2D) => void, blur: number) => {
      const c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d')!;
      x.filter = `blur(${blur}px)`; x.fillStyle = '#fff'; x.strokeStyle = '#fff'; draw(x); return x.getImageData(0, 0, N, N).data;
    };
    const poly = (polys: Pt[][]) => (x: CanvasRenderingContext2D) => { for (const p of polys) { x.beginPath(); p.forEach(([a, b], i) => (i ? x.lineTo(a * N, b * N) : x.moveTo(a * N, b * N))); x.closePath(); x.fill(); } };
    const line = (p: Pt[], w: number) => (x: CanvasRenderingContext2D) => { x.lineWidth = w; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); p.forEach(([a, b], i) => (i ? x.lineTo(a * N, b * N) : x.moveTo(a * N, b * N))); x.stroke(); };
    const pack = (ch: Uint8ClampedArray[]) => { const out = new Uint8ClampedArray(N * N * 4); for (let i = 0; i < N * N; i++) for (let k = 0; k < 4; k++) out[i * 4 + k] = ch[k] ? ch[k][i * 4 + 3] : 0; return new ImageData(out, N, N); };
    return [
      pack([layer(poly([s.water]), 10), layer(poly([s.beam]), 26), layer(poly([s.gold]), 8), layer(poly(s.walls), 30)]),
      pack([layer(poly([s.bookArea]), 18), layer(poly([s.boat]), 7), layer(line(s.shore, 9), 6)]),
    ];
  }
  const load = (src: string) => new Promise<HTMLImageElement>((res, rej) => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = rej; im.src = src; });

  async function choose() {
    const next: 'wide' | 'tall' = W() / Math.max(1, H()) < 1 ? 'tall' : 'wide';
    if (next === kind) return;
    kind = next; scene = SCENES[kind]; ready = false;
    const small = W() * Math.min(2, devicePixelRatio || 1) < 1100;
    const [a, b] = await Promise.all([load(small && scene.srcSmall ? scene.srcSmall : scene.src), load(small && scene.openSmall ? scene.openSmall : scene.open)]);
    const [m1, m2] = masks(scene);
    tex(0, a); tex(1, b); tex(2, m1); tex(3, m2);
    ready = true; canvas.classList.add('ready'); layout(); draw(performance.now());
  }
  function layout() {
    const d = Math.min(1.5, devicePixelRatio || 1);
    canvas.width = Math.round(W() * d); canvas.height = Math.round(H() * d);
    gl!.viewport(0, 0, canvas.width, canvas.height);
    opts.onLayout?.(scene, toScreen);
  }
  function draw(now: number) {
    if (!ready) return;
    const t = (now - start) / 1000, c = cover();
    mouse[0] += (target[0] - mouse[0]) * 0.05; mouse[1] += (target[1] - mouse[1]) * 0.05;
    // unlock reveal: ~1.8 s cross-fade, bloom peaks early then settles to a soft glow
    if (revealStart) {
      const k = Math.min(1, (now - revealStart) / 1800);
      reveal = revealTo ? k : Math.max(0, 1 - k * 2);
      bloom = revealTo ? Math.sin(Math.min(1, k * 1.4) * Math.PI) * 1.2 + k * 0.25 : 0;
      if (k >= 1) revealStart = 0;
    }
    gl!.uniform1f(u.t, t); gl!.uniform1f(u.zoom, 1 + Math.min(1, t / 20) * 0.015); gl!.uniform1f(u.ia, scene.aspect);
    gl!.uniform1f(u.fx, fx); gl!.uniform1f(u.reveal, reveal); gl!.uniform1f(u.bloom, bloom);
    gl!.uniform2f(u.cover, c.sx, c.sy); gl!.uniform2f(u.mouse, mouse[0], mouse[1]);
    gl!.uniform2f(u.flare, ...scene.flare); gl!.uniform2f(u.pivot, ...scene.boatPivot); gl!.uniform2f(u.glow, ...scene.bookGlow);
    gl!.uniform3f(u.lamp, ...scene.lamp);
    gl!.drawArrays(gl!.TRIANGLES, 0, 6);
  }
  const loop = (now: number) => { if (!running && !revealStart) return; draw(now); requestAnimationFrame(loop); };

  choose();
  addEventListener('resize', () => { choose(); if (ready) { layout(); draw(performance.now()); } });
  return {
    run(on: boolean) { const was = running; running = on; if (on && !was) requestAnimationFrame(loop); else if (!on) draw(performance.now()); },
    point(x: number, y: number) { target = [x, y]; },
    setOpen(open: boolean, instant = false) {
      revealTo = open ? 1 : 0;
      if (instant) { reveal = revealTo; bloom = open ? 0.25 : 0; revealStart = 0; draw(performance.now()); return; }
      const idle = !running && !revealStart; revealStart = performance.now(); if (idle) requestAnimationFrame(loop);
    },
    toggleFx() { fx = fx ? 0 : 1; draw(performance.now()); return !!fx; },
    toScreen, get scene() { return scene; },
  };
}
