let pages = [
    "cookie_1_v2_c_compressed 1 of 32.png",
"cookie_1_v2_c_compressed 10 of 32.png",
"cookie_1_v2_c_compressed 11 of 32.png",
"cookie_1_v2_c_compressed 12 of 32.png",
"cookie_1_v2_c_compressed 13 of 32.png",
"cookie_1_v2_c_compressed 14 of 32.png",
"cookie_1_v2_c_compressed 15 of 32.png",
"cookie_1_v2_c_compressed 16 of 32.png",
"cookie_1_v2_c_compressed 17 of 32.png",
"cookie_1_v2_c_compressed 18 of 32.png",
"cookie_1_v2_c_compressed 19 of 32.png",
"cookie_1_v2_c_compressed 2 of 32.png",
"cookie_1_v2_c_compressed 20 of 32.png",
"cookie_1_v2_c_compressed 21 of 32.png",
"cookie_1_v2_c_compressed 22 of 32.png",
"cookie_1_v2_c_compressed 23 of 32.png",
"cookie_1_v2_c_compressed 24 of 32.png",
"cookie_1_v2_c_compressed 25 of 32.png",
"cookie_1_v2_c_compressed 26 of 32.png",
"cookie_1_v2_c_compressed 27 of 32.png",
"cookie_1_v2_c_compressed 28 of 32.png",
"cookie_1_v2_c_compressed 29 of 32.png",
"cookie_1_v2_c_compressed 3 of 32.png",
"cookie_1_v2_c_compressed 30 of 32.png",
"cookie_1_v2_c_compressed 31 of 32.png",
"cookie_1_v2_c_compressed 32 of 32.png",
"cookie_1_v2_c_compressed 4 of 32.png",
"cookie_1_v2_c_compressed 5 of 32.png",
"cookie_1_v2_c_compressed 6 of 32.png",
"cookie_1_v2_c_compressed 7 of 32.png",
"cookie_1_v2_c_compressed 8 of 32.png",
"cookie_1_v2_c_compressed 9 of 32.png",
];

const RATIO_PAGE = 1.414/1;
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = (CANVAS_WIDTH/2)*RATIO_PAGE;

const canvas = document.querySelectorAll("#pagesCanvas")[0];
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
canvas.style.width = CANVAS_WIDTH+"px";
canvas.style.height = CANVAS_HEIGHT+"px";

let mouseX = 0;
let mouseY = 0;
const gl = canvas.getContext('webgl');
canvas.addEventListener("mousemove", function(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});
if (!gl) throw "WebGL not supported";

// Vertex shader: passthrough
const vertSrc = /*glsl*/`
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
    v_uv = (a_pos + 1.0) * 0.5;
    gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

// Fragment shader: sine wave based on time, samples a texture
const fragSrc = /*glsl*/`
precision mediump float;
varying vec2 v_uv;
uniform sampler2D leftPageTex;
uniform sampler2D rightPageTex;
uniform sampler2D turningPageTex;
uniform vec2 u_mouse;
uniform float u_time;

#define sat(a) clamp(a, 0., 1.)
#define rot(a) mat2(cos(a), -sin(a), sin(a), cos(a))

void main() {
    vec2 uv = vec2(0.,1.)+v_uv*vec2(1.,-1.);
    float wave = 0.5 + 0.5 * sin(10.0 * uv.x + u_time);
    vec2 leftuv = uv*vec2(2.,1.);
    float isLeftPage = float(leftuv.x > 0. && leftuv.x < 1. && leftuv.y > 0. && leftuv.y < 1.);
    vec3 leftTex = texture2D(leftPageTex, leftuv).xyz;
    vec2 rightuv = (uv-vec2(.5,0.))*vec2(2.,1.);
    float isRightPage = float(rightuv.x > 0. && rightuv.x < 1. && rightuv.y > 0. && rightuv.y < 1.);
    vec3 rightTex = texture2D(rightPageTex, rightuv).xyz;
    vec3 col = vec3(0.);
    col = mix(leftTex, rightTex, isRightPage);
    //uv -= u_mouse;
    vec2 bottomRightCorner = vec2(1.,1.);
    vec2 mouseToBottomRightVec = bottomRightCorner-u_mouse;
    float angle = atan(mouseToBottomRightVec.y, mouseToBottomRightVec.x);
    uv -= bottomRightCorner;
    uv *= rot(-angle);
    uv.x += -0.5+length(mouseToBottomRightVec);
    uv.x *= 2.;
    uv += bottomRightCorner;
    float cir = length(uv)-.05;
    col = mix(col, vec3(1.,0.,0.), 1.-sat(cir*500.));
    float isTurningPage = float(uv.x > 0. && uv.x < length(mouseToBottomRightVec) && uv.y > 0. && uv.y < 1.);
    col = mix(col, texture2D(turningPageTex, uv).xyz, isTurningPage);
    gl_FragColor = vec4(col, 1.);
}
`;

// Compile helper
function compileShader(src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        throw gl.getShaderInfoLog(s);
    }
    return s;
}

// Program setup
const prog = gl.createProgram();
gl.attachShader(prog, compileShader(vertSrc, gl.VERTEX_SHADER));
gl.attachShader(prog, compileShader(fragSrc, gl.FRAGMENT_SHADER));
gl.linkProgram(prog);
if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw gl.getProgramInfoLog(prog);
gl.useProgram(prog);

// Quad covering fullscreen
const posLoc = gl.getAttribLocation(prog, "a_pos");
const buf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1,-1, 1,-1, -1,1, 1,1
]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(posLoc);
gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

// Texture setup (placeholder: white texture)
const leftTexLoc = gl.getUniformLocation(prog, "leftPageTex");
const rightTexLoc = gl.getUniformLocation(prog, "rightPageTex");
const turningTexLoc = gl.getUniformLocation(prog, "turningPageTex");


function createTexture(textureUnit) {
    const tex = gl.createTexture();
    gl.activeTexture(textureUnit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // Here, replace with your image data!
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1,1,0,gl.RGBA,gl.UNSIGNED_BYTE, new Uint8Array([255,0,255,255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;    
}

function loadImage(texture, src) {
    // Asynchronously load an image
var image = new Image();
image.src = src;
image.addEventListener('load', function() {
  // Now that the image has loaded make copy it to the texture.
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
//   // if it's a power of 2 in both dimensions then
//   // we can generate mips, otherwise we'd have to do other things
//   gl.generateMipmap(gl.TEXTURE_2D);
});
}

const leftTex = createTexture(gl.TEXTURE0);
const rightTex = createTexture(gl.TEXTURE1);
const turningTex = createTexture(gl.TEXTURE2);

loadImage(leftTex, "pages/" + pages[0])
loadImage(rightTex, "pages/" + pages[1])
loadImage(turningTex, "pages/" + pages[3])

// Main update loop
const timeLoc = gl.getUniformLocation(prog, "u_time");
const mousePosLoc = gl.getUniformLocation(prog, "u_mouse");

function update(time) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, leftTex);
    gl.uniform1i(leftTexLoc, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, rightTex);
    gl.uniform1i(rightTexLoc, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, turningTex);
    gl.uniform1i(turningTexLoc, 2);


    gl.viewport(0,0,canvas.width,canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(timeLoc, time * 0.001);
    gl.uniform2f(mousePosLoc, mouseX/CANVAS_WIDTH, mouseY/CANVAS_HEIGHT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function gameLoop(time){
    window.requestAnimationFrame(gameLoop);
    update(time);
}

gameLoop(0);