class Particle {
    constructor(movementType) {
        this.pos = createVector(random(width), random(height));
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);
        this.maxspeed = 2;
        this.attractionStrength = 1;
        this.prevPos = this.pos.copy();
        this.movementType = movementType;
        this.centerPoints = [];
    }

    setMovementType(type) {
        this.movementType = type;
    }

    setCenterPoints(points) {
        this.centerPoints = points;
    }

    update() {
        switch (this.movementType) {
            case 'circle':
                let center = createVector(width / 2 + sin(frameCount * 0.01) * width / 4, height / 2 + cos(frameCount * 0.01) * height / 4);
                let dir = p5.Vector.sub(center, this.pos);
                dir.normalize();
                dir.rotate(HALF_PI);
                dir.mult(this.maxspeed);
                this.vel = dir;
                this.pos.add(this.vel);
                break;
            case 'noise':
                this.vel.add(this.acc);
                this.vel.limit(this.maxspeed);
                this.pos.add(this.vel);
                this.acc.mult(0);
                this.applyCenterPointsAttraction();
                break;
            case 'sin1':
                let centerX = width / 2;
                let centerY = height / 2;
                let distanceFromCenter = dist(this.pos.x, this.pos.y, centerX, centerY);
                let angle = frameCount * 0.01;
                let phaseOffset = distanceFromCenter * 0.01;
                let waveAmplitude = map(distanceFromCenter, 0, width / 2, 50, 150);
                let waveFrequency = 0.01;
                let waveOffset = sin(distanceFromCenter * waveFrequency + angle + phaseOffset) * waveAmplitude;
                let reflectedPos = p5.Vector.sub(createVector(centerX, centerY), this.pos);
                reflectedPos.normalize();
                reflectedPos.mult(waveOffset);
                this.pos.add(reflectedPos);
                this.pos.x += this.maxspeed * map(cos(this.pos.y * 0.01), -1, 1, 0.5, 1.5);
                break;
            case 'sin2':
                let angle2 = frameCount * 0.01;
                let phaseOffset2 = this.pos.y * 0.01;
                let waveAmplitude2 = map(sin(this.pos.x * 0.01), -1, 1, 50, 150);
                let waveFrequency2 = map(this.pos.y, 0, height, 0.005, 0.02);
                let waveOffset2 = sin(this.pos.x * waveFrequency2 + angle2 + phaseOffset2) * waveAmplitude2;
                this.pos.y += waveOffset2;
                this.pos.x += this.maxspeed * map(cos(this.pos.y * 0.01), -1, 1, 0.5, 1.5);
                break;
            case 'tau':
                let x = map(this.pos.x, 0, width, -1, 1);
                let y = map(this.pos.y, 0, height, -1, 1);
                let tauangle = -TAU / (1 + x * x + y * y);
                let v = p5.Vector.fromAngle(tauangle);
                v.mult(this.maxspeed);
                this.pos.add(v);
                break;
            case 'perlinFlow':
                let noiseScale = 0.01;
                let noiseStrength = 1;
                let noiseAngle = map(noise(this.pos.x * noiseScale, this.pos.y * noiseScale), 0, 1, 0, TWO_PI);
                let noiseVector = p5.Vector.fromAngle(noiseAngle);
                noiseVector.mult(noiseStrength);
                let noiseScale2 = 0.02;
                let noiseStrength2 = 0.5;
                let noiseAngle2 = map(noise(this.pos.x * noiseScale2, this.pos.y * noiseScale2), 0, 1, 0, TWO_PI);
                let noiseVector2 = p5.Vector.fromAngle(noiseAngle2);
                noiseVector2.mult(noiseStrength2);
                this.pos.add(noiseVector);
                this.pos.add(noiseVector2);
                break;
            case 'waveInterference':
                let wave1 = sin(this.pos.x * 0.01 + frameCount * 0.05);
                let wave2 = sin(this.pos.y * 0.02 + frameCount * 0.07);
                let wave3 = sin((this.pos.x + this.pos.y) * 0.015 + frameCount * 0.03);
                let waveSum = wave1 + wave2 + wave3;
                this.pos.x += waveSum * 2;
                this.pos.y += waveSum * 2;
                break;
        }
    }

    follow(vectors) {
        let x = floor(this.pos.x / scl);
        let y = floor(this.pos.y / scl);
        let index = x + y * cols;
        let force = vectors[index];
        this.acc.add(force);
    }

    show() {
        let totalPixels = windowWidth * windowHeight;
        let scaledStrokeWeight = map(totalPixels, 800 * 600, 2560 * 1440, 0.2, 0.7);

        let hue = map(this.pos.x, 0, width, 0, 360);
        let saturation = map(this.pos.y, 0, height, 50, 100);
        let brightness = map(dist(this.pos.x, this.pos.y, width / 2, height / 2), 0, sqrt(sq(width / 2) + sq(height / 2)), 50, 100);

        colorMode(HSB, 360, 100, 100, 100);
        stroke(hue, saturation, brightness, 10);

        strokeWeight(scaledStrokeWeight);
        line(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y);
        this.updatePrev();
    }

    updatePrev() {
        this.prevPos.x = this.pos.x;
        this.prevPos.y = this.pos.y;
    }

    edges() {
        if (this.pos.x >= width) {
            this.pos.x = 0;
            this.updatePrev();
        }
        if (this.pos.x < 0) {
            this.pos.x = width;
            this.updatePrev();
        }
        if (this.pos.y >= height) {
            this.pos.y = 0;
            this.updatePrev();
        }
        if (this.pos.y < 0) {
            this.pos.y = height;
            this.updatePrev();
        }
    }

    applyCenterPointsAttraction() {
        if (this.centerPoints.length > 0) {
            let closestPoint = this.centerPoints[0];
            let minDistance = dist(this.pos.x, this.pos.y, closestPoint.x, closestPoint.y);

            for (let i = 1; i < this.centerPoints.length; i++) {
                let distance = dist(this.pos.x, this.pos.y, this.centerPoints[i].x, this.centerPoints[i].y);
                if (distance < minDistance) {
                    closestPoint = this.centerPoints[i];
                    minDistance = distance;
                }
            }

            let direction = p5.Vector.sub(closestPoint, this.pos);
            direction.normalize();
            direction.mult(this.attractionStrength); 
            this.vel.add(direction);
        }
    }
}