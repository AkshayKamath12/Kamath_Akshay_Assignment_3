// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =`
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`

// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  void main() {
    gl_FragColor = u_FragColor;
    gl_FragColor = vec4(v_UV, 1.0, 1.0);
    gl_FragColor = texture2D(u_Sampler0, v_UV);
  }`


let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let g_selectedColor=[1.0, 0.0, 0.0, 1.0]
let g_selectedSize = 5;

let g_segments = 20;
let g_globalAngle = 5;
let g_allLegsAngle = 0.0;
let g_frontLegFootAngle = 0.0;
let g_frontToeAngle = 0.0;
let g_globalAngleX = 0; 
let g_globalAngleY = 0;
let animate = false;
let animateFoot = false;
let gemsAnimate = false;
let animateToes = false;
let gemsAnimateStartTime = 0;
let gemsAnimateTime = 0;
let isDragging = false;
let lastX = 0, lastY = 0;

let gemsColor1 = [0.0, 1.0, 0.0, 1.0];
let gemsColor2 = [0.0, 0.0, 1.0, 1.0];
let gemsColor3 = [1.0, 0.0, 0.0, 1.0];

function addActionsForHtmlUI(){

  document.getElementById("allLegsSlider").addEventListener('mousemove', function() {g_allLegsAngle = this.value;renderScene();});
  document.getElementById("frontFootSlider").addEventListener('mousemove', function() {g_frontLegFootAngle = this.value;renderScene();});
  document.getElementById("toeSlider").addEventListener('mousemove', function() {g_frontToeAngle = this.value;renderScene();});
  document.getElementById("cameraSlider").addEventListener('mousemove', function() {g_globalAngle = this.value; renderScene();});
  document.getElementById('animate').addEventListener('click', function() {animate = true;});
  document.getElementById('animateFoot').addEventListener('click', function() {animateFoot = true;});
  document.getElementById('animateToe').addEventListener('click', function() {animateToes = true;});
  document.getElementById('stopAnimate').addEventListener('click', function() {animate = false;});
  document.getElementById('stopAnimateFoot').addEventListener('click', function() {animateFoot = false;});
  document.getElementById('stopAnimateToe').addEventListener('click', function() {animateToes = false;});
  canvas.addEventListener('mousedown', (e) => {
  if (e.shiftKey) {
    gemsAnimate = true;
    gemsAnimateStartTime = performance.now() / 1000.0;
  }
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
      let dx = e.clientX - lastX;
      let dy = e.clientY - lastY;
      g_globalAngleX += dy * 0.5; // Adjust sensitivity as needed
      g_globalAngleY += dx * 0.5;
      lastX = e.clientX;
      lastY = e.clientY;
      renderScene(); // Re-render the scene with updated angles
    }
  });

  canvas.addEventListener('mouseup', () => {
    isDragging = false;
  });

  canvas.addEventListener('mouseleave', () => {
    isDragging = false;
  });
});
}

function initTextures() {
    var image = new Image();   
    if (!image) {
        console.log('Failed to create the image object');
        return false;
    }
    image.onload = function() { sendTextureToTEXTURE0(image); };
    image.src = 'sky.jpeg'; 
    return true;
}

function sendTextureToTEXTURE0(image) {
    var texture = gl.createTexture(); // Create a texture object
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
    gl.activeTexture(gl.TEXTURE0); // Activate texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, texture); // Bind the texture object to target
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // Set texture filtering
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image); 
    gl.uniform1i(u_Sampler, 0); // Pass the texture unit 0 to u_Sampler
}

