/**
 * The accepted HERO-00b cat matte, as a WebGL keyer.
 *
 * This is the shader that passed the HERO-00b gates — Cb/Cr distance keying
 * against the sampled screen colour, a one-texel choke, an eight-direction
 * boundary search out to 16 texels, a smooth inner despill falloff and
 * premultiplied output. Nothing here is retuned: `CAT_MATTE` is the accepted
 * parameter set, and the fragment source is generated from it so the shader
 * text cannot drift away from the numbers that were signed off.
 *
 * Deliberate differences from the spike, none of them visual:
 * - the probe's `uTapMode` / `uErode` / `uUseBg` switches are gone. Production
 *   always runs the accepted mode (distance band, choke on, alpha output), so
 *   there is no runtime knob that could silently weaken the matte.
 * - the reach is baked as a shader constant, which lets the driver unroll the
 *   sixteen-step search instead of reading a uniform on every iteration.
 * - `preserveDrawingBuffer` is off. `snapshot()` reads the buffer inside the
 *   same task as the draw, which is the only moment it is defined.
 */

import { CAT_SOURCE } from "./hero.cat";

/** Accepted matte parameters. `key` is the sampled screen colour from HERO-00b. */
export const CAT_MATTE = {
  key: [26, 202, 39] as const,
  lo: 0.09,
  hi: 0.3,
  despill: 0.5,
  /** One-texel choke, matching the accepted `erode: 1`. */
  choke: 1,
  /** Boundary search reach, in texels. */
  reach: 16,
} as const;

const VERTEX_SHADER = `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  varying vec2 vUv;
  uniform sampler2D uVideo;
  uniform vec2 uTexel;
  uniform vec3 uKeyCbCr;

  const float LO = ${CAT_MATTE.lo.toFixed(4)};
  const float HI = ${CAT_MATTE.hi.toFixed(4)};
  const float DESPILL = ${CAT_MATTE.despill.toFixed(4)};
  const float REACH = ${CAT_MATTE.reach.toFixed(1)};

  vec2 cbcr(vec3 c) {
    return vec2(
      -0.168736 * c.r - 0.331264 * c.g + 0.5 * c.b,
       0.5 * c.r - 0.418688 * c.g - 0.081312 * c.b
    );
  }

  // Alpha comes from chroma distance to the screen colour, not from green
  // dominance: the fur already carries a green cast and dominance would eat it.
  float keyAlpha(vec2 uv) {
    vec3 c = texture2D(uVideo, uv).rgb;
    return smoothstep(LO, HI, length(cbcr(c) - uKeyCbCr.xy));
  }

  // Distance to the nearest transparent texel along eight rays. Cardinal rays
  // alone miss a narrow diagonal wedge at the muzzle corner.
  float boundaryDistance() {
    for (int r = 1; r <= ${String(CAT_MATTE.reach)}; r++) {
      if (float(r) > REACH) break;
      float rr = float(r);
      float m = 1.0;
      m = min(m, keyAlpha(vUv + vec2( uTexel.x, 0.0) * rr));
      m = min(m, keyAlpha(vUv + vec2(-uTexel.x, 0.0) * rr));
      m = min(m, keyAlpha(vUv + vec2(0.0,  uTexel.y) * rr));
      m = min(m, keyAlpha(vUv + vec2(0.0, -uTexel.y) * rr));
      m = min(m, keyAlpha(vUv + vec2( uTexel.x,  uTexel.y) * rr));
      m = min(m, keyAlpha(vUv + vec2( uTexel.x, -uTexel.y) * rr));
      m = min(m, keyAlpha(vUv + vec2(-uTexel.x,  uTexel.y) * rr));
      m = min(m, keyAlpha(vUv + vec2(-uTexel.x, -uTexel.y) * rr));
      if (m < 0.06) return rr;
    }
    return REACH + 1.0;
  }

  void main() {
    vec3 c = texture2D(uVideo, vUv).rgb;
    float a = keyAlpha(vUv);

    // Choke by one texel: 4:2:0 chroma is shared across 2x2 pixels, so the matte
    // edge always carries a chroma smear that would read as a green rim.
    float aL = keyAlpha(vUv - vec2(uTexel.x, 0.0));
    float aR = keyAlpha(vUv + vec2(uTexel.x, 0.0));
    float aU = keyAlpha(vUv + vec2(0.0, uTexel.y));
    float aD = keyAlpha(vUv - vec2(0.0, uTexel.y));
    a = smoothstep(0.0, 0.55, min(min(min(aL, aR), min(aU, aD)), a));

    // Boundary band: full despill at the matte edge, a smooth ramp over the
    // inner 20% of the reach, nothing beyond. The iris sits ~40 texels in, so
    // it never enters the band and its colour is untouched.
    float d = min(boundaryDistance(), REACH);
    float nearEdge = 1.0 - smoothstep(REACH * 0.8, REACH, d);

    float spill = max(0.0, c.g - max(c.r, c.b));
    c.g -= spill * mix(DESPILL, 1.0, nearEdge);

    // Premultiplied output for a canvas composited over the page.
    gl_FragColor = vec4(c * a, a);
  }
`;

