// THE COVE — turns the photo (public/images/bucket/cove-*.webp) into a living cinemagraph with one WebGL shader:
//  • lake water: flowing ripples (displacement) + light shimmer, only inside the hand-drawn lake mask
//  • sunbeam: slow "breathing" + dust motes drifting inside the beam
//  • cave walls: the painted caustics wobble gently
//  • lantern: warm flicker   • gold: sharp glints sweeping across coins, chains and gems
//  • slow camera push-in + mouse / tilt parallax (bottom of the picture = closer = moves more)
// Masks are polygons in image space (0..1, y down) — one set per photo (wide 16:9 for laptops, tall 9:16 for phones).
type Pt = [number, number];
type Scene = { src: string; srcSmall?: string; aspect: number; water: Pt[]; beam: Pt[]; gold: Pt[]; walls: Pt[][]; lamp: [number, number, number]; book: { x: number; y: number; w: number; h: number; rot: number } };

export const SCENES: Record<'wide' | 'tall', Scene> = {
  wide: {
    src: '/images/bucket/cove-wide.webp', srcSmall: '/images/bucket/cove-wide-1000.webp', aspect: 1376 / 768,
    water: [[0.27, 0.535], [0.31, 0.49], [0.45, 0.48], [0.62, 0.48], [0.665, 0.52], [0.635, 0.6], [0.6, 0.66], [0.54, 0.7], [0.46, 0.715], [0.425, 0.66], [0.415, 0.6], [0.4, 0.565], [0.31, 0.56]],
    beam: [[0.49, 0.0], [0.575, 0.0], [0.53, 0.3], [0.5, 0.53], [0.3, 0.535], [0.38, 0.3]],
    gold: [[0.61, 0.54], [0.89, 0.53], [0.9, 0.8], [0.84, 0.95], [0.7, 0.93], [0.68, 0.79], [0.52, 0.78], [0.52, 0.72], [0.6, 0.7]],
    walls: [[[0.0, 0.0], [0.33, 0.0], [0.3, 0.52], [0.0, 0.58]], [[0.74, 0.0], [1.0, 0.0], [1.0, 0.5], [0.76, 0.42]]],
    lamp: [0.166, 0.507, 0.06],
    book: { x: 0.5, y: 0.765, w: 0.205, h: 0.2, rot: -6 },
  },
  tall: {
    src: '/images/bucket/cove-tall.webp', aspect: 768 / 1376,
    water: [[0.06, 0.53], [0.3, 0.5], [0.7, 0.49], [0.97, 0.505], [0.97, 0.545], [0.69, 0.56], [0.66, 0.635], [0.6, 0.69], [0.5, 0.715], [0.42, 0.7], [0.45, 0.62], [0.46, 0.565], [0.22, 0.555], [0.05, 0.585]],
    beam: [[0.52, 0.2], [0.6, 0.205], [0.55, 0.35], [0.5, 0.52], [0.16, 0.52], [0.36, 0.33]],
    gold: [[0.47, 0.66], [0.68, 0.6], [1.0, 0.6], [1.0, 0.96], [0.86, 0.96], [0.8, 0.8], [0.5, 0.79]],
    walls: [[[0.0, 0.03], [0.27, 0.03], [0.22, 0.55], [0.0, 0.6]], [[0.74, 0.08], [1.0, 0.05], [1.0, 0.5], [0.8, 0.46]]],
    lamp: [0.117, 0.567, 0.07],
    book: { x: 0.445, y: 0.775, w: 0.42, h: 0.165, rot: -4 },
  },
};

