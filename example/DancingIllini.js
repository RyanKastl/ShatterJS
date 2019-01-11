/**
 * @file Animation for an Illini Victory badge, modified from Hello Circle lab.
 * @author Eric Shaffer <shaffer1@illinois.edu> - Original Hello Circle file.
 * @author Ryan Kastl <rmkastl2@illinois.edu> - Modified for Dancing Badge MP
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The WebGL buffer holding the triangle */
var vertexPositionBuffer;

/** @global The WebGL buffer holding the vertex colors */
var vertexColorBuffer;

/** @global The Modelview matrix */
var mvMatrix = mat4.create();

/** @global The Projection matrix */
var pMatrix = mat4.create();

/** @global Current frame position */
var framePos = 0;

/** @global Two times pi to save some multiplications...*/
var twicePi=2.0*3.14159;

var triangleList = [];

/** @global Base Triangle Mesh */
var baseTriangle = {vertices: [-0.5, 0.0, 0.0,
                    0.5, 0.0, 0.0,
                    0.0, 0.5, 0.0]};
    
//----------------------------------------------------------------------------------
/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
}

/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}


/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

/**
 * Setup the fragment and vertex shaders
 */
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
}

function breakTriangle(triangle, n) {
    if (n == 0) {
        triangleList.push(triangle);
    }

    var maxX = -1.0;
    var minX = 1.0;
    var maxY = -1.0;
    var minY = 1.0;

    for (var i = 0; i < triangle.vertices.length; i += 3) {
        if (triangle.vertices[i] > maxX) {
            maxX = triangle.vertices[i];
        }
        if (triangle.vertices[i] < minX) {
            minX = triangle.vertices[i];
        }
        if (triangle.vertices[i + 1] > maxY) {
            maxY = triangle.vertices[i + 1];
        }
        if (triangle.vertices[i + 1] < minY) {
            minY = triangle.vertices[i + 1];
        }
    }

    var halfX = (maxX + minX) / 2;
    var halfY = (maxY + minY) / 2;

    for (var i = 0; i < 3; i++) {
        var newVerts = [triangle.vertices[3*i], triangle.vertices[3*i + 1], 0.0,
                        triangle.vertices[(3 * (i + 1)) % 9], triangle.vertices[((3 * (i + 1)) % 9) + 1], 0.0,
                        halfX, halfY, 0.0];
        var newTriangle = {vertices: newVerts};
        breakTriangle(newTriangle, n - 1);
    }
}

/**
 * Populate vertex buffer with data
 */
function loadVertices() {
  //console.log("Frame",framePos);
  //Generate the vertex positions    
  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    
  var triangleVertices = [];
  if (framePos == 0) {
    triangleList = [baseTriangle];
  }
  for (var i = 0; i < triangleList.length; i++) {
    for (var j = 0; j < triangleList[i].vertices.length; j++) {
        triangleVertices.push(triangleList[i].vertices[j])
    }
  }


  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.DYNAMIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = triangleVertices.length / 3;
}

/**
  Deform coordinates of a vertex with a sine wave.
  @param {float} x coordinate of the vertex
  @param {float} y coordinate of the vertex
  @return {Object} contains x and y offsets
*/
function deformSin(x,y) {
    var deformPt = vec2.fromValues(x,y);
    var dist = 0.2*Math.sin(degToRad(framePos));
    vec2.normalize(deformPt, deformPt);
    vec2.scale(deformPt, deformPt, dist);
    return deformPt;
}

/**
 * Populate color buffer with data
 */
function loadColors() {
  vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    
  var colors = [];
  
  // Dark blue for the top part of the badge
  for (i=0;i<=53;i++){
      colors.push(0.0);
      colors.push(0.0);
      colors.push(0.4);
      colors.push(1.0);
  }

  // Orange for the bottom stripes
  for (i=0;i<=53;i++){
      colors.push(0.8);
      colors.push(0.4);
      colors.push(0);
      colors.push(1.0);
  }
    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numItems = colors.length / 4;  
}
/**
 * Populate buffers with data
 */
function setupBuffers() {
    
  //Generate the vertex positions    
  loadVertices();

  //Generate the vertex colors
  loadColors();
}

/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 

  mat4.identity(mvMatrix);
  mat4.identity(pMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
}

/**
 * Animation to be called from tick. Updates globals and performs animation for each tick.
 */
function animate() { 
    framePos= (framePos+1.0) % 360;
    loadVertices();
}

/**
 * Startup function called from html code to start program.
 */
 function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders(); 
  setupBuffers();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

/**
 * Tick called for every animation frame.
 */
function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
}

