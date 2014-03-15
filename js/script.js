/*! 
 * @file script.js
 * @author Matthew Smith
 * @date March 15, 2014
 * @ref http://www.script-tutorials.com/twisting-images-webgl/
 * @brief Used the Rotating images tutorial on script-tutorials.com 
 */

var gl; // global WebGL object
var shaderProgram;

var picture_names = ["img/settings.png", "img/apps.png", "img/Home.png", "img/Live_TV.png", "img/recorded.png", "img/on_demand.png", "img/search.png"]; //the pictures to load
var num_pictures = picture_names.length;
var selected = 1.0; /// Used for keeping track of which pane is currently selected
var animating = 1.0; /// Used for keeping track of the animation between the selection
var loadedTextures = Array();
var objVertexPositionBuffer = new Array();
var objVertexTextureCoordBuffer = new Array();
var objVertexIndexBuffer = new Array();
var currentlyPressedKeys = {};
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var previousTime = 0;
var MoveMatrix = mat4.create();
mat4.identity(MoveMatrix);
var showVideo = false;
var settings;
var menuEntries = [];


// The Vertex shader to use
var vertShader =    "attribute vec3 aVertexPosition;\n"+
                    "attribute vec2 aTextureCoord;\n"+
                    "uniform mat4 uMVMatrix;\n"+
                    "uniform mat4 uPMatrix;\n"+
                    "varying vec2 vTextureCoord;\n"+
                    "void main(void) {\n"+
                    "    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n"+
                    "    vTextureCoord = aTextureCoord;\n"+
                    "}\n";

// The fragment shader to use
var fragShader =    "#ifdef GL_ES\n"+
                    "precision highp float;\n"+
                    "#endif\n"+
                    "varying vec2 vTextureCoord;\n"+
                    "uniform sampler2D uSampler;\n"+
                    "void main(void) {\n"+
                    "    gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n"+
                    "}\n";

/**
 * Initialize the WebGL context and resources.
 * Makes use of helper functions to init resources.
 */
