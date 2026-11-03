import { Mesh, Program, Renderer, Triangle } from 'ogl'
import { useEffect, useRef } from 'react'

type GalaxyMode = 'home' | 'project' | 'technologies' | 'contact' | 'quiet'

interface GalaxyProps {
  mode: GalaxyMode
  compact: boolean
  reducedMotion: boolean
}

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
`

// Adapted from React Bits Galaxy. The shader is intentionally desaturated and
// runs independently from the semantic constellation.
const fragmentShader = `
precision highp float;
uniform float uTime;
uniform vec3 uResolution;
uniform float uDensity;
uniform float uGlow;
uniform float uTwinkle;
uniform float uRotationSpeed;
uniform float uStarSpeed;
varying vec2 vUv;

#define LAYERS 4.0
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float tri(float x) { return abs(fract(x) * 2.0 - 1.0); }

float star(vec2 uv, float flare) {
  float d = max(length(uv), 0.002);
  float m = (0.024 * uGlow) / d;
  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1050.0));
  m += rays * flare * uGlow * 0.42;
  uv *= MAT45;
  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1050.0));
  m += rays * flare * uGlow * 0.12;
  return m * smoothstep(0.72, 0.08, d);
}

vec3 starLayer(vec2 uv) {
  vec3 col = vec3(0.0);
  vec2 gv = fract(uv) - 0.5;
  vec2 id = floor(uv);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 cell = id + offset;
      float seed = hash21(cell);
      float size = fract(seed * 345.32);
      vec2 drift = vec2(
        tri(seed * 34.0 + uTime * 0.009),
        tri(seed * 38.0 + uTime * 0.006)
      ) - 0.5;
      float flare = smoothstep(0.94, 1.0, size);
      float luminance = star(gv - offset - drift * 0.12, flare);
      float pulse = 1.0 + (tri(uTime * 0.12 + seed * 8.0) - 0.5) * uTwinkle;
      vec3 cool = mix(vec3(0.62, 0.59, 0.70), vec3(0.78, 0.68, 1.0), seed * 0.34);
      col += luminance * size * pulse * cool;
    }
  }
  return col;
}

void main() {
  vec2 uv = (vUv * uResolution.xy - uResolution.xy * 0.5) / uResolution.y;
  float angle = uTime * uRotationSpeed;
  uv = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * uv;
  vec3 col = vec3(0.0);
  for (float i = 0.0; i < 1.0; i += 1.0 / LAYERS) {
    float depth = fract(i + uTime * uStarSpeed * 0.012);
    float scale = mix(17.0 * uDensity, 2.2 * uDensity, depth);
    float fade = depth * smoothstep(1.0, 0.88, depth);
    col += starLayer(uv * scale + i * 453.32) * fade;
  }
  float alpha = smoothstep(0.0, 0.24, length(col));
  gl_FragColor = vec4(col, min(alpha, 0.82));
}
`

const modeTargets: Record<GalaxyMode, { density: number; glow: number; speed: number; opacity: number }> = {
  home: { density: 1.55, glow: .2, speed: .35, opacity: .78 },
  project: { density: 1.28, glow: .14, speed: .27, opacity: .52 },
  technologies: { density: 1.72, glow: .21, speed: .34, opacity: .78 },
  contact: { density: 1.02, glow: .1, speed: .18, opacity: .4 },
  quiet: { density: 1.2, glow: .12, speed: .22, opacity: .46 },
}

export default function Galaxy({ mode, compact, reducedMotion }: GalaxyProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const modeRef = useRef(mode)
  const compactRef = useRef(compact)
  const reducedRef = useRef(reducedMotion)
  modeRef.current = mode
  compactRef.current = compact
  reducedRef.current = reducedMotion

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false, dpr: Math.min(window.devicePixelRatio || 1, compactRef.current ? 1 : 1.25) })
    const gl = renderer.gl
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.clearColor(0, 0, 0, 0)
    const geometry = new Triangle(gl)
    const initial = modeTargets[modeRef.current]
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Float32Array([1, 1, 1]) },
        uDensity: { value: compactRef.current ? initial.density * .68 : initial.density },
        uGlow: { value: initial.glow },
        uTwinkle: { value: reducedRef.current ? 0 : .2 },
        uRotationSpeed: { value: reducedRef.current ? 0 : .009 },
        uStarSpeed: { value: reducedRef.current ? 0 : initial.speed },
      },
    })
    const mesh = new Mesh(gl, { geometry, program })
    const canvas = gl.canvas as HTMLCanvasElement
    canvas.setAttribute('aria-hidden', 'true')
    container.appendChild(canvas)

    let visible = true
    let frame = 0
    let lastTime = 0
    const resize = () => {
      const { width, height } = container.getBoundingClientRect()
      renderer.setSize(Math.max(width, 1), Math.max(height, 1))
      program.uniforms.uResolution.value = new Float32Array([gl.canvas.width, gl.canvas.height, gl.canvas.width / Math.max(gl.canvas.height, 1)])
    }
    const render = (time: number) => {
      if (!visible) return
      const elapsed = Math.min((time - lastTime) / 1000, .05)
      lastTime = time
      const target = modeTargets[modeRef.current]
      const targetDensity = compactRef.current ? target.density * .68 : target.density
      program.uniforms.uDensity.value += (targetDensity - program.uniforms.uDensity.value) * elapsed * .75
      program.uniforms.uGlow.value += (target.glow - program.uniforms.uGlow.value) * elapsed * .75
      program.uniforms.uStarSpeed.value += ((reducedRef.current ? 0 : target.speed) - program.uniforms.uStarSpeed.value) * elapsed * .75
      container.style.opacity = String(target.opacity)
      if (!reducedRef.current) program.uniforms.uTime.value = time * .001
      renderer.render({ scene: mesh })
      if (!reducedRef.current) frame = requestAnimationFrame(render)
    }
    const onVisibility = () => {
      visible = !document.hidden
      cancelAnimationFrame(frame)
      if (visible) frame = requestAnimationFrame(render)
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    document.addEventListener('visibilitychange', onVisibility)
    resize()
    frame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      canvas.remove()
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [])

  return <div ref={containerRef} className="galaxy-background" data-mode={mode} aria-hidden="true" />
}
