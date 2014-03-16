/*! 
 * @file script.js
 * @author Matthew Smith
 * @date March 15, 2014
 * @ref http://www.script-tutorials.com/twisting-images-webgl/
 * @brief Used the Rotating images tutorial on script-tutorials.com 
 *          as a starting point for a tile based menu system
 */

var gl; // global WebGL object
var shaderProgram;
var selectorProgram;

var icon_sources = ["img/settings.png", "img/apps.png", "img/Home.png", "img/Live_TV.png", "img/recorded.png", "img/on_demand.png", "img/search.png"]; //the pictures to load
var selected = 3; /// Used for keeping track of which pane is currently selected
var subSelected = -1;
var animating = 1.0; /// Used for keeping track of the animation between the selection
var currentlyPressedKeys = {};
var pMatrix = mat4.create();
var mvMatrix = mat4.create();
var previousTime = 0;
var showMenu = false;
var menuEntries = [];
var selector;


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
                    "   gl_FragColor = texture2D(uSampler, vTextureCoord.st);\n"+
                    "}\n";

// The Vertex shader to use for the selector
var selectorVertShader =    "attribute vec3 aVertexPosition;\n"+
                            "uniform mat4 uMVMatrix;\n"+
                            "uniform mat4 uPMatrix;\n"+
                            "void main(void) {\n"+
                            "    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n"+
                            "}\n";

// The fragment shader to use for the selector 
var selectorFragShader =    "#ifdef GL_ES\n"+
                            "precision highp float;\n"+
                            "#endif\n"+
                            "void main(void) {\n"+
                            "   gl_FragColor = vec4(0.0, 0.7, 0.6, 0.4);\n"+
                            "}\n";

/**
 * Initialize the WebGL context and resources.
 * Makes use of helper functions to init resources.
 */
function initWebGl() {
    var canvas = document.getElementById("panel");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;   
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {} // ignore the exception
    if (! gl) {
        alert("Can`t initialise WebGL, not supported"); // webGL isn"t supported in the browser
    }
    initMenu();
    initShaders();
    selector = new Selector(gl);
    selector.initObjectBuffers(gl);
    selector.position = menuEntries[selected].position.slice(0);
    selector.positionDest = menuEntries[selected].position.slice(0);
    selector.scale = menuEntries[selected].scale.slice(0);
    selector.scaleDest = menuEntries[selected].scale.slice(0);

    gl.enable(gl.DEPTH_TEST); //enable depth buffering
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0.1,0.1,0.1,1.0)
    //gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    document.onkeydown = handleKeyDown; //set up the keyboard callback
    document.onkeyup = handleKeyUp;

    drawFrame(); //draw the first frame
}

/**
 * Creates and compiles the fragment shader from the variable fragShader
 * @param gl the WebGL context to create the shader in.
 * @param type The type of shader to create eg. gl.FRAGMENT_SHADER || gl.VERTEX_SHADER
 * @param source The String source of the shader
 * @return the compiled shader
 */
function getShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
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
    var fragmentShader = getShader(gl, gl.FRAGMENT_SHADER, fragShader);
    var vertexShader = getShader(gl, gl.VERTEX_SHADER, vertShader);

    var selectorVS = getShader(gl, gl.VERTEX_SHADER, selectorVertShader);
    var selectorFS = getShader(gl, gl.FRAGMENT_SHADER, selectorFragShader);

    // Create the shaderProgram, attach the compiled shaders and link the program
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    selectorProgram = gl.createProgram();
    gl.attachShader(selectorProgram, selectorVS);
    gl.attachShader(selectorProgram, selectorFS);
    gl.linkProgram(selectorProgram);


    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Can't initialise shaders");
    }
    
    // Tell the GL context to use the shaderProgram
    gl.useProgram(shaderProgram);


    // Set up the Vertex shaderProgram attributes
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    selectorProgram.vertexPositionAttribute = gl.getAttribLocation(selectorProgram, "aVertexPosition");
    gl.enableVertexAttribArray(selectorProgram.vertexPositionAttribute);

    // Set up the Texture shaderProgram attributes and uniform
    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");

    // Set up the Matrix shaderProgram uniforms
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    selectorProgram.pMatrixUniform = gl.getUniformLocation(selectorProgram, "uPMatrix");
    selectorProgram.mvMatrixUniform = gl.getUniformLocation(selectorProgram, "uMVMatrix");
}

