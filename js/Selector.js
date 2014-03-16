function Selector(gl) {
	this.scale = [1.0, 1.0, 1.0];
	this.position = [0, 0, 0];
    this.positionDest = [0, 0, 0];
    this.scaleDest = [0, 0, 0];
    this.color = [0.0, 0.0, 0.0, 1.0];
    this.colorDest = [0.0, 0.0, 0.0, 1.0];

    this.texture = gl.createTexture();

	this.objVertexPositionBuffer;
	this.objVertexTextureCoordBuffer;
	this.objVertexIndexBuffer;

	var MoveMatrix = mat4.create();

	this.initObjectBuffers = function initObjectBuffers(gl) {
		this.objVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.objVertexPositionBuffer);
        var vertices = [
            0.0, 0.0, 0.1,
            0.0, -1.0, 0.1,
            1.0, -1.0, 0.1,
            1.0, 0.0, 0.1,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        this.objVertexPositionBuffer.itemSize = 3; 
        this.objVertexPositionBuffer.numItems = 4;

        this.objVertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.objVertexIndexBuffer);
        var objVertexIndices = [
            0, 1, 2,
            0, 2, 3,
        ];
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(objVertexIndices), gl.STATIC_DRAW);
        this.objVertexIndexBuffer.itemSize = 1;
        this.objVertexIndexBuffer.numItems = 6;
	}

	this.animate = function animate(elapsedTime) {
        lerp(this.position, this.positionDest, 0.2);
        lerp(this.scale, this.scaleDest, 0.1);
        lerp(this.color, this.colorDest, 0.1);
	}

	this.draw = function draw(gl, shaderProgram, pMatrix, mvMatrix) {
        mat4.identity(mvMatrix);

        mat4.translate(mvMatrix, mvMatrix, this.position);
        mat4.scale(mvMatrix, mvMatrix, this.scale);
        mat4.multiply(mvMatrix, mvMatrix, MoveMatrix);
       
        gl.bindBuffer(gl.ARRAY_BUFFER, this.objVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.objVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.objVertexIndexBuffer);
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
        gl.uniform4fv(shaderProgram.colorUniform, this.color);
        gl.drawElements(gl.TRIANGLES, this.objVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	}
}