function initWebGl() {
    var canvas = document.getElementById('panel');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;   
    try {
        gl = canvas.getContext('experimental-webgl');
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {} // ignore the exception
    if (! gl) {
        alert('Can`t initialise WebGL, not supported'); // webGL isn't supported in the browser
    }
    settings = new MenuEntry(gl, "Settings")
    settings.initObjectBuffers(gl);
    initShaders();
    initObjBuffers();
    initTextures();

    gl.enable(gl.DEPTH_TEST); //enable depth buffering
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    //gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    document.onkeydown = handleKeyDown; //set up the keyboard callback
    document.onkeyup = handleKeyUp;

    drawFrame(); //draw the first frame
}

/**
 * Creates and compiles the vertex shader from the variable vertShader
 * @param gl the WebGL context to create the shader in.
 * @return the compiled vertex shader
 */
function getVertShader(gl) {
    var shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(shader, vertShader);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

/**
 * Creates and compiles the fragment shader from the variable fragShader
 * @param gl the WebGL context to create the shader in.
 * @return the compiled fragment shader
 */
function getFragShader(gl) {
    var shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(shader, fragShader);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

/**
 * Initialize and compile the shaders and create the shader program
 * with the compiled shaders.
 * Sets up pMatrixUniform, mvMatrixUniform and samplerUniform parameters 
 * of the shaderProgram object to the associated values in the compiled shader.
 */
function initShaders() {
    // Create and compile the Shaders
    var fragmentShader = getFragShader(gl);
    var vertexShader = getVertShader(gl);

    // Create the shaderProgram, attach the compiled shaders and link the program
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Can`t initialise shaders');
    }
    
    // Tell the GL context to use the shaderProgram
    gl.useProgram(shaderProgram);

    // Set up the Vertex shaderProgram parameters
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    // Set up the Texture shaderProgram Parameters
    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, 'aTextureCoord');
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, 'uSampler');

    // Set up the Matrix shaderProgram parameters
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, 'uPMatrix');
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, 'uMVMatrix');
}

/**
 *
 */
function initObjBuffers() {
    for (var i=0;i<num_pictures;i++) { 
        objVertexPositionBuffer[i] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, objVertexPositionBuffer[i]);
        vertices = [
            -0.5, -0.385, 0.0,
            -0.5, 0.385, 0.0,
            0.5, 0.385, 0.0,
            0.5, -0.385, 0.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        objVertexPositionBuffer[i].itemSize = 3; 
        objVertexPositionBuffer[i].numItems = 4;

        objVertexTextureCoordBuffer[i] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,  objVertexTextureCoordBuffer[i] );
        var textureCoords = [
            0.0, 0.0,
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
        objVertexTextureCoordBuffer[i].itemSize = 2;
        objVertexTextureCoordBuffer[i].numItems = 4;

        objVertexIndexBuffer[i] = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objVertexIndexBuffer[i]);
        var objVertexIndices = [
            0, 1, 2,
            0, 2, 3,
        ];
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(objVertexIndices), gl.STATIC_DRAW);
        objVertexIndexBuffer[i].itemSize = 1;
        objVertexIndexBuffer[i].numItems = 6;
    }
}

/**
 * 
 */
function handleLoadedTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

/** 
 * This is a helper function to initialize a GL texture from the passed source.
 * It sets up a callback to handleLoadedTexture for when the image is fully loaded.
 * @param imageSource a String reference of the source of the image.
 * @return The initialized GL texture
 */
function initTexture(imageSource) {
    var img = new Image();
    var texture = gl.createTexture();
    texture.image = img;
    img.src = imageSource;

    // Set up callback when the texture completes loading
    img.onload = function () {
        handleLoadedTexture(texture)
    }
    return texture;
}

/** 
 * This is a helper function to initialize a GL texture from the passed source.
 * It sets up a callback to handleLoadedTexture for when the image is fully loaded.
 * @param imageSource a String reference of the source of the image.
 * @return The initialized GL texture
 */
function initMenuTexture(menuItem, imageSource) {
    var img = new Image();
    var texture = gl.createTexture();
    texture.image = img;
    img.src = imageSource;

    // Set up callback when the texture completes loading
    img.onload = function () {
        menuItem.handleLoadedTexture(gl, texture);
    }
}

/**
 * Calls initTexture for all the pictures in picture_names.
 * Stores the Initialized textures into loadedTextures[]
 */
function initTextures() {
    initMenuTexture(settings, picture_names[0]);
    for (var i=0; i < num_pictures; i++) {
        loadedTextures[i]=initTexture(picture_names[i]);
    }
}

/**
 * 
 */
function setMatrixUniforms(p, mv) {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, p);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mv);
}

/**
 * Helper Function for converting degrees to radians for GL
 */
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * Callback for when a key is pressed.
 * Sets the pressed key to true in the array
 * to defer the events to the next render cycle.
 */
function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
}

/**
 * Callback for when a key is released.
 * Sets the pressed key to false in the array.
 */
function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}

/**
 * Check all the buttons pressed and perform operations if they are pressed.
 * These are the deferred tasks from the key handle callbacks.
 */
function handleKeys() {
    if (currentlyPressedKeys[37]) { // Left cursor key
        selected -= 1;
        currentlyPressedKeys[37] = false; // to ensure only one button press happens
    }
    if (currentlyPressedKeys[39]) { // Right cursor key
        selected += 1;
        currentlyPressedKeys[39] = false;
    }
    if (currentlyPressedKeys[38]) { // Up cursor key
        currentlyPressedKeys[38] = false;
    }
    if (currentlyPressedKeys[40]) { // Down cursor key
        currentlyPressedKeys[40] = false;
    }
    if (currentlyPressedKeys[13]) { // Enter key
        //alert("Enter Pressed");
        currentlyPressedKeys[13] = false;
    }
    if (currentlyPressedKeys[27]) { // Enter key
        //alert("Esc Pressed");
        showVideo = !showVideo; // toggle showing the video
        currentlyPressedKeys[27] = false;
    }
}

/**
 *
 */
function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(pMatrix, degToRad(150), 1280/720, 0.1, 100.0);

    //if(showVideo) {
        //var canvas = document.getElementById('panel');
        //var video = document.getElementById('vid');
        //canvas.drawImage(video,0,0,300,300);
    //}
 
    for (var i=0;i<num_pictures;i++) { 

        mat4.identity(mvMatrix);

        //calculate the position of each pane
        var x = (-4)+i;
        var y = -4;
        var z = -1.5;

        mat4.scale(mvMatrix, mvMatrix, [0.1,0.1,0.1]);

        mat4.translate(mvMatrix, mvMatrix, [x, y, z]);
        

        mat4.multiply(mvMatrix, mvMatrix, MoveMatrix);
       
        gl.bindBuffer(gl.ARRAY_BUFFER, objVertexPositionBuffer[i]);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, objVertexPositionBuffer[i].itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, objVertexTextureCoordBuffer[i]);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, objVertexTextureCoordBuffer[i].itemSize, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, loadedTextures[i]);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objVertexIndexBuffer[i]);
        setMatrixUniforms(pMatrix, mvMatrix);
        gl.drawElements(gl.TRIANGLES, objVertexIndexBuffer[i].numItems, gl.UNSIGNED_SHORT, 0);
        
    }
    settings.draw(gl, shaderProgram, pMatrix);
}

function drawMetaData() {
    
}

/**
 * Used for updating the position of the scene while animating between selections.
 */
function animate() {
    var timeNow = new Date().getTime();
    if (previousTime != 0) {
        var elapsed = timeNow - previousTime;
        if(animating.toFixed(3)-selected.toFixed(3) > 0.005) {
            animating-=0.02;
        } else if(animating.toFixed(3)-selected.toFixed(3) < -0.005) {
            animating+=0.02;
        }
    }
    previousTime = timeNow;
}

/**
 * Draw the scene, the function calls helper methods to handle key presses, drawing and animating.
 */
function drawFrame() {
    handleKeys();
    drawScene();
    animate();
    window.requestAnimationFrame(drawFrame); //tells browser about the animation we will perform
}

