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
var baseTriangle = {vertices: [[-0.5, 0.0, 0.0],
                    [0.5, 0.0, 0.0],
                    [0.0, 0.5, 0.0]]};

var triangleVertices = [];
    
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

function vertexDistance(x, y) {
	return (Math.sqrt(Math.pow(x[0] - y[0], 2) + Math.pow(x[1] - y[1], 2) + Math.pow(x[2] - y[2], 2)));
}

function findMid(x, y) {
	var mid = [];

	for (var i = 0; i < x.length; i++) {
		mid.push((x[i] + y[i]) / 2);
	}
	return mid;
}

function getVertex(list, n) {
	var index = n*3;

	return [list[index], list[index+1], list[index+2]];
}

function breakTriangle(triangle, n) {
    if (n == 0) {
        triangleList.push(triangle);
        return;
    }

    var v1 = triangle.vertices[0];
    var v2 = triangle.vertices[1];
    var v3 = triangle.vertices[2];

    var verts = [v1, v2, v3];

    var maxDistance = 0;
    var vertex1 = [0,0,0];
    var vertex2 = [0,0,0];
    var vertexEnd = [0,0,0];

    for (var i = 0; i < verts.length; i++) {
    	var distance = vertexDistance(verts[i], verts[(i+1) % verts.length]);
    	if (distance > maxDistance) {
    		maxDistance = distance;
    		vertex1 = verts[i];
    		vertex2 = verts[(i+1) % verts.length];
    		vertexEnd = verts[(i+2) % verts.length];
    	}
    }

    var vertexStart = findMid(vertex1, vertex2);

    var newVerts1 = [vertex1, vertexStart, vertexEnd];
    var newVerts2 = [vertex2, vertexStart, vertexEnd];

    var newTriangle1 = {vertices: newVerts1};
    var newTriangle2 = {vertices: newVerts2};

    breakTriangle(newTriangle1, n - 1);
    breakTriangle(newTriangle2, n - 1);
}

/**
 * Populate vertex buffer with data
 */
function loadVertices() {
  //console.log("Frame",framePos);
  //Generate the vertex positions    
  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    
  triangleVertices = [];
  // if (framePos == 0) {
  //   triangleList = [baseTriangle];
  // }

  triangleList = [];
  breakTriangle(baseTriangle, 9);
  for (var i = 0; i < triangleList.length; i++) {
    for (var j = 0; j < triangleList[i].vertices.length; j++) {
    	var vert = triangleList[i].vertices[j];
        for (var k = 0; k < vert.length; k++) {
        	triangleVertices.push(vert[k]);
        }
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
	for (i=0;i<=triangleVertices.length;i+=3){
		var r = Math.random();
		var g = Math.random();
		var b = Math.random();

		for (var j = 0; j < 3; j++) {
			colors.push(r);
		    colors.push(g);
		    colors.push(b);
		    colors.push(1.0);
		}
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