const VS = `attribute vec2 p; varying vec2 v; void main(){ v = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }`;
const FS = `precision highp float;
varying vec2 v;
uniform sampler2D uImg, uMask;
uniform float uT, uZoom, uIA;
uniform vec4 uCover;   // scale.xy, offset.xy  (screen uv -> image uv)
uniform vec2 uMouse;
uniform vec3 uLamp;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++) { s += a * noise(p); p *= 2.03; a *= .5; } return s; }
float luma(vec3 c){ return dot(c, vec3(.299, .587, .114)); }
void main(){
  vec2 base = (v - .5) * uCover.xy + .5 + uCover.zw;
  float depth = smoothstep(.3, 1., base.y);
  vec2 uv = (base - .5) / uZoom + .5 + uMouse * (.004 + .012 * depth);
  vec4 m = texture2D(uMask, uv);
  float t = uT;
  // water: two drifting noise fields -> horizontal-ish ripples
  vec2 wp = uv * vec2(9., 46.);
  vec2 w = vec2(fbm(wp + vec2(t * .18, t * .05)) - .5, fbm(wp * 1.3 - vec2(t * .12, -t * .09)) - .5);
  // walls: slow caustic wobble
  vec2 cw = vec2(fbm(uv * 14. + t * .07) - .5, fbm(uv * 14. - t * .05 + 3.) - .5);
  vec2 d = w * vec2(.0045, .0065) * m.r + cw * .0026 * m.a;
  vec3 col = texture2D(uImg, clamp(uv + d, .001, .999)).rgb;
  // water glints
  float sh = fbm(uv * vec2(24., 90.) + vec2(t * .25, t * .04));
  col += m.r * pow(max(0., sh - .52) * 2.2, 3.) * (.35 + luma(col)) * vec3(.85, 1., .95) * .9;
  // sunbeam breathing + dust motes
  float breathe = .5 + .5 * sin(t * .32) * .8 + .2 * sin(t * .11);
  col += m.g * (.025 + .05 * breathe) * vec3(1., .88, .66);
  vec2 g = uv * vec2(150. * uIA, 150.) + vec2(sin(t * .13) * 3., -t * 1.6);
  vec2 id = floor(g), f = fract(g) - .5;
  float h = hash(id);
  vec2 o = (vec2(hash(id + 1.7), hash(id + 3.1)) - .5) * .7;
  float mote = step(.982, h) * smoothstep(.11, 0., length(f - o)) * (.45 + .55 * sin(t * 1.7 + h * 50.));
  col += m.g * mote * vec3(1., .93, .8) * .9;
  // lantern flicker
  float fl = .75 + .14 * sin(t * 9.3) + .08 * sin(t * 23.7 + 1.3) + .1 * (noise(vec2(t * 6., 0.)) - .5);
  float ld = length((uv - uLamp.xy) * vec2(uIA, 1.));
  col += vec3(1., .62, .26) * smoothstep(uLamp.z, 0., ld) * fl * .22;
  col *= 1. + smoothstep(uLamp.z * 3., 0., ld) * (fl - .75) * .35;
  // gold: sweeping specular glints on the brightest metal
  float L = luma(col);
  float band = pow(max(0., sin((uv.x * 1.1 + uv.y * .8) * 34. - t * 1.1)), 30.);
  float spark = step(.996, hash(floor(uv * vec2(400. * uIA, 400.)) + floor(t * 2.)));
  col += m.b * pow(L, 5.) * (band * 1.4 + spark * 2.2) * vec3(1., .93, .75);
  // soft vignette
  col *= mix(1., .72, smoothstep(.45, .95, length((v - .5) * vec2(1.1, 1.))));
  gl_FragColor = vec4(col, 1.);
}`;

