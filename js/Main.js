/*! 
 * @file script.js
 * @author Matthew Smith
 * @email smith_matthew@live.com
 * @date March 15, 2014
 * @ref http://www.script-tutorials.com/twisting-images-webgl/
 * @brief Used the Rotating images tutorial on script-tutorials.com 
 *          as a starting point for the menu system. Very much has
 *          changed. The biggest issue right now is cross origin
 *          security when the html page is run off a desktop.
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
var showMenu = true;
var menuEntries = [];
var videoPlane;
var videoTint;
var showVideo = true; //useful for seeing the outlines when in a non security disabled browser
var selector;
var transitionTimers = [];


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
                            "uniform vec4 uColor;\n"+
                            "void main(void) {\n"+
                            "   gl_FragColor = uColor;\n"+
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
        gl = canvas.getContext("experimental-webgl"); // set up the GL context
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {} // ignore the exception
    if (! gl) {
        alert("Can`t initialise WebGL, not supported"); // webGL isn"t supported in the browser
    }
    //call the init helper functions
    initVideo();
    initMenu();
    initShaders();
    initSelector();

    gl.enable(gl.DEPTH_TEST); //enable depth buffering
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0.5,0.5,0.5,1.0);

    document.onkeydown = handleKeyDown; //set up the keyboard callbacks
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
 * Also sets up the selectorProgram for the Selector and the video tint
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

    // Create the program specialized for the selector and the video tint
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

    selectorProgram.colorUniform = gl.getUniformLocation(selectorProgram, "uColor");

    // Set up the Matrix shaderProgram uniforms
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    selectorProgram.pMatrixUniform = gl.getUniformLocation(selectorProgram, "uPMatrix");
    selectorProgram.mvMatrixUniform = gl.getUniformLocation(selectorProgram, "uMVMatrix");
}

/**
 * Initialize the menu entries with pre-defined images and text.
 * Calls the Texture creation functions to have dynamic names and icons.
 */
function initMenu() {
    var entryNames = ["SETTINGS", "APPS", "MATTHEW", "LIVE TV", "RECORDINGS", "TV SHOWS", "SEARCH"];
    var subEntryNames = [[],["img/netflix.png", "img/youtube.png", "img/facebook.png", "img/twitter.png"],["FAMILY", "ESPIAL","OPTIONS"],["GUIDE", "WHAT'S ON"],
                         ["RECENT", "SETUP"],["POPULAR", "FAVORITES"],["IRON MAN", "SUITS", "NETFLIX", "CLEAR RECENT"]];
    for(var i=0;i<entryNames.length;i++) {
        menuEntries[i] = new MenuEntry(gl, entryNames[i]);
        menuEntries[i].initObjectBuffers(gl);
        menuEntries[i].position = [-3.25+i*1.03,-2,-1.0]; //arbitrary values I had to play with to get right
        menuEntries[i].positionDest = [-3.25+i*1.03,-2,-1.0];

        createMenuEntryTexture(gl, menuEntries[i], icon_sources[i], entryNames[i]); //create the texture with an icon and text

        if(i == selected) {
            menuEntries[i].selected = true;
        }
        for(var j = 0;j<subEntryNames[i].length;j++) {
            var sub = new MenuEntry(gl, subEntryNames[i][j]); //init the sub menu entries and their object buffers
            sub.initObjectBuffers(gl); 

            //Initialize the textures for the menu entries
            if(endsWith(subEntryNames[i][j], ".png")) { //if it ends with png, it is an image
                createSubMenuIconTexture(gl, sub, subEntryNames[i][j]);
                menuEntries[i].addSubEntry(sub, true);
            } else { //otherwise make it a text entry
                createSubMenuTexture(gl, sub, subEntryNames[i][j]);
                menuEntries[i].addSubEntry(sub, false);
            }
        }
    }
}

/**
 * Initialize the Selector object buffers, positions, scale and color.
 */
function initSelector() {
    selector = new Selector(gl);
    selector.initObjectBuffers(gl);
    selector.position = menuEntries[selected].position.slice(0);
    selector.positionDest = menuEntries[selected].position.slice(0);
    selector.scale = menuEntries[selected].scale.slice(0);
    selector.scaleDest = menuEntries[selected].scale.slice(0);
    selector.color = [0.0, 0.7, 0.6, 0.4]; //set the color of the selector (green-blue)
    selector.colorDest = [0.0, 0.7, 0.6, 0.4];
}

/**
 * Initialize the video and the video tint object buffers, positions, etc.
 * Will load a video from a location defined in this function.
 * NOTE: VIDEO NOT IMPLEMENTED, displays static image instead
 */
function initVideo() {
    videoPlane = new VideoPlane(gl);
    videoPlane.initObjectBuffers(gl);
    
    var file = new Image();
    file.crossOrigin = "";
    file.onload = function() {
        videoPlane.handleLoadedTexture(gl, file);
    };
    file.src = "img/rabbit.png";

    //use a selector because they are easy to tint with GLSL
    videoTint = new Selector(gl); 
    videoTint.initObjectBuffers(gl);
    videoTint.position = [-5.0,5.0,-5.0];
    videoTint.positionDest = videoTint.position;
    videoTint.scale =  [10.0,20.0,1.0];
    videoTint.scaleDest = videoTint.scale;
    videoTint.color = [0.0, 0.0, 0.0, 0.7];
    videoTint.colorDest = [0.0, 0.0, 0.0, 0.7];
}

