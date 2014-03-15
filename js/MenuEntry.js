function MenuEntry(gl, entryName) {
	this.texture = gl.createTexture();
    this.selectedTexture = gl.createTexture();
	this.selected = false;
	this.name = entryName;
	this.subEntries = [];
	var numSubEntries = 0;

	this.scale = [0.1, 0.1, 0.1];
	this.position = [-4, 0, -1.5];

	this.objVertexPositionBuffer;
	this.objVertexTextureCoordBuffer;
	this.objVertexIndexBuffer;

	var mvMatrix = mat4.create();
	var MoveMatrix = mat4.create();

	this.initObjectBuffers = function initObjectBuffers(gl) {
		this.objVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.objVertexPositionBuffer);
        var vertices = [
            -0.5, -0.385, 0.0,
            -0.5, 0.385, 0.0,
            0.5, 0.385, 0.0,
            0.5, -0.385, 0.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        this.objVertexPositionBuffer.itemSize = 3; 
        this.objVertexPositionBuffer.numItems = 4;

        this.objVertexTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,  this.objVertexTextureCoordBuffer );
        var textureCoords = [
            0.0, 0.0,
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
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

	this.handleLoadedTexture = function handleLoadedTexture(gl, tex) {
        this.texture = tex;
	    gl.bindTexture(gl.TEXTURE_2D, this.texture);
	    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.texture.image);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	    gl.bindTexture(gl.TEXTURE_2D, null);
	}

	this.addSubEntry = function addSubEntry(entry) {
		entry.position[0] = this.position[0];
		entry.position[1] = this.position[1]+(numSubEntries*20);
		entry.position[2] = this.position[2];
		this.subEntries.push(entry);
		numSubEntries = this.subEntries.length;
	}

	this.animate = function animate(elapsedTime) {

	}

	this.draw = function draw(gl, shaderProgram, pMatrix) {
		if(numSubEntries>0) {
			for(var i=0;i<numSubEntries;i++) {
				this.subEntries[i].draw(gl, shaderProgram);
			}
		}

        mat4.identity(mvMatrix);

        mat4.scale(mvMatrix, mvMatrix, this.scale);

        mat4.translate(mvMatrix, mvMatrix, this.position);
        

        mat4.multiply(mvMatrix, mvMatrix, MoveMatrix);
       
        gl.bindBuffer(gl.ARRAY_BUFFER, this.objVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.objVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.objVertexTextureCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, this.objVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.objVertexIndexBuffer);
        setMatrixUniforms(pMatrix, mvMatrix);
        gl.drawElements(gl.TRIANGLES, this.objVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	}
}