function toCbCr(rgb: readonly number[]): [number, number, number] {
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  return [
    -0.168736 * r - 0.331264 * g + 0.5 * b,
    0.5 * r - 0.418688 * g - 0.081312 * b,
    0,
  ];
}

export type CatSnapshot = {
  width: number;
  height: number;
  /** Fraction of the frame that is opaque matte. */
  opaquePct: number;
  /** Pixels on the soft matte edge (0 < a < 1). */
  edgePixels: number;
  /** Edge pixels whose despilled green dominance still exceeds 2/4/6 out of 255. */
  edgeSpillOver002: number;
  edgeSpillOver004: number;
  edgeSpillOver006: number;
  edgeMaxSpill: number;
  /** Worst remaining green dominance anywhere opaque, 0..1. */
  opaqueMaxSpill: number;
  /** Opaque pixels with obvious green left in them — must be 0 outside the iris. */
  opaqueGreenPixels: number;
};

export type CatKeyer = {
  width: number;
  height: number;
  /**
   * Upload and draw the given video frame.
   *
   * Returns `true` only when every command was submitted against a healthy
   * context. It is a submission signal, not proof that the GPU finished or that
   * the pixels are visible: that still has to be confirmed visually. On a lost
   * context, or on a generation that has already been disposed, it returns
   * `false` and paints nothing, so the caller can keep the approved poster.
   */
  draw(video: HTMLVideoElement): boolean;
  snapshot(video: HTMLVideoElement): CatSnapshot | null;
  dispose(): void;
};

/**
 * Build the keyer against a fixed backing-store size. Returns `null` when WebGL
 * or the program cannot be created, which is the only signal the caller needs:
 * keep the approved poster and never show a green frame.
 */
