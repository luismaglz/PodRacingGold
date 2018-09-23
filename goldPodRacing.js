"use strict";
///<reference path="definitions.d.ts" />
class RaceInfo {
    constructor() {
        this.frames = 0;
        this.laps = 0;
        this.checkPoints = [];
        this.checkPointCount = 0;
        this.lastCheckPointId = 0;
    }
    checkPoint(index) {
        return this.checkPoints[index];
    }
    nextCheckPoint(pod) {
        return this.checkPoints[pod.nextCheckPointId];
    }
}
class Point {
    constructor(pX, pY) {
        this.positionX = parseInt(pX);
        this.positionY = parseInt(pY);
    }
}
class PodTracking {
    constructor() {
        this.myPods = [];
        this.enemyPods = [];
    }
}
class Pod extends Point {
    constructor(id, x = '0', y = '0', sx = '0', sy = '0', angle = '0', nextId = '0') {
        super(x, y);
        this.id = 0;
        this.speedX = 0;
        this.speedY = 0;
        this.boundDelta = 90;
        this.angle = 0;
        this.nextCheckPointId = 0;
        this.id = id;
        this.speedX = parseInt(sx);
        this.speedY = parseInt(sy);
        this.angle = parseInt(angle);
        this.nextCheckPointId = parseInt(nextId);
        // this.setVisibleRange();
    }
    moveToPoint(x, y, thrust) {
        return print(`${x} ${y} ${thrust}`);
    }
    hasTargetInFront(target) {
        var targetAngle = HelperMethods.getRelativeAngle(this, target) + 360;
        var anglediff = (this.angle - targetAngle + 180 + 360) % 360 - 180;
        return (anglediff <= this.boundDelta && anglediff >= -this.boundDelta);
    }
}
;
class CheckPoint extends Point {
    constructor(id, x, y) {
        super(x, y);
        this.id = 0;
    }
}
;
class NextCheckPoint extends Point {
    constructor(pX, pY, distance, angle) {
        super(pX, pY);
        this.id = `${pX}${pY}`;
        this.distance = parseInt(distance);
        this.angle = parseInt(angle);
    }
}
;
class HelperMethods {
    static initializePods() {
        var podTracking = new PodTracking();
        for (var i = 0; i < 2; i++) {
            var inputs = readline().split(' ');
            podTracking.myPods.push(new Pod(i, inputs[0], inputs[1], inputs[2], inputs[3], inputs[4], inputs[5]));
        }
        for (var i = 0; i < 2; i++) {
            var inputs = readline().split(' ');
            podTracking.enemyPods.push(new Pod(i + 2, inputs[0], inputs[1], inputs[2], inputs[3], inputs[4], inputs[5]));
        }
        return podTracking;
    }
    static getDistanceBetween(pod1, pod2) {
        var a = pod1.positionX - pod2.positionX;
        var b = pod1.positionY - pod2.positionY;
        return Math.sqrt(a * a + b * b);
    }
    static getAllowedAngleForPredicting(checkPoint, pod) {
        var distanceToCheckpoint = this.getDistanceBetween(checkPoint, pod);
        var checkPointRadius = 300;
        var angleOfAttack = Math.atan(checkPointRadius / distanceToCheckpoint) * (180 / Math.PI);
        return angleOfAttack;
    }
    static getRelativeAngle(pod, target) {
        var deltaX = pod.positionX - target.positionX;
        var deltaY = pod.positionY - target.positionY;
        var absDeltaX = Math.abs(pod.positionX - target.positionX);
        var absDeltaY = Math.abs(pod.positionY - target.positionY);
        // var angle = Math.atan(opposite / adjacent) * (180 / Math.PI);
        var angle = Math.atan(absDeltaY / absDeltaX) * (180 / Math.PI);
        var targetAngle = 0;
        if (deltaX < 0 && deltaY < 0) {
            // top left
            targetAngle = angle;
        }
        else if (deltaX < 0 && deltaY > 0) {
            // bottom left
            targetAngle = angle + 270;
        }
        else if (deltaX > 0 && deltaY > 0) {
            // bottom right
            targetAngle = angle + 180;
        }
        else if (deltaX > 0 && deltaY < 0) {
            // top right
            targetAngle = angle + 90;
        }
        return Math.floor(targetAngle);
    }
}
class Debug {
    static print(value) {
        printErr(JSON.stringify(value));
    }
}
var raceInfo = new RaceInfo();
var podTracking;
raceInfo.laps = parseInt(readline());
var checkpointCount = parseInt(readline());
for (var i = 0; i < checkpointCount; i++) {
    var inputs = readline().split(' ');
    var checkpointX = inputs[0];
    var checkpointY = inputs[1];
    raceInfo.checkPoints.push(new CheckPoint(i, checkpointX, checkpointY));
}
raceInfo.checkPointCount = raceInfo.checkPoints.length;
raceInfo.lastCheckPointId = raceInfo.checkPoints.length - 1;
// game loop
while (true) {
    raceInfo.frames++;
    podTracking = HelperMethods.initializePods();
    var paco = podTracking.myPods[0];
    var megan = podTracking.myPods[1];
    var pacoThrust = 100;
    var meganThrust = 100;
    if (!paco.hasTargetInFront(raceInfo.nextCheckPoint(paco))) {
        pacoThrust = 0;
    }
    if (raceInfo.frames === 1) {
        pacoThrust = 'BOOST';
    }
    if (!megan.hasTargetInFront(podTracking.enemyPods[1])) {
        meganThrust = 50;
    }
    var distance = Math.floor(HelperMethods.getDistanceBetween(megan, podTracking.enemyPods[1]));
    paco.moveToPoint(raceInfo.nextCheckPoint(paco).positionX, raceInfo.nextCheckPoint(paco).positionY, pacoThrust);
    megan.moveToPoint((podTracking.enemyPods[1].positionX + podTracking.enemyPods[1].speedX * 10), (podTracking.enemyPods[1].positionY + podTracking.enemyPods[1].speedY * 10), meganThrust);
}
