"use strict";
///<reference path="definitions.d.ts" />
class RaceInfo {
    constructor() {
        this.frames = 0;
        this.laps = 0;
        this.checkPoints = [];
        this.checkPointCount = 0;
        this.lastCheckPointId = 0;
        this.checkPointToDefend = 0;
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
    }
    moveToPoint(x, y, thrust) {
        return print(`${x} ${y} ${thrust}`);
    }
    hasTargetInFront(target) {
        var targetAngle = HelperMethods.getRelativeAngle(this, target) + 360;
        var anglediff = (this.angle - targetAngle + 180 + 360) % 360 - 180;
        return (anglediff <= this.boundDelta && anglediff >= -this.boundDelta);
    }
    getAllowedAngleForPredicting(target) {
        var distanceToCheckpoint = HelperMethods.getDistanceBetween(this, target);
        var checkPointRadius = 500;
        var angleOfAttack = Math.atan(checkPointRadius / distanceToCheckpoint) * (180 / Math.PI);
        return angleOfAttack;
    }
    hasTargetInRange(target) {
        var delta = this.getAllowedAngleForPredicting(target);
        var targetAngle = HelperMethods.getRelativeAngle(this, target) + 360;
        var anglediff = (this.angle - targetAngle + 180 + 360) % 360 - 180;
        return (anglediff <= delta && anglediff >= -delta);
    }
    isAnyoneGoingToHitMe(pods) {
        var myPod = this;
        var hitting = pods.findIndex(pod => HelperMethods.getDistanceBetween(myPod, pod) < 1000);
        Debug.print({
            hit: hitting,
            d1: HelperMethods.getDistanceBetween(myPod, podTracking.enemyPods[0]),
            d2: HelperMethods.getDistanceBetween(myPod, podTracking.enemyPods[1])
        });
        return hitting > -1;
    }
    defendCheckPointFrom(pod) {
        // Update checkpoint to defend
        if (raceInfo.checkPointToDefend < pod.nextCheckPointId) {
            var twoCheckPointsAheadIndex = pod.nextCheckPointId + 1;
            var checkPointId = (raceInfo.lastCheckPointId < twoCheckPointsAheadIndex ? 0 : twoCheckPointsAheadIndex);
            raceInfo.checkPointToDefend = checkPointId;
        }
        var checkPoint = raceInfo.checkPoint(raceInfo.checkPointToDefend);
        var thrust = null;
        var distance = HelperMethods.getDistanceBetween(this, checkPoint);
        var point = checkPoint;
        var podDistanceFromCheckPoint = HelperMethods.getDistanceBetween(pod, checkPoint);
        if (this.isAnyoneGoingToHitMe([...podTracking.enemyPods])) {
            thrust = 'SHIELD';
        }
        else {
            thrust = 100;
        }
        if (podDistanceFromCheckPoint < 4000) {
            this.moveToPoint(pod.positionX + Math.floor(pod.speedX * 1.5), pod.positionY + Math.floor(pod.speedY * 1.5), thrust);
        }
        else {
            if (distance < 2500 && thrust !== 'SHIELD') {
                thrust = 30;
            }
            if (distance < 2000 && thrust !== 'SHIELD') {
                thrust = 20;
            }
            if (distance < 400 && thrust !== 'SHIELD') {
                thrust = 0;
                point = pod;
            }
            this.moveToPoint(point.positionX, point.positionY, thrust);
        }
        // if (HelperMethods.getDistanceBetween(this, checkPoint) < 500 && HelperMethods.getDistanceBetween(pod, checkPoint) > 2000) {
        //     this.moveToPoint(pod.positionX, pod.positionY, '0 adjusting');
        // } else {
        //     var angle = HelperMethods.getRelativeAngle(this, checkPoint);
        //     var distance = HelperMethods.getDistanceBetween(this, checkPoint);
        //     var thrust: string | number = 100;
        //     if (distance > 2000) {
        //         this.moveToPoint(checkPoint.positionX, checkPoint.positionY, '' +thrust + ' moving');
        //     } else {
        //         if (distance > 800) {
        //             var rate = Math.floor(distance / 20);
        //             var t = (thrust - rate < 10 ? 10 : thrust - rate);
        //             this.moveToPoint(checkPoint.positionX, checkPoint.positionY, t);
        //         } else {
        //             if (HelperMethods.getDistanceBetween(pod, checkPoint) > 2000) {
        //                 thrust = '0 tracking'
        //             } else if (HelperMethods.getDistanceBetween(this, pod) < 850) {
        //                 thrust = "SHIELD shielding";
        //             } else {
        //                 thrust = '100 intercepting';
        //             }
        //             this.moveToPoint(pod.positionX + pod.speedX, pod.positionY + pod.speedY, thrust);
        //         }
        //     }
        // }
    }
}
;
class CheckPoint extends Point {
    constructor(id, x, y) {
        super(x, y);
        this.id = 0;
        this.id = id;
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
            targetAngle = 360 - angle;
        }
        else if (deltaX > 0 && deltaY > 0) {
            // bottom right
            targetAngle = angle + 180;
        }
        else if (deltaX > 0 && deltaY < 0) {
            // top right
            targetAngle = 180 - angle;
        }
        return Math.floor(targetAngle);
    }
    static getAngleDifference(angle1, angle2) {
        var dist = (angle1 - angle2 + 180 + 360) % 360 - 180;
        return Math.abs(dist);
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
    var racer = podTracking.myPods[0];
    var defender = podTracking.myPods[1];
    var rThrust = 100;
    var dThrust = 100;
    if (!racer.hasTargetInFront(raceInfo.nextCheckPoint(racer))) {
        rThrust = 0;
    }
    if (raceInfo.frames === 1) {
        rThrust = 'BOOST';
    }
    if (!defender.hasTargetInFront(podTracking.enemyPods[1])) {
        dThrust = 0;
    }
    else {
        var nextCheckPoint = raceInfo.nextCheckPoint(racer);
        var relative = HelperMethods.getRelativeAngle(racer, nextCheckPoint);
        if (relative === racer.angle) {
            rThrust = 100;
        }
        else {
            var difference = HelperMethods.getAngleDifference(relative, racer.angle);
            rThrust = 100 - Math.floor(difference / 2);
            Debug.print({
                relative: relative,
                racer: racer.angle,
                diff: difference
            });
        }
    }
    var distance = Math.floor(HelperMethods.getDistanceBetween(defender, podTracking.enemyPods[1]));
    // Get next checkpoint and turn early
    // if (HelperMethods.getDistanceBetween(racer, raceInfo.nextCheckPoint(racer)) < 1500 && racer.hasTargetInRange(raceInfo.nextCheckPoint(racer))) {
    //     var checkPointPredicted;
    //     if (raceInfo.checkPoints[racer.nextCheckPointId + 1]) {
    //         checkPointPredicted = raceInfo.checkPoint(racer.nextCheckPointId + 1);
    //     } else {
    //         checkPointPredicted = raceInfo.checkPoint(0);
    //     }
    //     // if (racer.isAnyoneGoingToHitMe([defender, ...podTracking.enemyPods]) && raceInfo.frames > 20) {
    //     //     racer.moveToPoint(checkPointPredicted.positionX, checkPointPredicted.positionY, "SHIELD");
    //     // } else {
    //         racer.moveToPoint(checkPointPredicted.positionX, checkPointPredicted.positionY, rThrust);
    //     // }
    // }
    racer.moveToPoint(raceInfo.nextCheckPoint(racer).positionX, raceInfo.nextCheckPoint(racer).positionY, rThrust);
    defender.defendCheckPointFrom(podTracking.enemyPods[0]);
}
