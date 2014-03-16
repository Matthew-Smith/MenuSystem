/*! 
 * @file Video.js
 * @author Matthew Smith
 * @date March 15, 2014
 * @brief Used for drawing a video to the background of the window
 */

function VideoPlane(gl) {
	this.scale = [1.0, 1.0, 1.0];
	this.position = [0, 0, 0];

    this.texture = gl.createTexture();
    this.videoElement;

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
            -5.0, -3.375, -10.0,
            -5.0, 3.375, -10.0,
            5.0, 3.375, -10.0,
            5.0, -3.375, -10.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        this.objVertexPositionBuffer.itemSize = 3; //the number of coordinates per entry (vec3)
        this.objVertexPositionBuffer.numItems = 4; //the number of vertices 

        this.objVertexTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,  this.objVertexTextureCoordBuffer );
        var textureCoords = [ //a list of texture coordinates which will be mapped to the vertices
            0.0, 0.0,
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
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
     * Used for updating the video texture.
     * NOTE: NOT IMPLEMENTED
     * Called on every animation frame from the window.
     * @param elapsedTime the elapsed time after the last animation frame.
     */
	this.animate = function animate(elapsedTime) {
        /*if(this.videoElement !== undefined) {
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.videoElement);
        }*/
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
    }
}