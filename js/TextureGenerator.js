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
	context.fillStyle = "#777777"
	context.fillRect(0, 0, canvas.width, canvas.height);

	var file = new Image();
	file.onload = function() {
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

	canvas.width = 120;
	canvas.height = 30;
	context.fillStyle = "#777777"
	context.fillRect(0, 0, canvas.width, canvas.height);

	context.fillStyle = "#FFFFFF"; 	// This determines the text colour, it can take a hex value or rgba value (e.g. rgba(255,0,0,0.5))
	context.textAlign = "center";	// This determines the alignment of text, e.g. left, center, right
	context.textBaseline = "middle";	// This determines the baseline of the text, e.g. top, middle, bottom
	var fontSize = 14;
	context.font = "bold "+fontSize+"px monospace";	// This determines the size of the text and the font family used

	context.fillText(text, canvas.width/2,canvas.height/2);

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

	canvas.width = 120;
	canvas.height = 90;
	context.fillStyle = "#777777"
	context.fillRect(0, 0, canvas.width, canvas.height);
	
	context.fillStyle = "#FFFFFF";
	context.textAlign = "center";
	context.textBaseline = "bottom";
	var fontSize = 16;
	context.font = "bold "+fontSize+"px monospace";

	context.fillText(text, canvas.width/2,canvas.height-fontSize/2);

	var file = new Image();
	file.crossOrigin = "";
	file.onload = function() {
		context.drawImage(file, canvas.width/2-file.width/2,canvas.height/2-file.height*3/4);
		menuItem.handleLoadedTexture(gl, canvas);
	};
	file.src = iconSrc;
}