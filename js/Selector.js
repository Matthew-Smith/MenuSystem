/*! 
 * @file Selector.js
 * @author Matthew Smith
 * @date March 15, 2014
 * @brief Used for visual feedback of what menu entry is selected
 */
function Selector(gl) {


    //The "physical" properties of the selector
    //Dest attributes are used for translating the selector from its current position to another
	this.scale = [1.0, 1.0, 1.0];
	this.position = [0, 0, 0];
    this.positionDest = [0, 0, 0];
    this.scaleDest = [0, 0, 0];
    this.color = [0.0, 0.0, 0.0, 1.0];
    this.colorDest = [0.0, 0.0, 0.0, 1.0];


	this.objVertexPositionBuffer;
	this.objVertexTextureCoordBuffer;
	this.objVertexIndexBuffer;

	var MoveMatrix = mat4.create();

    /**
     * Initialize the object buffers of the Selector.
     * @param gl The GL context to initialize the buffers in
     */
	this.initObjectBuffers = function initObjectBuffers(gl) {
		this.objVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.objVertexPositionBuffer);
        var vertices = [//a list of coordinates corresponding to the vertices of the entry plane
            0.0, 0.0, 0.1,
            0.0, -1.0, 0.1,
            1.0, -1.0, 0.1,
            1.0, 0.0, 0.1,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        this.objVertexPositionBuffer.itemSize = 3; //the number of coordinates per entry (vec3)
        this.objVertexPositionBuffer.numItems = 4; //the number of vertices 

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
     * Used for updating and moving the position, color and scale of the Selector.
     * Called on every animation frame from the window.
     * @param elapsedTime the elapsed time after the last animation frame.
     */
	this.animate = function animate(elapsedTime) {
        lerp(this.position, this.positionDest, 0.2); //interpolate between position, scale and color
        lerp(this.scale, this.scaleDest, 0.1);
        lerp(this.color, this.colorDest, 0.1);
	}

    /**
     * Draw the Selector to the canvas.
     * @param gl The WebGL context to draw in
     * @param shaderProgram The GLSL shader to use for drawing the selector
     * @param pMatrix The Projection matrix being used for the view
     * @param mvMatrix The model matrix used for moving and scaling the selector
     */
	this.draw = function draw(gl, shaderProgram, pMatrix, mvMatrix) {
        mat4.identity(mvMatrix); //reset the matrix

        //Apply the position and scale of the entry to the matrix for rendering
        mat4.translate(mvMatrix, mvMatrix, this.position);
        mat4.scale(mvMatrix, mvMatrix, this.scale);
       
        //pass the vertex positions of the entry to the shader
        gl.bindBuffer(gl.ARRAY_BUFFER, this.objVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                this.objVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);


        //Apply the uniform values to the matrix
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.objVertexIndexBuffer);
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
        gl.uniform4fv(shaderProgram.colorUniform, this.color);
        gl.drawElements(gl.TRIANGLES, this.objVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	}
}