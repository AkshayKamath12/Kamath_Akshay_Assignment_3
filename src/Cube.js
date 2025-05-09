// Cube.js

class Cube {
    constructor() {
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.textureNum = -2;
    }

    render() {
        var rgba = this.color;
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        gl.uniform1i(u_whichTexture, this.textureNum);

        // Front of cube
        drawTriangle3DUV([0, 0, 0, 1, 1, 0, 1, 0, 0], [0, 0, 1, 1, 1, 0]);
        drawTriangle3DUV([0, 0, 0, 0, 1, 0, 1, 1, 0], [0, 0, 0, 1, 1, 1]);

        // Top of cube
        drawTriangle3DUV([0, 1, 0, 0, 1, 1, 1, 1, 1], [0, 0, 0, 1, 1, 1]);
        drawTriangle3DUV([0, 1, 0, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 0]);

        // Back of cube
        drawTriangle3DUV([0, 0, 1, 1, 0, 1, 1, 1, 1], [0, 0, 1, 0, 1, 1]);
        drawTriangle3DUV([0, 0, 1, 1, 1, 1, 0, 1, 1], [0, 0, 1, 1, 0, 1]);

        // Bottom of cube
        drawTriangle3DUV([0, 0, 0, 1, 0, 0, 1, 0, 1], [0, 0, 1, 0, 1, 1]);
        drawTriangle3DUV([0, 0, 0, 1, 0, 1, 0, 0, 1], [0, 0, 1, 1, 0, 1]);

        // Left of cube
        drawTriangle3DUV([0, 0, 0, 0, 1, 1, 0, 1, 0], [0, 0, 1, 1, 0, 1]);
        drawTriangle3DUV([0, 0, 0, 0, 0, 1, 0, 1, 1], [0, 0, 0, 1, 1, 1]);

        // Right of cube
        drawTriangle3DUV([1, 0, 0, 1, 1, 0, 1, 1, 1], [0, 0, 1, 1, 1, 0]);
        drawTriangle3DUV([1, 0, 0, 1, 1, 1, 1, 0, 1], [0, 0, 1, 0, 1, 1]);
    }

    renderFast(){
        var rgba = this.color;
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        gl.uniform1i(u_whichTexture, this.textureNum);

        var allverts = [];
        allverts = allverts.concat([0, 0, 0, 1, 1, 0, 1, 0, 0]);
        allverts = allverts.concat([0, 0, 0, 0, 1, 0, 1, 1, 0]);


        allverts = allverts.concat([0, 1, 0, 0, 1, 1, 1, 1, 1]);
        allverts = allverts.concat([0, 1, 0, 1, 1, 1, 1, 1, 0]);


        allverts = allverts.concat([0, 0, 1, 1, 0, 1, 1, 1, 1]);
        allverts = allverts.concat([0, 0, 1, 1, 1, 1, 0, 1, 1]);


        allverts = allverts.concat([0, 0, 0, 1, 0, 0, 1, 0 ,1]);
        allverts = allverts.concat([0 ,0 ,0 ,1 ,0 ,1 ,0 ,0 ,1]);


        allverts = allverts.concat([0 ,0 ,0 ,0 ,1 ,1 ,0 ,1 ,0]);
        allverts = allverts.concat([0 ,0 ,0 ,0 ,0 ,1 ,0 ,1 ,1]);


        allverts = allverts.concat([1 ,0 ,0 ,1 ,1 ,0 ,1 ,1 ,1]);
        allverts = allverts.concat([1 ,0 ,0 ,1 ,1 ,1 ,1 ,0 ,1]);

        var uv = [];
        uv = uv.concat([0, 0, 1, 1, 1, 0]);
        uv = uv.concat([0, 0, 0, 1, 1, 1]);

        uv = uv.concat([0, 0, 0, 1, 1, 1]);
        uv = uv.concat([0, 0, 1, 1, 1, 0]);

        uv = uv.concat([0, 0, 1, 0, 1, 1]);
        uv = uv.concat([0, 0, 1, 1, 0, 1]);

        uv = uv.concat([0, 0, 1, 0, 1, 1]);
        uv = uv.concat([0, 0, 1, 1, 0, 1]);

        uv = uv.concat([0, 0, 1, 1, 0, 1]);
        uv = uv.concat([0, 0, 0, 1, 1, 1]);

        uv = uv.concat([0, 0, 1, 1, 1, 0]);
        uv = uv.concat([0, 0, 1, 0, 1, 1]);
        
        drawTriangle3DUV(allverts, uv);

        
    }

}