/**
 * function to check if a string ends with a specifed substring
 * @param str The string to check
 * @param suffix The substring to look for
 */
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
    if(showMenu) {
        if (currentlyPressedKeys[38]) { // Up cursor key
            handleUp();
            currentlyPressedKeys[38] = false;
        }
        if (currentlyPressedKeys[40]) { // Down cursor key
            handleDown();
            currentlyPressedKeys[40] = false;
        }
        if (currentlyPressedKeys[37]) { // Left cursor key
            handleLeft();
            currentlyPressedKeys[37] = false;
        }
        if (currentlyPressedKeys[39]) { // Right cursor key
            handleRight();
            currentlyPressedKeys[39] = false;
        }
    }
    if (currentlyPressedKeys[27]) { // Esc key
        showMenu = false; // stop showing the menu
        transitionOut();
        currentlyPressedKeys[27] = false;
    }
    if (currentlyPressedKeys[77]) { // m key
        showMenu = !showMenu; // toggle showing the menu
        var dest =  selector.position.slice(0); 
        subSelected = -1;
        if(showMenu) {
            transitionIn();
        } else {
            transitionOut();
        }
        currentlyPressedKeys[77] = false;
    }
    if(currentlyPressedKeys[192]) { // ` key for disabling the background video and video tint
        showVideo = !showVideo;
        currentlyPressedKeys[192] = false;
    }
}

/**
 * Helper function used for showing the menu after pressing the m key.
 */
function transitionIn() {
    videoTint.colorDest[3]=0.7;
    showMenu = false; //set inactive until it has animated in, this stops the selection from being off
    for(var i=0;i<transitionTimers.length;i++) {
        clearTimeout(transitionTimers[i]);
    }
    transitionTimers[1] = setTimeout(function() { menuEntries[3].positionDest[1]=-2; }, 1);
    transitionTimers[2] = setTimeout(function() { menuEntries[2].positionDest[1]=-2; }, 200);
    transitionTimers[3] = setTimeout(function() { menuEntries[4].positionDest[1]=-2; }, 200);
    transitionTimers[4] = setTimeout(function() { menuEntries[1].positionDest[1]=-2; }, 400);
    transitionTimers[5] = setTimeout(function() { menuEntries[5].positionDest[1]=-2; }, 400);
    transitionTimers[6] = setTimeout(function() { menuEntries[0].positionDest[0]=-3.25+0*1.03;}, 500);
    transitionTimers[7] = setTimeout(function() { menuEntries[6].positionDest[0]=-3.25+6*1.03; }, 500);
    transitionTimers[8] = setTimeout(function() { selector.positionDest[1]=-2; selector.scaleDest=menuEntries[selected].scale.slice(0)}, 700);
    transitionTimers[0] = setTimeout(function() { menuEntries[selected].selected = true; showMenu = true;}, 1000); //bring up the subMenu last so it doesn't catch the entry in movement
            
}

/**
 * Helper function used for hidng the menu after pressing the m or escape key.
 */
function transitionOut() {
    videoTint.colorDest[3]=0.0;
    menuEntries[selected].selected = false; //hide the subMenu as fast as possible
    for(var i=0;i<transitionTimers.length;i++) {
        clearTimeout(transitionTimers[i]);
    }
    transitionTimers[0] = setTimeout(function() { menuEntries[selected].selected = false; }, 0); //hide the subMenu as fast as possible
    transitionTimers[1] = setTimeout(function() { menuEntries[3].positionDest[1]=-6; }, 100);
    transitionTimers[2] = setTimeout(function() { menuEntries[2].positionDest[1]=-6; }, 150);
    transitionTimers[3] = setTimeout(function() { menuEntries[4].positionDest[1]=-6; }, 150);
    transitionTimers[4] = setTimeout(function() { menuEntries[1].positionDest[1]=-6; }, 200);
    transitionTimers[5] = setTimeout(function() { menuEntries[5].positionDest[1]=-6; }, 200);
    transitionTimers[6] = setTimeout(function() { menuEntries[0].positionDest[0]=-7; }, 200);
    transitionTimers[7] = setTimeout(function() { menuEntries[6].positionDest[0]=7; }, 200);
    transitionTimers[8] = setTimeout(function() { selector.positionDest[1]=-6; }, 1);
}

/*
 * Helper for handling key presses (keep the function more readable)
 */
function handleDown() {
    if(subSelected>0 && menuEntries[selected].subEntries.length > 0) {
        subSelected -= 1;
        selector.positionDest = menuEntries[selected].subEntries[subSelected].positionDest.slice(0);
        selector.scaleDest = menuEntries[selected].subEntries[subSelected].scaleDest.slice(0);
    } 
    else if(subSelected==0) {    
        subSelected = -1;        
        selector.positionDest = menuEntries[selected].position.slice(0);
        selector.scaleDest = menuEntries[selected].scale.slice(0);
    }
}