export function createCatKeyer(
  canvas: HTMLCanvasElement,
  width: number = CAT_SOURCE.width,
  height: number = CAT_SOURCE.height
): CatKeyer | null {
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
    }) as WebGLRenderingContext | null;
  } catch {
    gl = null;
  }
  if (!gl) return null;

  const compile = (type: number, source: string) => {
    const shader = gl!.createShader(type);
    if (!shader) throw new Error("shader");
    gl!.shaderSource(shader, source);
    gl!.compileShader(shader);
    if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
      const log = gl!.getShaderInfoLog(shader) || "compile";
      // This shader never reaches the caller, so release it here.
      gl!.deleteShader(shader);
      throw new Error(log);
    }
    return shader;
  };

  let program: WebGLProgram | null = null;
  let vertexShader: WebGLShader | null = null;
  let fragmentShader: WebGLShader | null = null;
  let texture: WebGLTexture | null = null;
  let buffer: WebGLBuffer | null = null;
  try {
    program = gl.createProgram();
    if (!program) throw new Error("program");
    vertexShader = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    gl.attachShader(program, vertexShader);
    fragmentShader = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || "link");
    }
    // The link is complete; the program no longer needs the shader objects.
    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    vertexShader = null;
    fragmentShader = null;
    gl.useProgram(program);

    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    const uVideo = gl.getUniformLocation(program, "uVideo");
    const uTexel = gl.getUniformLocation(program, "uTexel");
    const uKeyCbCr = gl.getUniformLocation(program, "uKeyCbCr");
    gl.uniform1i(uVideo, 0);
    gl.uniform2f(uTexel, 1 / width, 1 / height);
    const key = toCbCr(CAT_MATTE.key);
    gl.uniform3f(uKeyCbCr, key[0], key[1], key[2]);
  } catch {
    if (vertexShader) gl.deleteShader(vertexShader);
    if (fragmentShader) gl.deleteShader(fragmentShader);
    if (program) gl.deleteProgram(program);
    if (texture) gl.deleteTexture(texture);
    if (buffer) gl.deleteBuffer(buffer);
    return null;
  }

  canvas.width = width;
  canvas.height = height;
  gl.viewport(0, 0, width, height);

  const context = gl;
  let disposed = false;

  /**
   * A lost context accepts no commands, and any texImage2D would silently fail
   * — the canvas would then composite as blank. `isContextLost()` is checked
   * before and after submission so a loss that lands mid-draw cannot be
   * reported as a successful frame.
   */
  function draw(video: HTMLVideoElement): boolean {
    if (disposed) return false;
    if (context.isContextLost()) return false;
    context.bindTexture(context.TEXTURE_2D, texture);
    context.texImage2D(context.TEXTURE_2D, 0, context.RGB, context.RGB, context.UNSIGNED_BYTE, video);
    context.clearColor(0, 0, 0, 0);
    context.clear(context.COLOR_BUFFER_BIT);
    context.drawArrays(context.TRIANGLE_STRIP, 0, 4);
    return !context.isContextLost();
  }

  return {
    width,
    height,
    draw,
    snapshot(video) {
      if (disposed) return null;
      // The readback is only defined in the same task as a successful draw. A
      // lost context has nothing to read, so report "no snapshot" rather than
      // returning a black/garbage frame.
      if (!draw(video)) return null;
      const px = new Uint8Array(width * height * 4);
      context.readPixels(0, 0, width, height, context.RGBA, context.UNSIGNED_BYTE, px);

      let opaque = 0;
      let edgePixels = 0;
      let over002 = 0;
      let over004 = 0;
      let over006 = 0;
      let edgeMax = 0;
      let opaqueMax = 0;
      let opaqueGreen = 0;

      for (let i = 0; i < px.length; i += 4) {
        const a = px[i + 3];
        if (a <= 8) continue;
        // Un-premultiply so the spill figure is a property of the colour, not
        // of how transparent the pixel happens to be.
        const r = Math.min(255, (px[i] * 255) / a);
        const g = Math.min(255, (px[i + 1] * 255) / a);
        const b = Math.min(255, (px[i + 2] * 255) / a);
        const spill = Math.max(0, (g - Math.max(r, b)) / 255);
        if (a >= 247) {
          opaque += 1;
          if (spill > opaqueMax) opaqueMax = spill;
          if (spill > 0.08) opaqueGreen += 1;
        } else {
          edgePixels += 1;
          if (spill > edgeMax) edgeMax = spill;
          if (spill > 0.02) over002 += 1;
          if (spill > 0.04) over004 += 1;
          if (spill > 0.06) over006 += 1;
        }
      }

      return {
        width,
        height,
        opaquePct: +((opaque / (width * height)) * 100).toFixed(2),
        edgePixels,
        edgeSpillOver002: over002,
        edgeSpillOver004: over004,
        edgeSpillOver006: over006,
        edgeMaxSpill: +edgeMax.toFixed(4),
        opaqueMaxSpill: +opaqueMax.toFixed(4),
        opaqueGreenPixels: opaqueGreen,
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      context.deleteTexture(texture);
      context.deleteBuffer(buffer);
      context.deleteProgram(program);
      // Deliberately keep the context alive. Next preserves the homepage DOM
      // across client navigation, so this canvas is reused when the visitor
      // returns; forcing a loss here made every return fall back to the poster.
      // The renderer's own resources above are released, so a later setup can
      // build a fresh program on the same healthy context.
    },
  };
}
