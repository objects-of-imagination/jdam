import { JSX, createEffect, createMemo, splitProps } from 'solid-js'

const vertexShaderSource = `#version 300 es
  in vec2 a_position;

  out vec2 frag_uv;

  void main() {
    gl_Position = vec4(a_position.xy, 0.0, 1.0);
    frag_uv = a_position.xy;
  }
`

const fragmentShaderSource = `#version 300 es
  precision highp float;
  
  uniform ivec2 u_size;
  uniform float u_time;

  uniform vec3 u_colors[10];
  uniform vec2 u_points[10];
  uniform int u_num_colors;

  float pi = 3.14159265358;

  in vec2 frag_uv;

  out vec4 frag_color;

  float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 13587.585453);
  }

  void main() {
    float aspect = float(u_size.y) / float(u_size.x);

    // correct for non-square aspects
    vec2 aspect_adj = aspect > 1.0 ? vec2(1.0, 1.0 / aspect) : vec2(aspect, 1.0);
    float size = aspect > 1.0 ? 1.0 / aspect : aspect;

    vec3 total_color = vec3(0.0);
    float alpha = 0.0;

    for(int c = 0; c < u_num_colors; c++) {
      vec2 rand_offset = (vec2(
        rand(frag_uv * 4.0 + (u_time / 400000.0)),
        rand(frag_uv * 5.0 + (u_time / 400000.0))
      ) - 0.5) / 20.0;
      vec2 xy = (frag_uv + rand_offset) / aspect_adj;
      vec2 point_adj = u_points[c] / aspect_adj;

      float dist_fac = smoothstep(0.0, 1.0, 1.0 - distance(point_adj, xy) / 2.0 * size);
      vec3 new_col = u_colors[c];
      total_color += dist_fac * new_col; 
      alpha += dist_fac;
    }
    frag_color = vec4(total_color / (200.0 * float(u_num_colors)), alpha / float(u_num_colors));
  }
`

function configureProgram(canvas: HTMLCanvasElement, render: (size: [ number, number ]) => void) {
  const canvasSize: [ number, number ] = [ 512, 512 ]
  const gl = canvas.getContext('webgl2')

  if (!gl) { throw new Error('no gl context for canvas') }

  const resize = new ResizeObserver(() => {
    const container = canvas.parentElement!
    const { width, height } = container.getBoundingClientRect()
    canvasSize[0] = width
    canvasSize[1] = height 

    canvas.style.width = `${canvasSize[0]}px`
    canvas.style.height = `${canvasSize[1]}px`

    canvas.width = canvasSize[0]
    canvas.height = canvasSize[1]

    render(canvasSize)
  })

  resize.observe(canvas.parentElement!)

  const vertexShader = gl.createShader(gl.VERTEX_SHADER)
  if (!vertexShader) { throw new Error('could not create vertex shader') }
  gl.shaderSource(vertexShader, vertexShaderSource)

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
  if (!fragmentShader) { throw new Error('could not create fragment shader') }
  gl.shaderSource(fragmentShader, fragmentShaderSource)

  gl.compileShader(vertexShader)
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(vertexShader)?.toString())
  }

  gl.compileShader(fragmentShader)
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(fragmentShader)?.toString())
  }

  const prg = gl.createProgram()
  if (!prg) { throw new Error('could not create shader program') }
  gl.attachShader(prg, vertexShader)
  gl.attachShader(prg, fragmentShader)

  gl.linkProgram(prg)
  if (!gl.getProgramParameter(prg, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramParameter(prg, gl.LINK_STATUS))
  }

  gl.detachShader(prg, vertexShader)
  gl.detachShader(prg, fragmentShader)

  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  const buffer = gl.createBuffer()
  const quadShaderParams = {
    gl,
    prg,
    buffer,
    position: gl.getAttribLocation(prg, 'a_position'),
    size: gl.getUniformLocation(prg, 'u_size'),
    time: gl.getUniformLocation(prg, 'u_time'),
    colors: gl.getUniformLocation(prg, 'u_colors'),
    points: gl.getUniformLocation(prg, 'u_points'),
    num_colors: gl.getUniformLocation(prg, 'u_num_colors')
  }

  gl.useProgram(quadShaderParams.prg)

  const quadVao = gl.createVertexArray()
  gl.bindVertexArray(quadVao)
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.enableVertexAttribArray(quadShaderParams.position)
  // FLOAT is 4 bytes
  gl.vertexAttribPointer(quadShaderParams.position, 2, gl.FLOAT, false, 8, 0)
  
  return quadShaderParams
}


export interface GradientAnimProps extends JSX.HTMLAttributes<HTMLDivElement> {
  colors: number[][]
  speedMultiplier?: number
}

const POINTS = [
  -1, -1,
  1, -1,
  -1, 1,

  -1, 1,
  1, -1,
  1,  1
]
export function GradientAnim(props: GradientAnimProps) {

  const [ locals, rest ] = splitProps(props, [ 'colors', 'speedMultiplier' ])

  const flatColors = createMemo(() => {
    return locals.colors.flat()
  })

  const canvasSize = [ 512, 512 ]
  let canvas: HTMLCanvasElement | undefined
  
  createEffect(() => {
    locals
    if (!canvas) { return }

    let animTimerId = -1
    let totalTime = 0

    let points = locals.colors.map(() => {
      const gen = () => {
        const scale = Math.random() * 0.7 + 0.2
        return [
          Math.random() * 0.10 - 0.20, // coord
          Math.random() * 3_000, // timeOffset
          (Math.random() - 0.5) * 0.5 * (locals.speedMultiplier ?? 1), // speed
          scale  
        ]
      }
      return [ ...gen(), ...gen() ] 
      // return [ 0, 0 ] 
    })

    const render = (size = canvasSize) => {
      cancelAnimationFrame(animTimerId)

      const gl = params.gl
      canvasSize.splice(0, 2, ...size)

      gl.uniform2iv(params.size, Int32Array.from(canvasSize))
      gl.uniform1f(params.time, totalTime)

      gl.uniform3fv(params.colors, Float32Array.from(flatColors()))
      gl.uniform2fv(params.points, Float32Array.from(points.map(
        p => [ p[0] + Math.cos(totalTime * p[2] + p[1]) * p[3], p[4] + Math.cos(totalTime * p[6] + p[5]) * p[7] ]
      ).flat()))
      gl.uniform1i(params.num_colors, locals.colors.length)

      gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(POINTS), gl.STATIC_DRAW)

      gl.viewport(0, 0, size[0], size[1])
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, POINTS.length / 2)

      animTimerId = requestAnimationFrame(time => {
        const newTime = time / 1_000
        totalTime = newTime
        render()
      })
    }
    
    const params = configureProgram(canvas, render)
    render()

  })

  return (
    <div { ...rest }>
      <canvas ref={ canvas }/>
    </div>
  )
}