function setupWebGL(){
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext('webgl', {preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
  //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

}

function main() {
  
  setupWebGL();

  connectVariablesToGLSL();
  addActionsForHtmlUI();
  initTextures();

  // Register function (event handler) to be called on a mouse press  
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  
  requestAnimationFrame(tick);
}


var g_shapes_list = [];
/*
var g_points = [];  // The array for the position of a mouse press
var g_colors = [];  // The array to store the color of a point
var g_sizes = [];
*/

function addMouseControl() {
  

  
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;
var g_endTime = performance.now();
var g_lastFps = g_endTime; 
var g_fps = 0;

function tick(){
  var now = performance.now();
  if(gemsAnimate && (now / 1000.0 - gemsAnimateStartTime) >= 5.0){
    gemsAnimate = false;
  }
  var changed = now - g_lastFps;
  g_lastFps = now;
  g_fps = 1000.0 / changed;
  g_seconds = now / 1000.0 - g_startTime;

  if(now - g_startTime >= 1000.0){
    document.getElementById("fps").innerText = g_fps.toFixed(1) + " fps";
    g_lastFps = now;
  }
  
  updateAnimationInfo();
  renderScene();
  requestAnimationFrame(tick);
}

function updateAnimationInfo(){
  if(animate){
    g_allLegsAngle = Math.abs(-45 * Math.sin(3*g_seconds));
  }
  if(animateFoot){
    g_frontLegFootAngle = Math.abs(-45 * Math.sin(3*g_seconds));
  }
  if(animateToes){
    g_frontToeAngle = Math.abs(-45 * Math.sin(3*g_seconds));
  }

  if(gemsAnimate){
    gemsColor1 = [Math.abs(Math.sin(g_seconds)), Math.abs(Math.cos(g_seconds)), 0.0, 1.0];
    gemsColor2 = [Math.abs(Math.sin(g_seconds + Math.PI/3)), Math.abs(Math.cos(g_seconds + Math.PI/3)), 0.0, 1.0];
    gemsColor3 = [Math.abs(Math.sin(g_seconds + Math.PI*2/3)), Math.abs(Math.cos(g_seconds + Math.PI*2/3)), 0.0, 1.0];
  }
}

function renderScene(){
  

  var globalRotateMat = new Matrix4()
    .rotate(g_globalAngleY, 0, 1, 0)
    .rotate(g_globalAngleX, 1, 0, 0)
    .rotate(g_globalAngle, 0, 1, 0);; 
  globalRotateMat.translate(-0.2, 0.1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotateMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  var head = new Cube();
  head.color = [1, 0.55, 0.63, 1.0]
  head.matrix.translate(-0.5, 0.25, 0);
  head.matrix.rotate(-90, 0, 0, 1);
  head.matrix.rotate(-20, 1, 0, 0);
  head.matrix.rotate(-10, 0, 1, 0);
  var tmpMatrix = new Matrix4(head.matrix);
  var noseMatrix = new Matrix4(head.matrix);
  var eyeMatrix = new Matrix4(head.matrix);
  var eyeMatrix2 = new Matrix4(head.matrix);
  var pupilMatrix = new Matrix4(head.matrix);
  var pupilMatrix2 = new Matrix4(head.matrix);
  var crownMatrix = new Matrix4(head.matrix);
  head.matrix.scale(0.5, 0.5, 0.5);
  head.render();

  var nose = new Cube();
  nose.color = [1, 0.55, 0.63, 1.0]
  nose.matrix = noseMatrix;
  nose.matrix.translate(0.2, 0.15, -0.09);
  var nostrilMatrix = new Matrix4(nose.matrix);
  var nostrilMatrix2 = new Matrix4(nose.matrix);
  nose.matrix.scale(0.2, 0.24, 0.2);
  nose.render();

  var nostril = new Cube();
  nostril.color = [0.52, 0.29, 0, 1.0]
  nostril.matrix = nostrilMatrix;
  nostril.matrix.translate(0.066, 0.159, -0.015);
  nostril.matrix.scale(0.08, 0.08, 0.05);
  nostril.render();

  var nostril2 = new Cube();
  nostril2.color = [0.52, 0.29, 0, 1.0]
  nostril2.matrix = nostrilMatrix2;
  nostril2.matrix.translate(0.066, 0.0001, -0.015);
  nostril2.matrix.scale(0.08, 0.08, 0.05);
  nostril2.render();

  var eye = new Cube();
  eye.color = [1, 1, 1, 1.0]
  eye.matrix = eyeMatrix;
  eye.matrix.translate(0.1, 0.38, -0.01);
  eye.matrix.scale(0.1, 0.115, 0.1);
  eye.render();

  var pupil = new Cube();
  pupil.color = [0, 0, 0, 1.0]
  pupil.matrix = pupilMatrix;
  pupil.matrix.translate(0.1, 0.44, -0.02);
  pupil.matrix.scale(0.1, 0.0575, 0.1);
  pupil.render();

  var eye2 = new Cube();
  eye2.color = [1, 1, 1, 1.0]
  eye2.matrix = eyeMatrix2;
  eye2.matrix.translate(0.1, 0.001, -0.02);
  eye2.matrix.scale(0.1, 0.115, 0.1);
  eye2.render();

  var pupil2 = new Cube();
  pupil2.color = [0, 0, 0, 1.0]
  pupil2.matrix = pupilMatrix2;
  pupil2.matrix.translate(0.1, 0.0001, -0.04);
  pupil2.matrix.scale(0.1, 0.0575, 0.1);
  pupil2.render();


  var body = new Cube();
  body.color = [1, 0.55, 0.63, 1.0]
  body.matrix = tmpMatrix;
  body.matrix.translate(0.1, -0.1, 0.5);
  var tmpMatrix2 = new Matrix4(head.matrix);
  var tmpMatrix3 = new Matrix4(head.matrix);
  var tmpMatrix4 = new Matrix4(head.matrix);
  var tmpMatrix5 = new Matrix4(head.matrix);
  body.matrix.scale(0.5, 0.7, 0.7);
  body.render();

  var crown = new Cube();
  crown.color = [1, 0.84, 0, 1.0]
  crown.matrix = crownMatrix;
  crown.matrix.translate(-0.02, -0.02, -0.001);
  var crownCornerMatrix = new Matrix4(crown.matrix);
  var crownCornerMatrix2 = new Matrix4(crown.matrix);
  var crownCornerMatrix3 = new Matrix4(crown.matrix);
  var crownCornerMatrix4 = new Matrix4(crown.matrix);
  var crownMiddleMatrix = new Matrix4(crown.matrix);
  var crownMiddleMatrix2 = new Matrix4(crown.matrix);
  var crownMiddleMatrix3 = new Matrix4(crown.matrix);
  var crownMiddleMatrix4 = new Matrix4(crown.matrix);
  var crownCenterMatrix = new Matrix4(crown.matrix);
  var crownGemMatrix = new Matrix4(crown.matrix);
  var crownGemMatrix2 = new Matrix4(crown.matrix);
  var crownGemMatrix3 = new Matrix4(crown.matrix);
  crown.matrix.scale(0.1, 0.53, 0.51);
  crown.render();

  var crownGem = new Cube();
  crownGem.color = gemsColor1
  crownGem.matrix = crownGemMatrix;
  crownGem.matrix.translate(0.01, 0.225, -0.01);
  crownGem.matrix.scale(0.05, 0.05, 0.1);

  var crownGem2 = new Cube();
  crownGem2.color = gemsColor2
  crownGem2.matrix = crownGemMatrix2;
  crownGem2.matrix.translate(0.01, 0.45, -0.01);
  crownGem2.matrix.scale(0.05, 0.05, 0.1);

  var crownGem3 = new Cube();
  crownGem3.color = gemsColor3
  crownGem3.matrix = crownGemMatrix3;
  crownGem3.matrix.translate(0.01, 0.02, -0.01);
  crownGem3.matrix.scale(0.05, 0.05, 0.1);
  

  if(gemsAnimate){
    crownGem.render();
    crownGem2.render();
    crownGem3.render();
  }

  var crownCorner = new Cube();
  crownCorner.color = [1, 0.84, 0, 1.0]
  crownCorner.matrix = crownCornerMatrix;
  crownCorner.matrix.translate(-0.08, 0, 0);
  crownCorner.matrix.scale(0.1, 0.1, 0.1);
  crownCorner.render();

  var crownMiddle = new Cube();
  crownMiddle.color = [1, 0.84, 0, 1.0]
  crownMiddle.matrix = crownMiddleMatrix;
  crownMiddle.matrix.translate(-0.08, 0.2, 0);
  crownMiddle.matrix.scale(0.1, 0.1, 0.1);
  crownMiddle.render();

  var crownCorner2 = new Cube();
  crownCorner2.color = [1, 0.84, 0, 1.0]
  crownCorner2.matrix = crownCornerMatrix2;
  crownCorner2.matrix.translate(-0.08, 0.43, 0);
  crownCorner2.matrix.scale(0.1, 0.1, 0.1);
  crownCorner2.render();

  var crownMiddle2 = new Cube();
  crownMiddle2.color = [1, 0.84, 0, 1.0]
  crownMiddle2.matrix = crownMiddleMatrix2;
  crownMiddle2.matrix.translate(-0.08, 0.2, 0.4);
  crownMiddle2.matrix.scale(0.1, 0.1, 0.1);
  crownMiddle2.render();

  var crownCorner3 = new Cube();
  crownCorner3.color = [1, 0.84, 0, 1.0]
  crownCorner3.matrix = crownCornerMatrix3;
  crownCorner3.matrix.translate(-0.08, 0.43, 0.4);
  crownCorner3.matrix.scale(0.1, 0.1, 0.1);
  crownCorner3.render();

  var crownMiddle3 = new Cube();
  crownMiddle3.color = [1, 0.84, 0, 1.0]
  crownMiddle3.matrix = crownMiddleMatrix3;
  crownMiddle3.matrix.translate(-0.08, 0.43, 0.2);
  crownMiddle3.matrix.scale(0.1, 0.1, 0.1);
  crownMiddle3.render();

  var crownCorner4 = new Cube();
  crownCorner4.color = [1, 0.84, 0, 1.0]
  crownCorner4.matrix = crownCornerMatrix4;
  crownCorner4.matrix.translate(-0.08, 0, 0.4);
  crownCorner4.matrix.scale(0.1, 0.1, 0.1);
  crownCorner4.render();
  
  var crownMiddle4 = new Cube();
  crownMiddle4.color = [1, 0.84, 0, 1.0]
  crownMiddle4.matrix = crownMiddleMatrix4;
  crownMiddle4.matrix.translate(-0.08, 0, 0.2);
  crownMiddle4.matrix.scale(0.1, 0.1, 0.1);
  crownMiddle4.render();

  var crownCenter = new Cone();
  crownCenter.color = [1, 0.84, 0, 1.0]
  crownCenter.matrix = crownCenterMatrix;
  crownCenter.matrix.translate(0, 0.25, 0.25);
  crownCenter.matrix.rotate(270, 0, 1, 0);
  crownCenter.matrix.scale(0.1, 0.1, 0.1);
  crownCenter.render();

  var frontLeftLeg = new Cube();
  frontLeftLeg.color = [1, 0.55, 0.63, 1.0]
  frontLeftLeg.matrix = tmpMatrix2;
  frontLeftLeg.matrix.translate(0.85, 0.7, 1);
  frontLeftLeg.matrix.rotate(g_allLegsAngle, 0, 0, 1);
  var frontFootMatrix = new Matrix4(frontLeftLeg.matrix);
  frontLeftLeg.matrix.scale(0.7, 0.4, 0.3);
  frontLeftLeg.render();

  var frontFoot = new Cube();
  frontFoot.color = [1, 0.55, 0.63, 1.0]
  frontFoot.matrix = frontFootMatrix;
  frontFoot.matrix.translate(0.5, 0, 0.001);
  frontFoot.matrix.rotate(g_frontLegFootAngle, 0, 1, 0);
  var frontToeMatrix = new Matrix4(frontFoot.matrix);
  var frontToeMatrix2 = new Matrix4(frontFoot.matrix);
  frontFoot.matrix.scale(0.2, 0.4, 0.3);
  frontFoot.render();

  var frontToe = new Cube();
  frontToe.color = [0.52, 0.29, 0, 1.0]
  frontToe.matrix = frontToeMatrix;
  frontToe.matrix.translate(0.099, 0.299, -0.01);
  frontToe.matrix.scale(0.1, 0.1, 0.1);
  frontToe.matrix.rotate(g_frontToeAngle, 0, 1, 0);
  frontToe.render();

  var frontToe2 = new Cube();
  frontToe2.color = [0.52, 0.29, 0, 1.0]
  frontToe2.matrix = frontToeMatrix2;
  frontToe2.matrix.translate(0.099, 0.001, -0.01);
  frontToe2.matrix.scale(0.1, 0.1, 0.1);
  frontToe2.matrix.rotate(g_frontToeAngle, 0, 1, 0);
  frontToe2.render();

  var frontRightLeg = new Cube();
  frontRightLeg.color = [1, 0.55, 0.63, 1.0]
  frontRightLeg.matrix = tmpMatrix3;
  frontRightLeg.matrix.translate(0.85, -0.1, 1);
  frontRightLeg.matrix.rotate(-g_allLegsAngle, 0, 0, 1);
  var frontToeMatrix3 = new Matrix4(frontRightLeg.matrix);
  var frontToeMatrix4 = new Matrix4(frontRightLeg.matrix);
  frontRightLeg.matrix.scale(0.7, 0.4, 0.3);
  frontRightLeg.render();

  var frontToe3 = new Cube();
  frontToe3.color = [0.52, 0.29, 0, 1.0]
  frontToe3.matrix = frontToeMatrix3;
  frontToe3.matrix.translate(0.599, 0.299, -0.001);
  frontToe3.matrix.scale(0.1, 0.1, 0.1);
  frontToe3.render();

  var frontToe4 = new Cube();
  frontToe4.color = [0.52, 0.29, 0, 1.0]
  frontToe4.matrix = frontToeMatrix4;
  frontToe4.matrix.translate(0.599, 0.001, -0.01);
  frontToe4.matrix.scale(0.1, 0.1, 0.1);
  frontToe4.render();

  var backRightLeg = new Cube();
  backRightLeg.color = [1, 0.55, 0.63, 1.0]
  backRightLeg.matrix = tmpMatrix4;
  backRightLeg.matrix.translate(0.85, -0.1, 2);
  backRightLeg.matrix.rotate(-g_allLegsAngle, 0, 0, 1);
  var backToeMatrix1 = new Matrix4(backRightLeg.matrix);
  var backToeMatrix2 = new Matrix4(backRightLeg.matrix);
  backRightLeg.matrix.scale(0.7, 0.4, 0.3);
  backRightLeg.render();

  var backToe1 = new Cube();
  backToe1.color = [0.52, 0.29, 0, 1.0]
  backToe1.matrix = backToeMatrix1;
  backToe1.matrix.translate(0.599, 0.299, -0.001);
  backToe1.matrix.scale(0.1, 0.1, 0.1);
  backToe1.render();

  var backToe2 = new Cube();
  backToe2.color = [0.52, 0.29, 0, 1.0]
  backToe2.matrix = backToeMatrix2;
  backToe2.matrix.translate(0.599, 0.001, -0.01);
  backToe2.matrix.scale(0.1, 0.1, 0.1);
  backToe2.render();

  var backLeftLeg = new Cube();
  backLeftLeg.color = [1, 0.55, 0.63, 1.0]
  backLeftLeg.matrix = tmpMatrix5;
  backLeftLeg.matrix.translate(0.85, 0.7, 2);
  backLeftLeg.matrix.rotate(g_allLegsAngle, 0, 0, 1);
  var backToeMatrix3 = new Matrix4(backLeftLeg.matrix);
  var backToeMatrix4 = new Matrix4(backLeftLeg.matrix);
  backLeftLeg.matrix.scale(0.7, 0.4, 0.3);
  backLeftLeg.render();

  var backToe3 = new Cube();
  backToe3.color = [0.52, 0.29, 0, 1.0]
  backToe3.matrix = backToeMatrix3;
  backToe3.matrix.translate(0.599, 0.299, -0.001);
  backToe3.matrix.scale(0.1, 0.1, 0.1);
  backToe3.render();

  var backToe4 = new Cube();
  backToe4.color = [0.52, 0.29, 0, 1.0]
  backToe4.matrix = backToeMatrix4;
  backToe4.matrix.translate(0.599, 0.001, -0.01);
  backToe4.matrix.scale(0.1, 0.1, 0.1);
  backToe4.render();
}