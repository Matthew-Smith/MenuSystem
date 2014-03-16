/*! 
 * @file MenuEntry.js
 * @author Matthew Smith
 * @date March 15, 2014
 * @brief Used for keeping track of and displaying menu entries 
 */

function MenuEntry(gl, entryName) {
	this.texture = gl.createTexture();
	this.selected = false;
    var prevSelected = false;
	this.name = entryName;
	this.subEntries = [];
    var iconType;

    //The "physical" properties of the menu entry
    //Dest attributes are used for translating the entry from its current position to another
	this.scale = [1.0, 1.0, 1.0];
	this.position = [0, 0, 0];
    this.positionDest = [0, 0, 0]; 
    this.scaleDest = [1.0, 1.0, 1.0];

	this.objVertexPositionBuffer;
	this.objVertexTextureCoordBuffer;
	this.objVertexIndexBuffer;

	var MoveMatrix = mat4.create();

    /**
     * Initialize the object buffers of the menu entry.
     * @param gl The GL context to initialize the buffers in
     */
	this.initObjectBuffers = function initObjectBuffers(gl) {
		this.objVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.objVertexPositionBuffer);
        var vertices = [ //a list of coordinates corresponding to the vertices of the entry plane
            0.0, 0.0, 0.0,
            0.0, -1.0, 0.0,
            1.0, -1.0, 0.0,
            1.0, 0.0, 0.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        this.objVertexPositionBuffer.itemSize = 3; //the number of coordinates per entry (vec3)
        this.objVertexPositionBuffer.numItems = 4; //the number of vertices 

        this.objVertexTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,  this.objVertexTextureCoordBuffer );
        var textureCoords = [ //a list of texture coordinates which will be mapped to the vertices
            0.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
        this.objVertexTextureCoordBuffer.itemSize = 2; //the number of coordinates per texture coord
        this.objVertexTextureCoordBuffer.numItems = 4; //the number of texture vertices

        this.objVertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.objVertexIndexBuffer);
        var objVertexIndices = [ //the order with which to draw the plane
            0, 1, 2, // eg. Draw vertex 0, vertex 1 then vertex 2 to complete a triangle
            0, 2, 3,
        ];
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(objVertexIndices), gl.STATIC_DRAW);
        this.objVertexIndexBuffer.itemSize = 1; //index of vertices is not grouped
        this.objVertexIndexBuffer.numItems = 6;
	}

    /**
     * Takes in a texture and binds it as a GL texture to the texture of the entry.
     * @param gl The WebGL context to create the texture in
     * @param tex The image to use for creating a GL texture
     */
	this.handleLoadedTexture = function processTexture(gl, tex) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, this.texture); //bind the image to this entry's texture
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex); //use the passed image
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	    gl.bindTexture(gl.TEXTURE_2D, null); //unbind our texture
	}

    /**
     * Add a sub entry to the menu entry. Sets the position and scale to be appropriate to the
     * parent entry.
     * @param entry The entry to add
     * @param type Whether or not the entry is an icon type or text type
     */
	this.addSubEntry = function addSubEntry(entry, type) {
        this.iconType = type;
        entry.scale = this.getSubEntryScale(this.iconType);
        entry.scaleDest = entry.scale.slice(0);
        entry.position = this.getSubEntryPosition(this.subEntries.length);
        entry.position[1] = this.position[1];
        entry.positionDest = entry.position.slice(0);
        this.subEntries.push(entry);
	}

    /**
     * calculates the appropriate position for a sub entry whether it is an icon or text.
     * @return The Position for the entry depending on its position and its entry type
     */
    this.getSubEntryPosition = function getSubEntryPosition(entryPosition) {
        var pos = [];
        if(this.iconType) { //Icon type
            pos[0] = this.position[0];
            pos[1] = this.position[1]+(entryPosition/2)%2*0.7; 
            if(entryPosition%2 !== 0) { //odd
                pos[0] += 0.52; //offsets the icon square to the right
                pos[1] += 0.35;
            } else { //even
                pos[1] += 0.7; //only need to add the base offset
            }
            pos[2] = this.position[2];
        } else { // Text type
            pos[0] = this.position[0];
            pos[1] = this.position[1]+0.37+entryPosition/2.7;
            pos[2] = this.position[2];
        }

        return pos;
    }

    /**
     * calculates the appropriate position for a sub entry whether it is an icon or text.
     * @return The scale for the entry depending on if it is a text or icon type
     */
    this.getSubEntryScale = function getSubEntryScale() {
        var s = [];
        if(this.iconType) { //icon type
            s[0] = this.scale[0]/2.1; //make the icon types smaller 
            s[1] = this.scale[1]/1.5;
            s[2] = this.scale[2];          
        } else { //text type
            s[0] = this.scale[0];
            s[1] = this.scale[1]/3; //as only text is shown, scale down to a 3rd the normal size
            s[2] = this.scale[2];
        }
        return s;
    }

    /**
     * Used for updating and moving the positions of the menu entry and its sub entries.
     * Called on every animation frame from the window.
     * @param elapsedTime the elapsed time after the last animation frame.
     */
	this.animate = function animate(elapsedTime) {
        //only update the sub entries every time the selection of the entry has changed
        if(this.prevSelected !== this.selected) { 
            
            if(this.selected) { //if the entry is selected, update the positions and scale of sub entries
                for(var i=0; i<this.subEntries.length;i++) {
                    this.subEntries[i].scaleDest = this.getSubEntryScale();
                    this.subEntries[i].positionDest = this.getSubEntryPosition(i);
                }
            } else { // otherwise send their scale to 0 and position to the parent entry position
                for(var i=0; i<this.subEntries.length;i++) { // so that the entries dissapear
                    this.subEntries[i].scaleDest[1] = 0.0;
                    this.subEntries[i].positionDest[1] = this.position[1];
                }
            }
        }
        for(var i=0; i<this.subEntries.length;i++) { 
            //Keep the entries above the parent entry
            lerp(this.subEntries[i].scale, this.subEntries[i].scaleDest, 0.2);
            this.subEntries[i].position[0] = this.getSubEntryPosition(i)[0];
            this.subEntries[i].positionDest[0] = this.getSubEntryPosition(i)[0];

            //perform transitions on earch sub entry 
            lerp(this.subEntries[i].position, this.subEntries[i].positionDest.slice(0), 0.2); 
        }

        //perform any linear transitions needed this animation frame
        lerp(this.scale, this.scaleDest, 0.2);
        lerp(this.position, this.positionDest, 0.2);

        this.prevSelected = this.selected; //keep track of when the entry was selected
	}

    /**
     * Draw the menu entry to the canvas.
     * @param gl The WebGL context to draw in
     * @param shaderProgram The GLSL shader to use for drawing the meny entry
     * @param pMatrix The Projection matrix being used for the view
     * @param mvMatrix The model matrix used for moving and scaling the entry
     */
	this.draw = function draw(gl, shaderProgram, pMatrix, mvMatrix) {
        
        //Apply the position and scale of the entry to the matrix for rendering
        mat4.identity(mvMatrix); //reset the matrix
        mat4.translate(mvMatrix, mvMatrix, this.position);
        mat4.scale(mvMatrix, mvMatrix, this.scale);
       
        //pass the vertex positions of the entry to the shader
        gl.bindBuffer(gl.ARRAY_BUFFER, this.objVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                this.objVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        //pass the texture coordinates of the entry to the shader
        gl.bindBuffer(gl.ARRAY_BUFFER, this.objVertexTextureCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 
                this.objVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

        //pass the texture itself to the shader
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        //Apply the uniform values to the matrix
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.objVertexIndexBuffer);
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
        gl.uniform1i(shaderProgram.tintedAttribute, 1);
        gl.drawElements(gl.TRIANGLES, this.objVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

        // Draw all of the sub menu entries
        for(var i=0;i<this.subEntries.length;i++) {
            this.subEntries[i].draw(gl, shaderProgram, pMatrix, mvMatrix);
        }
	}
}