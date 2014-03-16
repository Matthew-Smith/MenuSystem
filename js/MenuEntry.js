function MenuEntry(gl, entryName) {
	this.texture = gl.createTexture();
	this.selected = false;
    var prevSelected = false;
	this.name = entryName;
	this.subEntries = [];
    var iconType;

	this.scale = [1.0, 1.0, 1.0];
	this.position = [0, 0, 0];
    this.positionDest = [0, 0, 0];
    this.scaleDest = [1.0, 1.0, 1.0];

	this.objVertexPositionBuffer;
	this.objVertexTextureCoordBuffer;
	this.objVertexIndexBuffer;

	var MoveMatrix = mat4.create();

	this.initObjectBuffers = function initObjectBuffers(gl) {
		this.objVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.objVertexPositionBuffer);
        var vertices = [
            0.0, 0.0, 0.0,
            0.0, -1.0, 0.0,
            1.0, -1.0, 0.0,
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

	this.addSubEntry = function addSubEntry(entry, type) {
        this.iconType = type;
        entry.scale = this.getSubEntryScale(this.iconType);
        entry.scaleDest = entry.scale.slice(0);
        entry.position = this.getSubEntryPosition(this.subEntries.length);
        entry.position[1] = this.position[1];
        entry.positionDest = entry.position.slice(0);
        this.subEntries.push(entry);
	}

    this.getSubEntryPosition = function getSubEntryPosition(entryPosition) {
        var pos = [];
        if(this.iconType) {
            pos[0] = this.position[0];
            pos[1] = this.position[1]+(entryPosition/2)*0.95;
            if(entryPosition%2 !== 0) { //odd
                pos[0] += 0.52;
                pos[1] += 0.475;
            } else {
                pos[1] += 0.95;
            }
            pos[2] = this.position[2];
        } else {
            pos[0] = this.position[0];
            pos[1] = this.position[1]+0.43+entryPosition/2.3;
            pos[2] = this.position[2];
        }

        return pos;
    }
    this.getSubEntryScale = function getSubEntryScale() {
        var s = [];
        if(this.iconType) {
            s[0] = this.scale[0]/2.1;
            s[1] = this.scale[1]/1.1;
            s[2] = this.scale[2];          
        } else {
            s[0] = this.scale[0];
            s[1] = this.scale[1]/2.5;
            s[2] = this.scale[2];
        }
        return s;
    }

	this.animate = function animate(elapsedTime) {
        if(this.prevSelected !== this.selected) {
            
            if(this.selected) {
                for(var i=0; i<this.subEntries.length;i++) {
                    this.subEntries[i].scaleDest = this.getSubEntryScale();
                    this.subEntries[i].positionDest = this.getSubEntryPosition(i);
                }
            } else {
                for(var i=0; i<this.subEntries.length;i++) {
                    this.subEntries[i].scaleDest[1] = 0.0;
                    this.subEntries[i].positionDest[1] = this.position[1];
                }
            }
        }
        for(var i=0; i<this.subEntries.length;i++) {
            lerp(this.subEntries[i].scale, this.subEntries[i].scaleDest, 0.2);
            this.subEntries[i].position[0] = this.getSubEntryPosition(i)[0];
            this.subEntries[i].positionDest[0] = this.getSubEntryPosition(i)[0];
            lerp(this.subEntries[i].position, this.subEntries[i].positionDest.slice(0), 0.2);
        }

        lerp(this.scale, this.scaleDest, 0.2);
        lerp(this.position, this.positionDest, 0.2);

        this.prevSelected = this.selected;
	}

	this.draw = function draw(gl, shaderProgram, pMatrix, mvMatrix) {
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

        for(var i=0;i<this.subEntries.length;i++) {
            this.subEntries[i].draw(gl, shaderProgram, pMatrix, mvMatrix);
        }
	}
}