export function createCove(canvas: HTMLCanvasElement, opts: { onLayout?: (s: Scene, map: (x: number, y: number) => [number, number]) => void }) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
  let scene: Scene = SCENES.wide, kind: 'wide' | 'tall' = 'wide';
  let img: HTMLImageElement | null = null, texImg: WebGLTexture | null = null, texMask: WebGLTexture | null = null;
  let running = false, start = performance.now(), mouse = [0, 0], target = [0, 0];
  const W = () => canvas.clientWidth, H = () => canvas.clientHeight;

  // cover mapping (object-fit: cover) shared by the shader and the HTML hotspot
  function cover() {
    const sa = W() / Math.max(1, H()), ia = scene.aspect;
    return sa > ia ? { sx: 1, sy: ia / sa } : { sx: sa / ia, sy: 1 };
  }
  function toScreen(x: number, y: number): [number, number] { const c = cover(); return [((x - 0.5) / c.sx + 0.5) * W(), ((y - 0.5) / c.sy + 0.5) * H()]; }

  if (!gl) return null;
  const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader'); return s; };
  const prog = gl.createProgram()!;
  try { gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); } catch { return null; }
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n: string) => gl.getUniformLocation(prog, n);
  const u = { img: U('uImg'), mask: U('uMask'), t: U('uT'), zoom: U('uZoom'), ia: U('uIA'), cover: U('uCover'), mouse: U('uMouse'), lamp: U('uLamp') };
  gl.uniform1i(u.img, 0); gl.uniform1i(u.mask, 1);

  function tex(unit: number, source: TexImageSource) {
    const t = gl!.createTexture(); gl!.activeTexture(gl!.TEXTURE0 + unit); gl!.bindTexture(gl!.TEXTURE_2D, t);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE); gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR); gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, source);
    return t;
  }
  // masks: R water, G beam, B gold, A walls — drawn as feathered polygons
  function maskImage(s: Scene) {
    const N = 512, out = new Uint8ClampedArray(N * N * 4);
    const layer = (polys: Pt[][], blur: number) => {
      const c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d')!;
      x.filter = `blur(${blur}px)`; x.fillStyle = '#fff';
      for (const poly of polys) { x.beginPath(); poly.forEach(([px, py], i) => (i ? x.lineTo(px * N, py * N) : x.moveTo(px * N, py * N))); x.closePath(); x.fill(); }
      return x.getImageData(0, 0, N, N).data;
    };
    const ch = [layer([s.water], 10), layer([s.beam], 26), layer([s.gold], 8), layer(s.walls, 30)];
    for (let i = 0; i < N * N; i++) for (let k = 0; k < 4; k++) out[i * 4 + k] = ch[k][i * 4];
    return new ImageData(out, N, N);
  }

  function choose() {
    const next: 'wide' | 'tall' = W() / Math.max(1, H()) < 1 ? 'tall' : 'wide';
    if (next === kind && img) return;
    kind = next; scene = SCENES[kind];
    const im = new Image(); im.decoding = 'async';
    im.src = kind === 'wide' && W() * Math.min(2, devicePixelRatio || 1) < 1100 && scene.srcSmall ? scene.srcSmall : scene.src;
    im.onload = () => {
      img = im; texImg = tex(0, im); texMask = tex(1, maskImage(scene));
      gl!.activeTexture(gl!.TEXTURE0); gl!.bindTexture(gl!.TEXTURE_2D, texImg);
      gl!.activeTexture(gl!.TEXTURE1); gl!.bindTexture(gl!.TEXTURE_2D, texMask);
      canvas.classList.add('ready'); layout(); draw(performance.now());
    };
  }
  function layout() {
    const d = Math.min(1.5, devicePixelRatio || 1);
    canvas.width = Math.round(W() * d); canvas.height = Math.round(H() * d);
    gl!.viewport(0, 0, canvas.width, canvas.height);
    opts.onLayout?.(scene, toScreen);
  }
  function draw(now: number) {
    if (!img) return;
    const t = (now - start) / 1000, c = cover();
    mouse[0] += (target[0] - mouse[0]) * 0.05; mouse[1] += (target[1] - mouse[1]) * 0.05;
    gl!.uniform1f(u.t, t);
    gl!.uniform1f(u.zoom, 1 + Math.min(1, t / 20) * 0.015);
    gl!.uniform1f(u.ia, scene.aspect);
    gl!.uniform4f(u.cover, c.sx, c.sy, 0, 0);
    gl!.uniform2f(u.mouse, mouse[0], mouse[1]);
    gl!.uniform3f(u.lamp, ...scene.lamp);
    gl!.drawArrays(gl!.TRIANGLES, 0, 6);
  }
  const loop = (now: number) => { if (!running) return; draw(now); requestAnimationFrame(loop); };

  choose();
  addEventListener('resize', () => { choose(); if (img) { layout(); draw(performance.now()); } });
  return {
    run(on: boolean) { if (on === running) return; running = on; if (on) requestAnimationFrame(loop); else draw(performance.now()); },
    point(x: number, y: number) { target = [x, y]; },
    toScreen, get scene() { return scene; },
  };
}
