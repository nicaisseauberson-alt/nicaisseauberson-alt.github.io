/**
 * Outlook Studio — Floating Wave Animation Background (WebGL2)
 * Porté fidèlement depuis le composant Framer officiel :
 * https://framer.com/m/Floating-Animation-taEDnY.js
 * 
 * 100% Natif WebGL2 sans dépendance lourde, ultra-fluide 60/120 FPS
 */
(function() {
  function initFloatingWave() {
    const canvas = document.getElementById("floating-bg-canvas");
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });

    if (!gl) {
      console.info("ℹ️ [WebGL2] Non supporté sur ce navigateur, le fond utilise l'ambiance CSS.");
      return;
    }

    const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

    const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ), 
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \
  int index = 0;                                            \
  for (int i = 0; i < 2; i++) {                               \
     ColorStop currentColor = colors[i];                    \
     bool isInBetween = currentColor.position <= factor;    \
     index = int(mix(float(index), float(i), float(isInBetween))); \
  }                                                         \
  ColorStop currentColor = colors[index];                   \
  ColorStop nextColor = colors[index + 1];                  \
  float range = nextColor.position - currentColor.position; \
  float lerpFactor = (factor - currentColor.position) / range; \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  
  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);
  
  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);
  
  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;
  
  float midPoint = 0.20;
  float animationAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  
  vec3 finalColor = rampColor;
  
  fragColor = vec4(finalColor * animationAlpha, animationAlpha);
}
`;

    function createShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertShader = createShader(gl, gl.VERTEX_SHADER, VERT);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    // Triangle plein écran
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       3, -1,
      -1,  3
    ]), gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, "position");
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const uTimeLoc = gl.getUniformLocation(program, "uTime");
    const uAmplitudeLoc = gl.getUniformLocation(program, "uAmplitude");
    const uColorStopsLoc = gl.getUniformLocation(program, "uColorStops");
    const uResolutionLoc = gl.getUniformLocation(program, "uResolution");
    const uBlendLoc = gl.getUniformLocation(program, "uBlend");

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    // Couleurs Framer par défaut : ["#FF2638", "#7cff67", "#5227FF"]
    let colorStopsArray = new Float32Array([
      1.0, 0.149, 0.22,    // Rouge vif
      0.486, 1.0, 0.404,   // Vert néon
      0.322, 0.153, 1.0    // Bleu / violet profond
    ]);

    let amplitude = 1.0;
    let blend = 0.55;
    let speed = 0.85;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    window.addEventListener("resize", resize, { passive: true });
    resize();

    let startTime = performance.now();

    function render(now) {
      const elapsed = (now - startTime) * 0.001 * speed;

      gl.useProgram(program);
      gl.bindVertexArray(vao);

      gl.uniform1f(uTimeLoc, elapsed);
      
      const baseHeight = 800;
      const currentHeight = window.innerHeight || 1;
      const scaleFactor = baseHeight / currentHeight;
      gl.uniform1f(uAmplitudeLoc, amplitude * scaleFactor);

      gl.uniform1f(uBlendLoc, blend);
      gl.uniform3fv(uColorStopsLoc, colorStopsArray);
      gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    // Contrôleur global
    window.FloatingWaveController = {
      setSpeed(val) { speed = Number(val) || 0.85; },
      setAmplitude(val) { amplitude = Number(val) || 1.0; },
      setBlend(val) { blend = Number(val) || 0.55; },
      setColors(rgbArray9) {
        if (Array.isArray(rgbArray9) && rgbArray9.length === 9) {
          colorStopsArray = new Float32Array(rgbArray9);
        }
      }
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFloatingWave);
  } else {
    initFloatingWave();
  }
})();
