function MenuEntry(gl, entryName) {
	this.texture = gl.createTexture();
	this.selected = false;
	this.name = entryName;
	this.subEntries = [];

	this.scale = [1.0, 1.0, 1.0];
	this.position = [0, 0, 0];

	this.objVertexPositionBuffer;
	this.objVertexTextureCoordBuffer;
	this.objVertexIndexBuffer;

	var MoveMatrix = mat4.create();

	this.initObjectBuffers = function initObjectBuffers(gl) {
		this.objVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.objVertexPositionBuffer);
        var vertices = [
            0.0, 0.0, 0.0,
            0.0, -0.9, 0.0,
            1.0, -0.9, 0.0,
            1.0, 0.0, 0.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        this.objVertexPositionBuffer.itemSize = 3; 
        this.objVertexPositionBuffer.numItems = 4;

        this.objVertexTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,  this.objVertexTextureCoordBuffer );
        var textureCoords = [
            0.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
        this.objVertexTextureCoordBuffer.itemSize = 2;
        this.objVertexTextureCoordBuffer.numItems = 4;

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

	this.handleLoadedTexture = function processTexture(gl, tex) {

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	    gl.bindTexture(gl.TEXTURE_2D, null);
	}

	this.addSubEntry = function addSubEntry(entry, textType) {
        if(textType) {
            entry.position[0] = this.position[0];
            entry.position[1] = this.position[1]+0.95+this.subEntries.length*0.95;
            entry.position[2] = this.position[2];
            entry.scale[0] = this.scale[0]/2;
            entry.scale[1] = this.scale[1];
            entry.scale[2] = this.scale[2];
            this.subEntries.push(entry);            
        } else {
            entry.position[0] = this.position[0];
            entry.position[1] = this.position[1]+0.5+this.subEntries.length/2;
            entry.position[2] = this.position[2];
            entry.scale[0] = this.scale[0];
            entry.scale[1] = this.scale[1]/2;
            entry.scale[2] = this.scale[2];
            this.subEntries.push(entry);
        }
	}

	this.animate = function animate(elapsedTime) {

	}

	this.draw = function draw(gl, shaderProgram, pMatrix, mvMatrix) {
		if(this.selected) {
			for(var i=0;i<this.subEntries.length;i++) {
				this.subEntries[i].draw(gl, shaderProgram, pMatrix, mvMatrix);
			}
		}
        mat4.identity(mvMatrix);

        mat4.translate(mvMatrix, mvMatrix, this.position);
        mat4.scale(mvMatrix, mvMatrix, this.scale);
        mat4.multiply(mvMatrix, mvMatrix, MoveMatrix);
       
        gl.bindBuffer(gl.ARRAY_BUFFER, this.objVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.objVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.objVertexTextureCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, this.objVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.objVertexIndexBuffer);
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
        gl.uniform1i(shaderProgram.tintedAttribute, 1);
        gl.drawElements(gl.TRIANGLES, this.objVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	}
}