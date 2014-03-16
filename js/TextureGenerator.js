/*! 
 * @file TextureGenerator.js
 * @author Matthew Smith
 * @date March 15, 2014
 * @brief Helper functions for generating GL textures from canvas elements
 */

//easier to access variables to change how the textures are drawn
var backgroundColor = "#555555" 
var fontColor = "#FFFFFF"

/**
 * Creates an image only icon from the passed source using the textureCanvas element.
 * @param gl The webGL context to create the texture in
 * @param menuItem The menuItem to add the texture to
 * @param iconSrc The source of the icon to use in the texture
 */
function createSubMenuIconTexture(gl, menuItem, iconSrc) {
	var canvas = document.createElement("canvas");
	canvas.style.cssText = "display:none;";
	var context = canvas.getContext("2d");
	canvas.width = 55;
	canvas.height = 55;
	context.fillStyle = backgroundColor;
	context.fillRect(0, 0, canvas.width, canvas.height);

	var file = new Image();
	file.onload = function() { //load the image then draw and load it into the menu item
		context.drawImage(file, canvas.width/2-file.width/2,canvas.height/2-file.height/2);
		menuItem.handleLoadedTexture(gl, canvas);
	};
	file.src = iconSrc;
}

/**
 * Creates a text only icon from the passed text using the textureCanvas element. 
 * @param gl The webGL context to create the texture in
 * @param text The text to draw on the texture
 */
function createSubMenuTexture(gl, menuItem, text) {
	var canvas = document.createElement("canvas");
	canvas.style.cssText = "display:none;";
	var context = canvas.getContext("2d");

	canvas.width = 240;
	canvas.height = 60;
	context.fillStyle = backgroundColor;
	context.fillRect(0, 0, canvas.width, canvas.height);

	context.fillStyle = fontColor;
	context.textAlign = "center";
	context.textBaseline = "middle";	
	var fontSize = 28;
	context.font = "bold "+fontSize+"px monospace";	// This determines the size of the text and the font family used

	context.fillText(text, canvas.width/2,canvas.height/2); //write the text to the canvas

	//no need to wait for any pictures, use the canvas as a texture right away
	menuItem.handleLoadedTexture(gl, canvas); 
}

/**
 * Creates a menu icon from the passed source and text using the textureCanvas element.
 * @param gl The webGL context to create the texture in
 * @param iconSrc The source of the icon to use in the texture 
 * @param text The text to draw on the texture
 */
function createMenuEntryTexture(gl, menuItem, iconSrc, text) {
	var canvas = document.createElement("canvas");
	canvas.style.cssText = "display:none;";

	var context = canvas.getContext("2d");

	canvas.width = 240;
	canvas.height = 180;
	context.fillStyle = backgroundColor;
	context.fillRect(0, 0, canvas.width, canvas.height);
	
	context.fillStyle = fontColor;
	context.textAlign = "center";
	context.textBaseline = "bottom";
	var fontSize = 28;
	context.font = "bold "+fontSize+"px monospace";

	context.fillText(text, canvas.width/2,canvas.height-fontSize/2);

	var file = new Image();
	file.crossOrigin = "";
	file.onload = function() {//load the image then draw and load it into the menu item
		context.drawImage(file, canvas.width/2-file.width, 
							canvas.height/2-file.height*1.5, file.width*2, file.height*2);
		menuItem.handleLoadedTexture(gl, canvas);
	};
	file.src = iconSrc;
}