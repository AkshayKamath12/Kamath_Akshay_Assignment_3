class Camera{
    constructor(){
        this.eye = new Vector3([0.0, 0.0, 3.0]);
        this.at = new Vector3([0.0, 0.0, -100]);
        this.up = new Vector3([0.0, 1.0, 0.0]);
    }

    forward(){
        var forward = new Vector3([this.at.elements[0] - this.eye.elements[0], this.at.elements[1] - this.eye.elements[1], this.at.elements[2] - this.eye.elements[2]]);
        forward = forward.normalize();
        var newEye = new Vector3([this.eye.elements[0] + forward.elements[0], this.eye.elements[1] + forward.elements[1], this.eye.elements[2] + forward.elements[2]]);
        if (this.cameraOutOfBounds(newEye)) {
            return;
        }
        this.at = new Vector3([this.at.elements[0] + forward.elements[0], this.at.elements[1] + forward.elements[1], this.at.elements[2] + forward.elements[2]]);
        this.eye = newEye;
    }

    backward(){
        var f = new Vector3([this.at.elements[0] - this.eye.elements[0], this.at.elements[1] - this.eye.elements[1], this.at.elements[2] - this.eye.elements[2]]);
        f = f.normalize();
        var newEye = new Vector3([this.eye.elements[0] - f.elements[0], this.eye.elements[1] - f.elements[1], this.eye.elements[2] - f.elements[2]]);
        if (this.cameraOutOfBounds(newEye)) {
            return;
        }
        this.at = new Vector3([this.at.elements[0] - f.elements[0], this.at.elements[1] - f.elements[1], this.at.elements[2] - f.elements[2]]);
        this.eye = newEye;
    }

    

    right(){
        var f = new Vector3([this.eye.elements[0] - this.at.elements[0], this.eye.elements[1] - this.at.elements[1], this.eye.elements[2] - this.at.elements[2]]);
        f = f.normalize();
        var r = this.cross(this.up, f).normalize();
        r = this.divide(r, 10);
        var newEye = new Vector3([this.eye.elements[0] + r.elements[0], this.eye.elements[1] + r.elements[1], this.eye.elements[2] + r.elements[2]]);
        if (this.cameraOutOfBounds(newEye)) {
            return;
        }
        this.at = new Vector3([this.at.elements[0] + r.elements[0], this.at.elements[1] + r.elements[1], this.at.elements[2] + r.elements[2]]);
        this.eye = newEye;
    }

    left(){
        var f = new Vector3([this.eye.elements[0] - this.at.elements[0], this.eye.elements[1] - this.at.elements[1], this.eye.elements[2] - this.at.elements[2]]);
        f = f.normalize();
        var r = this.cross(this.up, f).normalize();
        r = this.divide(r, 10);
        var newEye = new Vector3([this.eye.elements[0] - r.elements[0], this.eye.elements[1] - r.elements[1], this.eye.elements[2] - r.elements[2]]);
        if (this.cameraOutOfBounds(newEye)) {
            return;
        }
        this.eye = newEye;
        this.at = new Vector3([this.at.elements[0] - r.elements[0], this.at.elements[1] - r.elements[1], this.at.elements[2] - r.elements[2]]);
    }

    panLeft(angle) {
        //var rad = angle * Math.PI / 180; 
        var f = new Vector3([this.at.elements[0] - this.eye.elements[0], this.at.elements[1] - this.eye.elements[1], this.at.elements[2] - this.eye.elements[2]]);
        var rotationMatrix = new Matrix4().setRotate(angle, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        var rotatedF = rotationMatrix.multiplyVector3(f);
        this.at = new Vector3([this.eye.elements[0] + rotatedF.elements[0], this.eye.elements[1] + rotatedF.elements[1], this.eye.elements[2] + rotatedF.elements[2]]);
    }

    panRight(angle) {
        var rad = angle * Math.PI / 180; 
        var f = new Vector3([this.at.elements[0] - this.eye.elements[0], this.at.elements[1] - this.eye.elements[1], this.at.elements[2] - this.eye.elements[2]]);
        var rotationMatrix = new Matrix4().setRotate(-angle, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        var rotatedF = rotationMatrix.multiplyVector3(f);
        this.at = new Vector3([this.eye.elements[0] + rotatedF.elements[0], this.eye.elements[1] + rotatedF.elements[1], this.eye.elements[2] + rotatedF.elements[2]]);
    }

    cross(vec1, vec2){
        return new Vector3([vec1.elements[1] * vec2.elements[2] - vec1.elements[2] * vec2.elements[1],
                            vec1.elements[2] * vec2.elements[0] - vec1.elements[0] * vec2.elements[2],
                            vec1.elements[0] * vec2.elements[1] - vec1.elements[1] * vec2.elements[0]]);
    }

    divide(v, factor){
        return new Vector3([v.elements[0] / factor, v.elements[1] / factor, v.elements[2] / factor]);
    }

    cameraOutOfBounds(cameraEye) {
        // Define the boundaries of the map
        if (cameraEye.elements[1] < 0) {
            return true; // Camera is out of bounds
        }
        const minX = 4, maxX = 33;
        const minZ = -27.7, maxZ = 0.6;

        // Get the camera's position
        const x = cameraEye.elements[0];
        const z = cameraEye.elements[2];

        // Check if the camera is outside the boundaries
        if (x < minX || x > maxX || z < minZ || z > maxZ) {
            return true; // Camera is out of bounds
        }

        return false; // Camera is within bounds
    }


}