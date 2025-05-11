// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =`
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor; 
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform int u_whichTexture;
  void main() {
    
    if (u_whichTexture == -2) {
    gl_FragColor = u_FragColor;
    } else if (u_whichTexture == -1) {
     gl_FragColor = vec4(v_UV, 1.0, 1.0);
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if (u_whichTexture == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    } else if (u_whichTexture == 3) {
      gl_FragColor = texture2D(u_Sampler3, v_UV);
    } else {
      gl_FragColor = vec4(1, .2, .2, 1);
    }

  }`


let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
//let u_ViewMatrix;
//let u_ProjectionMatrix;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_Sampler3;
let u_whichTexture;


let g_globalAngle = 80;
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
  document.getElementById("perspective").addEventListener("click", function(){
    camera.eye.elements = [4.36159610748291, 5.091113090515137, -2.926283121109009];
    camera.at.elements = [11.161596298217773, 0.33325591683387756, -11.952878952026367];
  });
  canvas.addEventListener('mousedown', (e) => {
  if (e.shiftKey) {
    gemsAnimate = true;
    gemsAnimateStartTime = performance.now() / 1000.0;
  }

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left; // X coordinate relative to canvas
    const mouseY = e.clientY - rect.top;  // Y coordinate relative to canvas

    // Normalize mouse coordinates to [-1, 1]
    const normalizedX = (mouseX / canvas.width) * 2 - 1;
    const normalizedY = (mouseY / canvas.height) * -2 + 1;

    // Adjust the camera's `at` vector based on the mouse position
    camera.at = new Vector3([
        camera.eye.elements[0] + normalizedX * 10, // Adjust the multiplier for sensitivity
        camera.eye.elements[1] + normalizedY * 10,
        camera.at.elements[2] // Keep Z constant for now
    ]);

    // Re-render the scene with the updated camera
    renderScene();
});

});
}


function initTextures() {
    var skyImg = new Image(); 
    var wallTextureImg = new Image(); 
    var fenceTextureImg = new Image(); 
    var diamondTextureImg = new Image();
    if (!skyImg || !wallTextureImg || !fenceTextureImg) {
        console.log('Failed to create the image object');
        return false;
    }
    skyImg.onload = function() { sendTextureToTEXTURE0(skyImg); };
    skyImg.src = 'sky.png'; 

    wallTextureImg.onload = function() { sendTextureToTEXTURE1(wallTextureImg); };
    wallTextureImg.src = 'wall.jpg';

    fenceTextureImg.onload = function() { sendTextureToTexture2(fenceTextureImg); };
    fenceTextureImg.src = 'fence.png';

    diamondTextureImg.onload = function() { sendTextureToTEXTURE3(diamondTextureImg); };
    diamondTextureImg.src = 'diamond.jpg';
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
    gl.uniform1i(u_Sampler0, 0); // Pass the texture unit 0 to u_Sampler
}

function sendTextureToTEXTURE1(image) {
    var texture = gl.createTexture(); // Create a texture object
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
    gl.activeTexture(gl.TEXTURE1); // Activate texture unit 1
    gl.bindTexture(gl.TEXTURE_2D, texture); // Bind the texture object to target
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // Set texture filtering
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image); 
    gl.uniform1i(u_Sampler1, 1); // Pass the texture unit 1 to u_Sampler1
}

function sendTextureToTexture2(image) {

    var texture = gl.createTexture(); // Create a texture object
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
    gl.activeTexture(gl.TEXTURE2); // Activate texture unit 2
    gl.bindTexture(gl.TEXTURE_2D, texture); // Bind the texture object to target
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // Set texture filtering
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler2, 2); // Pass the texture unit 2 to u_Sampler2
}

function sendTextureToTEXTURE3(image) {
    var texture = gl.createTexture(); // Create a texture object
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
    gl.activeTexture(gl.TEXTURE3); // Activate texture unit 3
    gl.bindTexture(gl.TEXTURE_2D, texture); // Bind the texture object to target
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // Set texture filtering
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler3, 3); // Pass the texture unit 3 to u_Sampler3
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


  
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }
  

  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return;
  }

  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    if (!u_Sampler1) {
        console.log('Failed to get the storage location of u_Sampler1');
        return;
    }

  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  if (!u_Sampler2) {
      console.log('Failed to get the storage location of u_Sampler2');
      return;
  }

  u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
  if (!u_Sampler3) {
      console.log('Failed to get the storage location of u_Sampler3');
      return;
  }

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return; 
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

}

function main() {
  
  setupWebGL();

  connectVariablesToGLSL();
  addActionsForHtmlUI();
  document.onkeydown = keydown;
  initTextures();

  // Register function (event handler) to be called on a mouse press  
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  
  requestAnimationFrame(tick);
}

function keydown(ev) {
  if (ev.keyCode == 65) { // A
    camera.left();
  } else if (ev.keyCode == 68) { // D
    camera.right();
  } else if (ev.keyCode == 87) { // W
    camera.forward();
  } else if (ev.keyCode == 83) { // S
    camera.backward();
  } else if (ev.keyCode == 69) { // E
    camera.panRight(1);
  }else if (ev.keyCode == 81) { // Q
    camera.panLeft(1);
  } else if (ev.keyCode == 37) { // Left arrow key
    camera.panLeft(1);
  } else if (ev.keyCode == 39) { // Right arrow key 
    camera.panRight(1);
  } else if (ev.keyCode == 38) { // Up arrow key 
    camera.eye.elements[1] += 0.2;
  } else if (ev.keyCode == 40) { // Down arrow key 
    if(camera.eye.elements[1] > 0.2){
      camera.eye.elements[1] -= 0.2;
    }
    
  }
  console.log("eye: " + camera.eye.elements[0] + ", " + camera.eye.elements[1] + ", " + camera.eye.elements[2]);
  console.log("at: " + camera.at.elements[0] + ", " + camera.at.elements[1] + ", " + camera.at.elements[2]);
  renderScene();
}


var g_shapes_list = [];
/*
var g_points = [];  // The array for the position of a mouse press
var g_colors = [];  // The array to store the color of a point
var g_sizes = [];
*/


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

var camera = new Camera();
camera.eye = new Vector3([7, 0.6000000238418579, -4.199999809265137]);
camera.at = new Vector3([6.477654457092285, -0.09573586285114288, -68.99990844726562]);
camera.up = new Vector3([0.0, 1.0, 0.0]);


function drawMap(){
  var cube = new Cube();
  for(var i = 0; i < 32; i++){  
    for(var j = 0; j < 32; j++){
      if (map[i][j] == -1) {
        cube = new Cube();
        cube.color = [0.3, 0.1, 0.1, 1.0];
        cube.matrix.translate(i, -0.5, j);
        //cube.matrix.scale(0.5, 0.5, 0.5);
        cube.renderFast();
      } else if (map[i][j] > 0) {
        cube = new Cube();
        cube.color = [0.3, 0.1, 0.1, 1.0];
        cube.matrix.translate(i, -0.5, j);
       
        //cube.matrix.scale(0.5, 0.5, 0.5);
        cube.textureNum = 1;
        cube.renderFast();
      }
    }
  }
}

function drawTree(x, y, z){
  var trunk = new Cube();
  trunk.color = [0.3, 0.1, 0.1, 1.0];
  trunk.matrix.translate(x, y, z);
  trunk.matrix.scale(0.5, 1.5, 0.5);
  trunk.renderFast();

  var leaves = new Cube();
  leaves.color = [0.1, 0.8, 0.1, 1.0];
  leaves.matrix.translate(x-0.25, y + 1.5, z-0.25);
  leaves.matrix.scale(1, 1, 1);
  leaves.renderFast();

}

function drawHouse(x, y, z){
  const height = 3;
  for(var i = -1; i < height; i++){
    drawLayer(x, y, z, i*0.5);
  }
  drawRoof(x, y, z, height*0.5);


}

function drawLayer(x, y, z, height){
  var cube = new Cube();
  cube.color = [0.3, 0.1, 0.1, 1.0];
  cube.matrix.translate(x, y+height, z);
  cube.matrix.scale(0.5, 0.5, 0.5);
  cube.textureNum = 1;
  cube.renderFast();

  var cube2 = new Cube();
  cube2.color = [0.3, 0.1, 0.1, 1.0];
  cube2.matrix.translate(x, y+height, z + 1);
  cube2.matrix.scale(0.5, 0.5, 0.5);
  cube2.textureNum = 1;
  cube2.renderFast();

  var cube3 = new Cube();
  cube3.color = [0.3, 0.1, 0.1, 1.0];
  cube3.matrix.translate(x + 0.5, y+height, z);
  cube3.matrix.scale(0.5, 0.5, 0.5);
  cube3.textureNum = 1;
  cube3.renderFast();

  var cube4 = new Cube();
  cube4.color = [0.3, 0.1, 0.1, 1.0];
  cube4.matrix.translate(x + 1, y+height, z);
  cube4.matrix.scale(0.5, 0.5, 0.5);
  cube4.textureNum = 1;
  cube4.renderFast();

  var cube5 = new Cube();
  cube5.color = [0.3, 0.1, 0.1, 1.0];
  cube5.matrix.translate(x + 1.5, y+height, z);
  cube5.matrix.scale(0.5, 0.5, 0.5);
  cube5.textureNum = 1;
  cube5.renderFast();

  var cube6 = new Cube();
  cube6.color = [0.3, 0.1, 0.1, 1.0];
  cube6.matrix.translate(x + 2, y+height, z);
  cube6.matrix.scale(0.5, 0.5, 0.5);
  cube6.textureNum = 1;
  cube6.renderFast();

  var cube7 = new Cube();
  cube7.color = [0.3, 0.1, 0.1, 1.0];
  cube7.matrix.translate(x + 2, y+height, z+0.5);
  cube7.matrix.scale(0.5, 0.5, 0.5);
  cube7.textureNum = 1;
  cube7.renderFast();

  var cube8 = new Cube();
  cube8.color = [0.3, 0.1, 0.1, 1.0];
  cube8.matrix.translate(x + 2, y+height, z+1);
  cube8.matrix.scale(0.5, 0.5, 0.5);
  cube8.textureNum = 1;
  cube8.renderFast();

  var cube9 = new Cube();
  cube9.color = [0.3, 0.1, 0.1, 1.0];
  cube9.matrix.translate(x + 2, y+height, z+1.5);
  cube9.matrix.scale(0.5, 0.5, 0.5);
  cube9.textureNum = 1;
  cube9.renderFast();

  var cube10 = new Cube();
  cube10.color = [0.3, 0.1, 0.1, 1.0];
  cube10.matrix.translate(x + 2, y+height, z+2);
  cube10.matrix.scale(0.5, 0.5, 0.5);
  cube10.textureNum = 1;
  cube10.renderFast();

  var cube11 = new Cube();
  cube11.color = [0.3, 0.1, 0.1, 1.0];
  cube11.matrix.translate(x + 1.5, y+height, z+2);
  cube11.matrix.scale(0.5, 0.5, 0.5);
  cube11.textureNum = 1;
  cube11.renderFast();

  var cube12 = new Cube();
  cube12.color = [0.3, 0.1, 0.1, 1.0];
  cube12.matrix.translate(x + 1, y+height, z+2);
  cube12.matrix.scale(0.5, 0.5, 0.5);
  cube12.textureNum = 1;
  cube12.renderFast();

  var cube13 = new Cube();
  cube13.color = [0.3, 0.1, 0.1, 1.0];
  cube13.matrix.translate(x + 0.5, y+height, z+2);
  cube13.matrix.scale(0.5, 0.5, 0.5);
  cube13.textureNum = 1;
  cube13.renderFast();

  var cube14 = new Cube();
  cube14.color = [0.3, 0.1, 0.1, 1.0];
  cube14.matrix.translate(x, y+height, z+2);
  cube14.matrix.scale(0.5, 0.5, 0.5);
  cube14.textureNum = 1;
  cube14.renderFast();

  var cube15 = new Cube();
  cube15.color = [0.3, 0.1, 0.1, 1.0];
  cube15.matrix.translate(x, y+height, z+1.5);
  cube15.matrix.scale(0.5, 0.5, 0.5);
  cube15.textureNum = 1;
  cube15.renderFast();
}

function drawRoof(x, y, z, height){
  for(var i = 0; i < 4; i++){
    for(var j = 0; j < 5; j++){
      var cube = new Cube();
      cube.color = [0.3, 0.1, 0.1, 1.0];
      cube.matrix.translate(x + i*0.5, y+height, z + j*0.5);
      cube.matrix.scale(0.5, 0.5, 0.5);
      cube.textureNum = 1;
      cube.renderFast();
    }
  }

  for(var i = 1; i < 3; i++){
    for(var j = 1; j < 4; j++){
      var cube = new Cube();
      cube.color = [0.3, 0.1, 0.1, 1.0];
      cube.matrix.translate(x + i*0.5, y+height + 0.5, z + j*0.5);
      cube.matrix.scale(0.5, 0.5, 0.5);
      cube.textureNum = 1;
      cube.renderFast();
    }
  }

  var cube = new Cube();
  cube.color = [0.3, 0.1, 0.1, 1.0];
  cube.matrix.translate(x + 0.75, y+height + 1, z + 1);
  cube.matrix.scale(0.5, 0.5, 0.5);
  cube.textureNum = 1;
  cube.renderFast();
}

function drawPig(x, y, z, theta=-80){
  
  var head = new Cube();
  head.color = [1, 0.55, 0.63, 1.0]
  head.matrix.translate(x, y, z);
  //head.matrix.translate(10, 0.25, 10);
  head.matrix.rotate(-90, 0, 0, 1);
  head.matrix.rotate(theta, 1, 0, 0);
  head.matrix.rotate(-10, 0, 1, 0);
  var tmpMatrix = new Matrix4(head.matrix);
  var noseMatrix = new Matrix4(head.matrix);
  var eyeMatrix = new Matrix4(head.matrix);
  var eyeMatrix2 = new Matrix4(head.matrix);
  var pupilMatrix = new Matrix4(head.matrix);
  var pupilMatrix2 = new Matrix4(head.matrix);
  var crownMatrix = new Matrix4(head.matrix);
  head.matrix.scale(0.5, 0.5, 0.5);
  head.renderFast();

  var nose = new Cube();
  nose.color = [1, 0.55, 0.63, 1.0]
  nose.matrix = noseMatrix;
  nose.matrix.translate(0.2, 0.15, -0.09);
  var nostrilMatrix = new Matrix4(nose.matrix);
  var nostrilMatrix2 = new Matrix4(nose.matrix);
  nose.matrix.scale(0.2, 0.24, 0.2);
  nose.renderFast();

  var nostril = new Cube();
  nostril.color = [0.52, 0.29, 0, 1.0]
  nostril.matrix = nostrilMatrix;
  nostril.matrix.translate(0.066, 0.159, -0.015);
  nostril.matrix.scale(0.08, 0.08, 0.05);
  nostril.renderFast();

  var nostril2 = new Cube();
  nostril2.color = [0.52, 0.29, 0, 1.0]
  nostril2.matrix = nostrilMatrix2;
  nostril2.matrix.translate(0.066, 0.0001, -0.015);
  nostril2.matrix.scale(0.08, 0.08, 0.05);
  nostril2.renderFast();

  var eye = new Cube();
  eye.color = [1, 1, 1, 1.0]
  eye.matrix = eyeMatrix;
  eye.matrix.translate(0.1, 0.38, -0.01);
  eye.matrix.scale(0.1, 0.115, 0.1);
  eye.renderFast();

  var pupil = new Cube();
  pupil.color = [0, 0, 0, 1.0]
  pupil.matrix = pupilMatrix;
  pupil.matrix.translate(0.1, 0.44, -0.02);
  pupil.matrix.scale(0.1, 0.0575, 0.1);
  pupil.renderFast();

  var eye2 = new Cube();
  eye2.color = [1, 1, 1, 1.0]
  eye2.matrix = eyeMatrix2;
  eye2.matrix.translate(0.1, 0.001, -0.02);
  eye2.matrix.scale(0.1, 0.115, 0.1);
  eye2.renderFast();

  var pupil2 = new Cube();
  pupil2.color = [0, 0, 0, 1.0]
  pupil2.matrix = pupilMatrix2;
  pupil2.matrix.translate(0.1, 0.0001, -0.04);
  pupil2.matrix.scale(0.1, 0.0575, 0.1);
  pupil2.renderFast();


  var body = new Cube();
  body.color = [1, 0.55, 0.63, 1.0]
  body.matrix = tmpMatrix;
  body.matrix.translate(0.1, -0.1, 0.5);
  var tmpMatrix2 = new Matrix4(head.matrix);
  var tmpMatrix3 = new Matrix4(head.matrix);
  var tmpMatrix4 = new Matrix4(head.matrix);
  var tmpMatrix5 = new Matrix4(head.matrix);
  body.matrix.scale(0.5, 0.7, 0.7);
  body.renderFast();

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
  crown.renderFast();

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
    crownGem.renderFast();
    crownGem2.renderFast();
    crownGem3.renderFast();
  }

  var crownCorner = new Cube();
  crownCorner.color = [1, 0.84, 0, 1.0]
  crownCorner.matrix = crownCornerMatrix;
  crownCorner.matrix.translate(-0.08, 0, 0);
  crownCorner.matrix.scale(0.1, 0.1, 0.1);
  crownCorner.renderFast();

  var crownMiddle = new Cube();
  crownMiddle.color = [1, 0.84, 0, 1.0]
  crownMiddle.matrix = crownMiddleMatrix;
  crownMiddle.matrix.translate(-0.08, 0.2, 0);
  crownMiddle.matrix.scale(0.1, 0.1, 0.1);
  crownMiddle.renderFast();

  var crownCorner2 = new Cube();
  crownCorner2.color = [1, 0.84, 0, 1.0]
  crownCorner2.matrix = crownCornerMatrix2;
  crownCorner2.matrix.translate(-0.08, 0.43, 0);
  crownCorner2.matrix.scale(0.1, 0.1, 0.1);
  crownCorner2.renderFast();

  var crownMiddle2 = new Cube();
  crownMiddle2.color = [1, 0.84, 0, 1.0]
  crownMiddle2.matrix = crownMiddleMatrix2;
  crownMiddle2.matrix.translate(-0.08, 0.2, 0.4);
  crownMiddle2.matrix.scale(0.1, 0.1, 0.1);
  crownMiddle2.renderFast();

  var crownCorner3 = new Cube();
  crownCorner3.color = [1, 0.84, 0, 1.0]
  crownCorner3.matrix = crownCornerMatrix3;
  crownCorner3.matrix.translate(-0.08, 0.43, 0.4);
  crownCorner3.matrix.scale(0.1, 0.1, 0.1);
  crownCorner3.renderFast();

  var crownMiddle3 = new Cube();
  crownMiddle3.color = [1, 0.84, 0, 1.0]
  crownMiddle3.matrix = crownMiddleMatrix3;
  crownMiddle3.matrix.translate(-0.08, 0.43, 0.2);
  crownMiddle3.matrix.scale(0.1, 0.1, 0.1);
  crownMiddle3.renderFast();

  var crownCorner4 = new Cube();
  crownCorner4.color = [1, 0.84, 0, 1.0]
  crownCorner4.matrix = crownCornerMatrix4;
  crownCorner4.matrix.translate(-0.08, 0, 0.4);
  crownCorner4.matrix.scale(0.1, 0.1, 0.1);
  crownCorner4.renderFast();
  
  var crownMiddle4 = new Cube();
  crownMiddle4.color = [1, 0.84, 0, 1.0]
  crownMiddle4.matrix = crownMiddleMatrix4;
  crownMiddle4.matrix.translate(-0.08, 0, 0.2);
  crownMiddle4.matrix.scale(0.1, 0.1, 0.1);
  crownMiddle4.renderFast();

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
  frontLeftLeg.renderFast();

  var frontFoot = new Cube();
  frontFoot.color = [1, 0.55, 0.63, 1.0]
  frontFoot.matrix = frontFootMatrix;
  frontFoot.matrix.translate(0.5, 0, 0.001);
  frontFoot.matrix.rotate(g_frontLegFootAngle, 0, 1, 0);
  var frontToeMatrix = new Matrix4(frontFoot.matrix);
  var frontToeMatrix2 = new Matrix4(frontFoot.matrix);
  frontFoot.matrix.scale(0.2, 0.4, 0.3);
  frontFoot.renderFast();

  var frontToe = new Cube();
  frontToe.color = [0.52, 0.29, 0, 1.0]
  frontToe.matrix = frontToeMatrix;
  frontToe.matrix.translate(0.099, 0.299, -0.01);
  frontToe.matrix.scale(0.1, 0.1, 0.1);
  frontToe.matrix.rotate(g_frontToeAngle, 0, 1, 0);
  frontToe.renderFast();

  var frontToe2 = new Cube();
  frontToe2.color = [0.52, 0.29, 0, 1.0]
  frontToe2.matrix = frontToeMatrix2;
  frontToe2.matrix.translate(0.099, 0.001, -0.01);
  frontToe2.matrix.scale(0.1, 0.1, 0.1);
  frontToe2.matrix.rotate(g_frontToeAngle, 0, 1, 0);
  frontToe2.renderFast();

  var frontRightLeg = new Cube();
  frontRightLeg.color = [1, 0.55, 0.63, 1.0]
  frontRightLeg.matrix = tmpMatrix3;
  frontRightLeg.matrix.translate(0.85, -0.1, 1);
  frontRightLeg.matrix.rotate(-g_allLegsAngle, 0, 0, 1);
  var frontToeMatrix3 = new Matrix4(frontRightLeg.matrix);
  var frontToeMatrix4 = new Matrix4(frontRightLeg.matrix);
  frontRightLeg.matrix.scale(0.7, 0.4, 0.3);
  frontRightLeg.renderFast();

  var frontToe3 = new Cube();
  frontToe3.color = [0.52, 0.29, 0, 1.0]
  frontToe3.matrix = frontToeMatrix3;
  frontToe3.matrix.translate(0.599, 0.299, -0.001);
  frontToe3.matrix.scale(0.1, 0.1, 0.1);
  frontToe3.renderFast();

  var frontToe4 = new Cube();
  frontToe4.color = [0.52, 0.29, 0, 1.0]
  frontToe4.matrix = frontToeMatrix4;
  frontToe4.matrix.translate(0.599, 0.001, -0.01);
  frontToe4.matrix.scale(0.1, 0.1, 0.1);
  frontToe4.renderFast();

  var backRightLeg = new Cube();
  backRightLeg.color = [1, 0.55, 0.63, 1.0]
  backRightLeg.matrix = tmpMatrix4;
  backRightLeg.matrix.translate(0.85, -0.1, 2);
  backRightLeg.matrix.rotate(-g_allLegsAngle, 0, 0, 1);
  var backToeMatrix1 = new Matrix4(backRightLeg.matrix);
  var backToeMatrix2 = new Matrix4(backRightLeg.matrix);
  backRightLeg.matrix.scale(0.7, 0.4, 0.3);
  backRightLeg.renderFast();

  var backToe1 = new Cube();
  backToe1.color = [0.52, 0.29, 0, 1.0]
  backToe1.matrix = backToeMatrix1;
  backToe1.matrix.translate(0.599, 0.299, -0.001);
  backToe1.matrix.scale(0.1, 0.1, 0.1);
  backToe1.renderFast();

  var backToe2 = new Cube();
  backToe2.color = [0.52, 0.29, 0, 1.0]
  backToe2.matrix = backToeMatrix2;
  backToe2.matrix.translate(0.599, 0.001, -0.01);
  backToe2.matrix.scale(0.1, 0.1, 0.1);
  backToe2.renderFast();

  var backLeftLeg = new Cube();
  backLeftLeg.color = [1, 0.55, 0.63, 1.0]
  backLeftLeg.matrix = tmpMatrix5;
  backLeftLeg.matrix.translate(0.85, 0.7, 2);
  backLeftLeg.matrix.rotate(g_allLegsAngle, 0, 0, 1);
  var backToeMatrix3 = new Matrix4(backLeftLeg.matrix);
  var backToeMatrix4 = new Matrix4(backLeftLeg.matrix);
  backLeftLeg.matrix.scale(0.7, 0.4, 0.3);
  backLeftLeg.renderFast();

  var backToe3 = new Cube();
  backToe3.color = [0.52, 0.29, 0, 1.0]
  backToe3.matrix = backToeMatrix3;
  backToe3.matrix.translate(0.599, 0.299, -0.001);
  backToe3.matrix.scale(0.1, 0.1, 0.1);
  backToe3.renderFast();

  var backToe4 = new Cube();
  backToe4.color = [0.52, 0.29, 0, 1.0]
  backToe4.matrix = backToeMatrix4;
  backToe4.matrix.translate(0.599, 0.001, -0.01);
  backToe4.matrix.scale(0.1, 0.1, 0.1);
  backToe4.renderFast();
}

function drawMinecraftFence(x, y, z){
  var corner1 = new Cube();
  corner1.color = [0.3, 0.21, 0.2, 1.0];
  corner1.matrix.translate(x-0.01, y, z-0.01);
  corner1.matrix.scale(0.6, 1.5, 0.6);
  corner1.textureNum = 2;
  corner1.renderFast();

  var joint1 = new Cube();
  joint1.color = [0.3, 0.21, 0.2, 1.0];
  joint1.matrix.translate(x + 0.5, y+0.75, z);
  joint1.matrix.scale(3.5, 0.25, 0.5);
  joint1.textureNum = 2;
  joint1.renderFast();

  var corner2 = new Cube();
  corner2.color = [0.3, 0.21, 0.2, 1.0];
  corner2.matrix.translate(x + 4.01, y, z+0.01);
  corner2.matrix.scale(0.6, 1.5, 0.6);
  corner2.textureNum = 2;
  corner2.renderFast();

  var corner3 = new Cube();
  corner3.color = [0.3, 0.21, 0.2, 1.0];
  corner3.matrix.translate(x+4.01, y, z + 3.01);
  corner3.matrix.scale(0.6, 1.5, 0.6);
  corner3.textureNum = 2;
  corner3.renderFast();

  var joint2 = new Cube();
  joint2.color = [0.3, 0.21, 0.2, 1.0];
  joint2.matrix.translate(x + 0.5, y+0.75, z + 3);
  joint2.matrix.scale(3.5, 0.25, 0.5);
  joint2.textureNum = 2;
  joint2.renderFast();

  var corner4 = new Cube();
  corner4.color = [0.3, 0.21, 0.2, 1.0];
  corner4.matrix.translate(x-0.01, y, z + 3.01);
  corner4.matrix.scale(0.6, 1.5, 0.6);
  corner4.textureNum = 2;
  corner4.renderFast();

  var joint3 = new Cube();
  joint3.color = [0.3, 0.21, 0.2, 1.0];
  joint3.matrix.translate(x, y+0.75, z);
  joint3.matrix.scale(0.5, 0.25, 3.5);
  joint3.textureNum = 2;
  joint3.renderFast();

  var joint4 = new Cube();  
  joint4.color = [0.3, 0.21, 0.2, 1.0];
  joint4.matrix.translate(x + 4, y+0.75, z);
  joint4.matrix.scale(0.5, 0.25, 3.5);
  joint4.textureNum = 2;
  joint4.renderFast();
}

function drawSteve(x, y, z){
  var head = new Cube();
  //skin color
  head.color = [0.8, 0.6, 0.4, 1.0]
  head.matrix.translate(x, y, z);
  var bodyMatrix = new Matrix4(head.matrix);
  var topHairMatrix = new Matrix4(head.matrix);
  var backHairMatrix = new Matrix4(head.matrix);
  var leftEyeMatrix = new Matrix4(head.matrix);
  var rightEyeMatrix = new Matrix4(head.matrix);
  var noseMatrix = new Matrix4(head.matrix);
  head.matrix.scale(0.5, 0.5, 0.5);
  head.renderFast();

  var nose = new Cube();

  // brown color
  nose.color = [0.45, 0.3, 0.1, 1.0]
  nose.matrix = noseMatrix;
  nose.matrix.translate(-0.01, 0.1, 0.175);
  var beardMatrix = new Matrix4(nose.matrix);
  nose.matrix.scale(0.05, 0.08, 0.15);
  nose.renderFast();

  var beard = new Cube();
  //brown color
  beard.color = [0.4, 0.2, 0.1, 1.0];
  beard.matrix = beardMatrix;
  beard.matrix.translate(0, -0.1, -0.02);
  var leftBeardMatrix = new Matrix4(beard.matrix);
  var rightBeardMatrix = new Matrix4(beard.matrix);
  beard.matrix.scale(0.05, 0.08, 0.2);
  beard.renderFast();

  var leftBeard = new Cube();
  //brown color
  leftBeard.color = [0.4, 0.2, 0.1, 1.0];
  leftBeard.matrix = leftBeardMatrix;
  leftBeard.matrix.translate(0, 0, -0.05);
  leftBeard.matrix.scale(0.05, 0.12, 0.05);
  leftBeard.renderFast();

  var rightBeard = new Cube();
  //brown color
  rightBeard.color = [0.4, 0.2, 0.1, 1.0];
  rightBeard.matrix = rightBeardMatrix;
  rightBeard.matrix.translate(0, 0, 0.2);
  rightBeard.matrix.scale(0.05, 0.12, 0.05);
  rightBeard.renderFast();

  var topHair = new Cube();
  //brown color
  topHair.color = [0.4, 0.2, 0.1, 1.0];
  topHair.matrix = topHairMatrix;
  topHair.matrix.translate(-0.005, 0.4, -0.005);
  topHair.matrix.scale(0.51, 0.125, 0.51);
  topHair.renderFast();

  var backHair = new Cube();
  //brown color
  backHair.color = [0.4, 0.2, 0.1, 1.0]
  backHair.matrix = backHairMatrix;
  backHair.matrix.translate(0.255, 0.3, -0.005);
  backHair.matrix.scale(0.25, 0.125, 0.51);
  backHair.renderFast();

  var leftEye = new Cube();
  //white color
  leftEye.color = [1, 1, 1, 1.0]
  leftEye.matrix = leftEyeMatrix;
  leftEye.matrix.translate(-0.01, 0.25, 0.06);
  var pupilMatrix = new Matrix4(leftEye.matrix);
  leftEye.matrix.scale(0.1, 0.05, 0.1);
  leftEye.renderFast();

  var rightEye = new Cube();
  //white color
  rightEye.color = [1, 1, 1, 1.0]
  rightEye.matrix = rightEyeMatrix;
  rightEye.matrix.translate(-0.01, 0.25, 0.34);
  var pupilMatrix2 = new Matrix4(rightEye.matrix);
  rightEye.matrix.scale(0.1, 0.05, 0.1);
  rightEye.renderFast();

  var pupil = new Cube();
  //blue color
  pupil.color = [0.2, 0.6, 0.8, 1.0]
  pupil.matrix = pupilMatrix;
  pupil.matrix.translate(-0.01, -0.001, 0.051);
  pupil.matrix.scale(0.034, 0.055, 0.05);
  pupil.renderFast();

  var pupil2 = new Cube();
  //blue color
  pupil2.color = [0.2, 0.6, 0.8, 1.0]
  pupil2.matrix = pupilMatrix2;
  pupil2.matrix.translate(-0.02, -0.001, -0.001);
  pupil2.matrix.scale(0.03, 0.055, 0.05);
  pupil2.renderFast();

  var body = new Cube();
  //minecraft diamond color
  body.textureNum = 3;
  body.matrix = bodyMatrix;
  body.matrix.translate(0, -0.8, -0.1);
  var leftArmMatrix = new Matrix4(body.matrix);
  var rightArmMatrix = new Matrix4(body.matrix);
  var bottomMatrix = new Matrix4(body.matrix);
  body.matrix.scale(0.5, 0.8, 0.7);
  body.renderFast();

  var leftArm = new Cube();
  leftArm.textureNum = 3;
  leftArm.matrix = leftArmMatrix;
  leftArm.matrix.translate(0.5, 0.55, -0.25);
  leftArm.matrix.rotate(-90, 0, 1, 0);
  var leftHandMatrix = new Matrix4(leftArm.matrix);
  leftArm.matrix.scale(0.25, 0.25, 0.5);
  leftArm.renderFast();

  var leftHand = new Cube();
  leftHand.color = [0.8, 0.6, 0.4, 1.0]
  leftHand.matrix = leftHandMatrix;
  leftHand.matrix.translate(0, -0.6, 0);
  leftHand.matrix.scale(0.25, 0.6, 0.5);
  leftHand.renderFast();

  var rightArm = new Cube();
  rightArm.textureNum = 3;
  rightArm.matrix = rightArmMatrix;
  rightArm.matrix.translate(0, 0.55, 0.95);
  rightArm.matrix.rotate(90, 0, 1, 0);
  var rightHandMatrix = new Matrix4(rightArm.matrix);
  rightArm.matrix.scale(0.25, 0.25, 0.5);
  rightArm.renderFast();

  var rightHand = new Cube();
  rightHand.color = [0.8, 0.6, 0.4, 1.0]
  rightHand.matrix = rightHandMatrix;
  rightHand.matrix.translate(0, -0.6, 0);
  rightHand.matrix.scale(0.25, 0.6, 0.5);
  rightHand.renderFast();

  var pants = new Cube();
  //dark blue color
  pants.color = [0.1, 0.1, 0.5, 1.0]
  pants.matrix = bottomMatrix;
  pants.matrix.translate(0, -0.3, 0);
  var leftLegMatrix = new Matrix4(pants.matrix);
  var rightLegMatrix = new Matrix4(pants.matrix);
  pants.matrix.scale(0.5, 0.3, 0.7);
  pants.renderFast();
  
  var leftLeg = new Cube();
  leftLeg.color = [0.1, 0.1, 0.5, 1.0]
  leftLeg.matrix = leftLegMatrix;
  leftLeg.matrix.translate(0, -0.80, 0);
  var leftShoeMatrix = new Matrix4(leftLeg.matrix);
  leftLeg.matrix.scale(0.5, 0.8, 0.3);
  leftLeg.renderFast();

  var rightLeg = new Cube();
  rightLeg.color = [0.1, 0.1, 0.5, 1.0]
  rightLeg.matrix = rightLegMatrix;
  rightLeg.matrix.translate(0, -0.80, 0.4);
  var rightShoeMatrix = new Matrix4(rightLeg.matrix);
  rightLeg.matrix.scale(0.5, 0.8, 0.3);
  rightLeg.renderFast();

  var leftShoe = new Cube();
  leftShoe.color = [0, 0, 0, 1.0]
  leftShoe.matrix = leftShoeMatrix;
  leftShoe.matrix.translate(0, -0.2, 0);
  leftShoe.matrix.scale(0.5, 0.2, 0.3);
  leftShoe.renderFast();

  var rightShoe = new Cube();
  rightShoe.color = [0, 0, 0, 1.0]
  rightShoe.matrix = rightShoeMatrix;
  rightShoe.matrix.translate(0, -0.2, 0);
  rightShoe.matrix.scale(0.5, 0.2, 0.3);
  rightShoe.renderFast();


}

function renderScene(){
  var projMat = new Matrix4();
  projMat.setPerspective(50, canvas.width / canvas.height, 1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  var viewMat = new Matrix4();
  viewMat.setLookAt(
    camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2],
    camera.at.elements[0], camera.at.elements[1], camera.at.elements[2],
    camera.up.elements[0], camera.up.elements[1], camera.up.elements[2]
  );
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  var globalRotateMat = new Matrix4()
    .rotate(g_globalAngleY, 0, 1, 0)
    .rotate(g_globalAngleX, 1, 0, 0)
    .rotate(g_globalAngle, 0, 1, 0);
  globalRotateMat.translate(-0.2, 0.1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotateMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Add a green floor
  var floor = new Cube();
  floor.color = [0.0, 1.0, 0.0, 1.0]; // Green color
  floor.matrix.translate(-2.0, -0.5, -2.0); // Position the floor below the animal
  floor.matrix.scale(50.0, 0, 50.0); // Scale to make it wide and flat
  floor.textureNum = -2;
  floor.renderFast();

  var sky = new Cube();
  sky.color = [0.0, 0.0, 1.0, 1.0]; // Blue color
  sky.textureNum = 0;
  sky.matrix.translate(-2.0, -1, -2.0); // Position the sky above the animal
  sky.matrix.scale(50.0, 50.0, 50.0); // Scale to make it wide and flat
  sky.renderFast();
  
  // Draw the map
  drawMap();
  drawHouse(12, 0, 4);
  drawPig(10, 0.2, 6);
  drawSteve(10, 1.5, 7);
  drawPig(13, 0.2, 10, 30);
  drawHouse(15, 0, 10);
  drawHouse(20, 0, 18);
  drawPig(17, 0.2, 20, -120);

  drawTree(12, -0.75, 8);

  drawTree(10, -0.75, 10);
  //drawTree(15, -0.5, 12);
  drawTree(20, -0.75, 15);
  drawTree(17, -0.75, 27);

  drawMinecraftFence(4, -0.75, 19);

}