function initMenu() {
    var entryNames = ["SETTINGS", "APPS", "GEORGE", "LIVE TV", "RECORDINGS", "TV SHOWS", "SEARCH"];
    var subEntryNames = [[],["img/netflix.png", "img/youtube.png"],["FAMILY", "SOPHIE","OPTIONS"],["GUIDE", "WHAT'S ON"],
                         ["RECENT", "SETUP"],["POPULAR", "FAVORITES"],["IRON MAN", "SUITS", "NETFLIX", "CLEAR RECENT"]];
    for(var i=0;i<entryNames.length;i++) {
        menuEntries[i] = new MenuEntry(gl, entryNames[i]);
        menuEntries[i].initObjectBuffers(gl);
        menuEntries[i].position = [-3.25+i*1.03,-3,-1.0];

        createMenuEntryTexture(gl, menuEntries[i], icon_sources[i], entryNames[i]); 

        if(i == selected) {
            menuEntries[i].selected = true;
        }
        for(var j = 0;j<subEntryNames[i].length;j++) {
            var sub = new MenuEntry(gl, subEntryNames[i][j]);
            sub.initObjectBuffers(gl);
            if(endsWith(subEntryNames[i][j], ".png")) {
                createSubMenuIconTexture(gl, sub, subEntryNames[i][j]);
                menuEntries[i].addSubEntry(sub, true);
            } else {
                createSubMenuTexture(gl, sub, subEntryNames[i][j]);
                menuEntries[i].addSubEntry(sub, false);
            }
        }
    }
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
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
 * Check all of the buttons pressed and perform operations if they are pressed.
 * These are the deferred tasks from the key handle callbacks.
 */
function handleKeys() {
    if (currentlyPressedKeys[37]) { // Left cursor key
        if(selected>0) {
            menuEntries[selected].selected = false;
            selected -= 1;
            subSelected=-1;
            selector.positionDest = menuEntries[selected].position.slice(0);
            selector.position = menuEntries[selected].position.slice(0);
            selector.scaleDest = menuEntries[selected].scale.slice(0);
            menuEntries[selected].selected = true;
        } 
        currentlyPressedKeys[37] = false; // to ensure only one button press happens
    }
    if (currentlyPressedKeys[39]) { // Right cursor key
        if(selected<menuEntries.length-1) {
            menuEntries[selected].selected = false;
            selected += 1;
            subSelected=-1;
            selector.positionDest = menuEntries[selected].position.slice(0);
            selector.position = menuEntries[selected].position.slice(0);
            selector.scaleDest = menuEntries[selected].scale.slice(0);
            menuEntries[selected].selected = true;
        } 
        currentlyPressedKeys[39] = false;
    }
    if (currentlyPressedKeys[38]) { // Up cursor key
        if(subSelected<menuEntries[selected].subEntries.length-1 && menuEntries[selected].subEntries.length > 0) {
            subSelected += 1;
            selector.positionDest = menuEntries[selected].subEntries[subSelected].position.slice(0);
            selector.scaleDest = menuEntries[selected].subEntries[subSelected].scale.slice(0);
        } 
        currentlyPressedKeys[38] = false;
    }
    if (currentlyPressedKeys[40]) { // Down cursor key
        if(subSelected>0 && menuEntries[selected].subEntries.length > 0) {
            subSelected -= 1;
            selector.positionDest = menuEntries[selected].subEntries[subSelected].position.slice(0);
            selector.scaleDest = menuEntries[selected].subEntries[subSelected].scale.slice(0);
        } 
        else if(subSelected==0) {    
            subSelected = -1;        
            selector.positionDest = menuEntries[selected].position.slice(0);
            selector.scaleDest = menuEntries[selected].scale.slice(0);
        }
        currentlyPressedKeys[40] = false;
    }
    if (currentlyPressedKeys[13]) { // Enter key
        showMenu = false; // stop showing the menu
        currentlyPressedKeys[13] = false;
    }
    if (currentlyPressedKeys[27]) { // Enter key
        showMenu = false; // stop showing the menu
        currentlyPressedKeys[27] = false;
    }
    if (currentlyPressedKeys[77]) { // m key key
        showMenu = !showMenu; // toggle showing the menu
        currentlyPressedKeys[77] = false;
    }
}

/**
 *
 */
function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(shaderProgram);
    mat4.ortho(pMatrix, -5, 5, -5, 5, -1, 100);

    if(showMenu) {
        for (var i=0;i<menuEntries.length;i++) { 
            menuEntries[i].draw(gl, shaderProgram, pMatrix, mvMatrix);
        }
        gl.useProgram(selectorProgram);
        selector.draw(gl, selectorProgram, pMatrix, mvMatrix);   
    }
    
}

/**
 * Used for updating the position of the scene while animating between selections.
 */
function animate() {
    var timeNow = new Date().getTime();
    if (previousTime != 0) {
        var elapsed = timeNow - previousTime;
        for (var i=0;i<menuEntries.length;i++) {
            menuEntries[i].animate(elapsed);
        }
        selector.animate(elapsed);
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

