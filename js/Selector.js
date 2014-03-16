function Selector(gl) {
	this.scale = [1.0, 1.0, 1.0];
	this.position = [0, 0, 0];
    this.positionDest = [0, 0, 0];
    this.scaleDest = [0, 0, 0];

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
            0.0, -0.9, 0.1,
            1.0, -0.9, 0.1,
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
        //if(withinAreaOfDestination(0.01)) {
            lerp(this.position, this.positionDest, 0.2);
            //this.position = this.positionDest;
        //}
        lerp(this.scale, this.scaleDest, 0.1);

	}

    function lerp(pos, dest, time) {
        pos[0] = pos[0] + time * (dest[0] - pos[0]);
        pos[1] = pos[1] + time * (dest[1] - pos[1]);
        pos[2] = pos[2] + time * (dest[2] - pos[2]);
    }

    function withinAreaOfDestination(area) {
        var x = this.position[0];
        var y = this.position[1];
        var z = this.position[2];
        var xd = this.positionDest[0];
        var yd = this.positionDest[0];
        var zd = this.positionDest[0];
        if(Math.abs(x-xd) <= area && Math.abs(y-yd) <= area && Math.abs(z-zd) <= area) {
            return true;
        }
        return false;
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
        gl.drawElements(gl.TRIANGLES, this.objVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	}
}