/*
 * Helper for handling key presses (keep the function more readable)
 */
function handleUp() {
    if(subSelected<menuEntries[selected].subEntries.length-1 && menuEntries[selected].subEntries.length > 0) {
        subSelected += 1;
        selector.scaleDest = menuEntries[selected].subEntries[subSelected].scaleDest.slice(0);
    } 
}

/*
 * Helper for handling key presses (keep the function more readable)
 */
function handleLeft() {
    if(selected>0) {
        menuEntries[selected].selected = false;
        selected -= 1;
        subSelected=-1;
        selector.scaleDest = menuEntries[selected].scale.slice(0);
        menuEntries[selected].selected = true;

        for(var i=selected+1; i<menuEntries.length; i++) {//bounce the left entries a bit
            bounce(i, -0.4);
        }
        bounce(selected,0.1);//the newly selected entry a little bit
        for(var i=selected-1; i>=0; i--) {//the previously selected entry and each one after it a lot
            bounce(i, 0.2);
        }
    } 
}

/*
 * Helper for handling key presses (keep the function more readable)
 */
function handleRight() {
    if(selected<menuEntries.length-1) {
        menuEntries[selected].selected = false;
        selected += 1;
        subSelected=-1;
        selector.scaleDest = menuEntries[selected].scale.slice(0);
        menuEntries[selected].selected = true;
        
        for(var i=selected+1; i<menuEntries.length; i++) { //bounce the right entries a bit
            bounce(i, -0.2);
        }
        bounce(selected, -0.1); //the newly selected entry a little bit
        for(var i=selected-1; i>=0; i--) { //the previously selected entry and each one after it a lot
            bounce(i, 0.4);
        }
    } 
}

/**
 * Helper function pushes the menu entry at i value amount and sets a timer to bring it back again
 * @param i The index of the menu entry to bounce
 * @param value The amount to bounce the entry
 */
function bounce(i, value) {
        menuEntries[i].positionDest[0] += -value;
        setTimeout(function() { menuEntries[i].positionDest[0] +=value; }, 200);
}

/**
 * Calls the draw functions on each drawable object. also clears the buffers and sets the projection matrix
 */
function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(shaderProgram); //reset the regular shader for use
    mat4.ortho(pMatrix, -5, 5, -3.375, 3.375, -1, 100); //orthogonal view makes sense for menus

    if(showVideo) {
        videoPlane.draw(gl, shaderProgram, pMatrix, mvMatrix); 
    }
    for (var i=0;i<menuEntries.length;i++) { 
        menuEntries[i].draw(gl, shaderProgram, pMatrix, mvMatrix);
    }
    gl.useProgram(selectorProgram); //use the different shader for the selector items as they have no textures
    if(showVideo) {
        videoTint.draw(gl, selectorProgram, pMatrix, mvMatrix);
    }
    selector.draw(gl, selectorProgram, pMatrix, mvMatrix); 
}

/**
 * Used for updating the position of every value in the scene while animating between selections.
 */
function animate() {
    var timeNow = new Date().getTime();
    if (previousTime != 0) {
        var elapsed = timeNow - previousTime;
        for (var i=0;i<menuEntries.length;i++) { //call each menu entry's animate
            menuEntries[i].animate(elapsed);
        }
        if(showMenu) { //only update positions every frame if the menu is showing.
            if (subSelected == -1) { //non sub-menu item, lock both x and y to meny entry
                selector.position[0] = menuEntries[selected].position[0];
                selector.positionDest[0] = menuEntries[selected].position[0];
                selector.position[1] = menuEntries[selected].positionDest[1];
                selector.positionDest[1] = menuEntries[selected].position[1];
                selector.scaleDest = menuEntries[selected].scaleDest.slice(0);
            } else { //sub-menu entry, no need to lock in y direction
                selector.positionDest[0] = menuEntries[selected].subEntries[subSelected].position[0];
                selector.positionDest[1] = menuEntries[selected].subEntries[subSelected].position[1];
                selector.scaleDest = menuEntries[selected].subEntries[subSelected].scaleDest.slice(0);
            }
        }
        selector.animate(elapsed); //animate the selector between its destinations
        videoTint.animate(elapsed); //animate the darkening of the video
        //videoPlane.animate(elapsed);
    }
    previousTime = timeNow;
}

/**
 * Draw the scene, the function calls helper methods to handle key presses, drawing and animating.
 * requests animation frames from the window
 */
function drawFrame() {
    handleKeys();
    drawScene();
    animate();
    window.requestAnimationFrame(drawFrame); //tells browser about the animation we will perform
}

/**
 * Linear interpolation method for moving between two vectors. pos and dest must be the same to work
 * @param pos[in|out] Used for calculating its current position and the increment to the destination
 * @param dest Used for calculating where to go from the current position
 * @param time Used for calculating how much to move
 */
function lerp(pos, dest, time) {
    if(pos.length !== dest.length) { return; }
    for(var i=0; i<pos.length; i++) { //interpolate for each vector item
        pos[i] = pos[i] + time * (dest[i] - pos[i]);
    }
}
