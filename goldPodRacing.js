"use strict";
///<reference path="definitions.d.ts" />
class RaceInfo {
    constructor() {
        this.frames = 0;
        this.laps = 0;
        this.checkPoints = [];
        this.checkPointToDefend = 0;
        this.rShieldTimeout = 10;
        this.dShieldTimeout = 10;
    }
    nextCheckPoint(pod) {
        return this.checkPoints[pod.nextCheckPointId];
    }
}
class Point {
    constructor(pX, pY) {
        this.positionX = pX;
        this.positionY = pY;
    }
}
class PodTracking {
    constructor() {
        this.myPods = [new Pod(0, 0, 0, 0, 0, 0), new Pod(0, 0, 0, 0, 0, 0)];
        this.enemyPods = [new Pod(0, 0, 0, 0, 0, 0), new Pod(0, 0, 0, 0, 0, 0)];
    }
}
class CheckPointTracking {
    constructor() {
        this.pods = [new EnemyPodTracker(), new EnemyPodTracker()];
    }
    getMostDangerous() {
        return this.pods[0].first ? 0 : 1;
    }
}
class EnemyPodTracker {
    constructor() {
        this.first = false;
        this.lap = 0;
        this.last = 0;
        this.danger = 0;
    }
}
;
class Pod extends Point {
    constructor(id, x = 0, y = 0, sx = 0, sy = 0, angle = 0, nextId = 0) {
        super(x, y);
        this.id = 0;
        this.speedX = 0;
        this.speedY = 0;
        this.boundDelta = 90;
        this.angle = 0;
        this.nextCheckPointId = 0;
        this.previousThrust = 0;
        this.boost = true;
        this.target = new Point(0, 0);
        this.id = id;
        this.speedX = sx;
        this.speedY = sy;
        this.angle = angle;
        this.nextCheckPointId = nextId;
    }
    futureX() {
        return this.speedX + this.positionX;
    }
    futureY() {
        return this.speedY + this.positionY;
    }
    setThrust(thrust) {
        if (thrust === "SHIELD") {
            this.previousThrust = 0;
        }
        if (thrust === "BOOST") {
            this.previousThrust = 650;
        }
        if (typeof thrust === 'number') {
            this.previousThrust = thrust;
        }
    }
    moveToPoint(x, y, thrust) {
        this.setThrust(thrust);
        this.target = new Point(x, y);
        return print(`${x} ${y} ${thrust}`);
    }
    hasTargetInFront(target) {
        if (this.angle < 0) {
            return true;
        }
        else {
            var targetAngle = HelperMethods.getRelativeAngle(this, target) + 360;
            var anglediff = ((this.angle - targetAngle + 180 + 360) % 360) - 180;
            return anglediff <= this.boundDelta && anglediff >= -this.boundDelta;
        }
    }
    getAllowedAngleForPredicting(target) {
        var distanceToCheckpoint = HelperMethods.getDistanceBetween(this, target);
        var checkPointRadius = 575;
        var angleOfAttack = Math.atan(checkPointRadius / distanceToCheckpoint) * (180 / Math.PI);
        return angleOfAttack;
    }
    hasTargetInRange(target) {
        var delta = this.getAllowedAngleForPredicting(target);
        var targetAngle = HelperMethods.getRelativeAngle(this, target) + 360;
        var anglediff = ((this.angle - targetAngle + 180 + 360) % 360) - 180;
        return anglediff <= delta && anglediff >= -delta;
    }
    isAnyoneGoingToHitMe(pods) {
        var myPod = this;
        var hitting = pods.findIndex(pod => {
            var futureEnemy = new Point(pod.positionX + pod.speedX * 2, pod.positionY + pod.speedY * 2);
            var futureMe = myPod.getFuturePositionGivenThrustValue(pod);
            var enemySpeed = Math.floor(Math.sqrt(pod.speedX * pod.speedX + pod.speedY * pod.speedY));
            var mySpeed = Math.floor(Math.sqrt(myPod.speedX * myPod.speedX + myPod.speedY * myPod.speedY));
            var threshHold = enemySpeed + mySpeed;
            var distance = HelperMethods.getDistanceBetween(futureMe, futureEnemy);
            return distance < threshHold || myPod.previousThrust > 120;
        });
        return hitting > -1;
    }
    isAnyoneGoingToHitMeRacer(pods) {
        var myPod = this;
        var hitting = pods.findIndex(pod => {
            var futureEnemy = new Point(pod.positionX + pod.speedX * 2, pod.positionY + pod.speedY * 2);
            var futureMe = myPod.getFuturePositionGivenThrustValue(pod);
            var distance = HelperMethods.getDistanceBetween(futureMe, futureEnemy);
            var enemySpeed = Math.floor(Math.sqrt(pod.speedX * pod.speedX + pod.speedY * pod.speedY));
            var mySpeed = Math.floor(Math.sqrt(myPod.speedX * myPod.speedX + myPod.speedY * myPod.speedY));
            return distance < 900 && enemySpeed - mySpeed > 20;
        });
        Debug.print('hits' + hitting);
        return hitting > -1;
    }
    getAngleToNextCheckPoint() {
        var nextCheckPoint = raceInfo.checkPoints[this.nextCheckPointId];
        var oneAhead = raceInfo.checkPoints[HelperMethods.getCheckPointsAhead(this.nextCheckPointId, 1)];
        var b = HelperMethods.getDistanceBetween(this, nextCheckPoint);
        var a = HelperMethods.getDistanceBetween(this, oneAhead);
        var c = HelperMethods.getDistanceBetween(nextCheckPoint, oneAhead);
        var angle = Math.acos((b * b + c * c - a * a) / (2 * b * c));
        return Math.floor(HelperMethods.toDegrees(angle));
    }
    defendCheckPointFrom(pod) {
        // Update checkpoint to defend
        var checkPoint = raceInfo.checkPoints[raceInfo.checkPointToDefend];
        var lastLap = false;
        Debug.print({ cp: checkPoint });
        if (checkPointTracking.pods[checkPointTracking.getMostDangerous()].lap + 1 === raceInfo.laps && checkPoint.id > 0) {
            lastLap = true;
            raceInfo.checkPointToDefend = 0;
            checkPoint = raceInfo.checkPoints[0];
        }
        Debug.print({ cp: checkPoint });
        var thrust = 100;
        var distance = HelperMethods.getDistanceBetween(this, checkPoint);
        var point = "checkpoint";
        var distanceBetweenMeAndPod = HelperMethods.getDistanceBetween(this, pod);
        var target;
        var racerRelative = HelperMethods.getRelativeAngle(this, racer);
        var racerDiff = HelperMethods.getAngleDifference(this.angle, racerRelative);
        if (this.isAnyoneGoingToHitMe([...podTracking.enemyPods])) {
            thrust = "SHIELD";
        }
        Debug.print("NC " + pod.nextCheckPointId);
        Debug.print("CPTD " + raceInfo.checkPointToDefend);
        if (pod.nextCheckPointId === raceInfo.checkPointToDefend) {
            point = "pod";
        }
        else {
            point = "checkpoint";
            if (distance < 2000 && thrust !== "SHIELD") {
                point = "pod";
                raceInfo.dShieldTimeout = 10;
            }
        }
        if (point === "pod") {
            var relative = HelperMethods.getRelativeAngle(this, pod);
            var difference = HelperMethods.getAngleDifference(relative, this.angle);
            var meAndPod = HelperMethods.getAngleDifference(this.angle, pod.angle);
            if (thrust != "SHIELD") {
                thrust = 100 - Math.floor(difference / 2);
            }
            var multiplier = 1;
            if (distanceBetweenMeAndPod > 7000)
                multiplier = 7;
            else if (distanceBetweenMeAndPod > 6000)
                multiplier = 6;
            else if (distanceBetweenMeAndPod > 5000)
                multiplier = 5;
            else if (distanceBetweenMeAndPod > 4000)
                multiplier = 4;
            else if (distanceBetweenMeAndPod > 3000)
                multiplier = 3;
            else if (distanceBetweenMeAndPod > 2000)
                multiplier = 2;
            else if (distanceBetweenMeAndPod > 1000)
                multiplier = 1;
            Debug.print({ multiplier: multiplier });
            target = new Point(pod.positionX + Math.floor(pod.speedX * multiplier) + this.speedX, pod.positionY + Math.floor(pod.speedY * multiplier) + this.speedY);
            if (meAndPod < 150 && distanceBetweenMeAndPod > 3000) {
                thrust = 0;
            }
            if (meAndPod > 150 && distanceBetweenMeAndPod < 4000 && this.boost && this.hasTargetInRange(pod) && !this.hasTargetInRange(podTracking.myPods[0]) && racerDiff > 10) {
                thrust = "BOOST";
                this.boost = false;
            }
        }
        else {
            var offSetPoint = new Point(checkPoint.positionX - this.speedX, checkPoint.positionY - this.speedY);
            var relative = HelperMethods.getRelativeAngle(this, offSetPoint);
            var difference = HelperMethods.getAngleDifference(relative, this.angle);
            if (distance < 2000 && thrust !== "SHIELD") {
                thrust = 0;
            }
            else if (thrust !== "SHIELD") {
                thrust = 100 - Math.floor(difference / 2);
            }
            target = new Point(checkPoint.positionX - this.speedX, checkPoint.positionY - this.speedY);
        }
        this.setThrust(thrust);
        var futureD = this.getFuturePositionGivenThrustValue(target);
        var futureRacer = podTracking.myPods[0].getFuturePositionGivenThrustValue(podTracking.myPods[0].target);
        if (HelperMethods.getDistanceBetween(futureD, futureRacer) < 1500) {
            // Avoid collision
            Debug.print("Collision eminent");
        }
        if (HelperMethods.willTheyIntersect(this, target, racer, racer.target) && HelperMethods.getDistanceBetween(futureD, futureRacer) < 3000) {
            Debug.print("Danger");
            target = new Point(futureRacer.positionX + 10000, futureRacer.positionY + 10000);
        }
        this.moveToPoint(target.positionX, target.positionY, thrust);
        if (!lastLap) {
            var oneCheckPointAhead = pod.nextCheckPointId + 1;
            if (oneCheckPointAhead > raceInfo.checkPoints.length - 1) {
                oneCheckPointAhead = 0;
            }
            var nextCp = HelperMethods.getCheckPointsAhead(raceInfo.checkPointToDefend, 1);
            if (nextCp === pod.nextCheckPointId) {
                raceInfo.checkPointToDefend = HelperMethods.getCheckPointsAhead(pod.nextCheckPointId, 2);
            }
        }
    }
    getFuturePositionGivenThrustValue(target) {
        var thrust = this.previousThrust;
        var a = this.angle;
        var b = 0;
        var x = 0;
        var y = 0;
        if (a <= 90) {
            a = a;
            b = 180 - 90 - a;
            y = Math.sin(a) * thrust;
            x = Math.sin(b) * thrust;
        }
        else if (a <= 180) {
            a = 180 - a;
            b = 180 - 90 - a;
            y = Math.sin(a) * thrust;
            x = Math.sin(b) * thrust * -1;
        }
        else if (a <= 270) {
            a = a - 180;
            b = 180 - 90 - a;
            y = Math.sin(a) * thrust * -1;
            x = Math.sin(b) * thrust * -1;
        }
        else if (a <= 360) {
            a = a - 270;
            b = 180 - 90 - a;
            y = Math.sin(a) * thrust * -1;
            x = Math.sin(b) * thrust;
        }
        return new Point(Math.round(this.positionX + this.speedX + x * 0.85), Math.round(this.positionY + this.speedY + y * 0.85));
    }
}
class CheckPoint extends Point {
    constructor(id, x, y) {
        super(x, y);
        this.id = 0;
        this.id = id;
    }
}
class HelperMethods {
    static initializePods(podTracking) {
        // My Pods
        for (var i = 0; i < 2; i++) {
            var inputs = readline().split(" ");
            podTracking.myPods[i].id = i;
            podTracking.myPods[i].positionX = parseInt(inputs[0]);
            podTracking.myPods[i].positionY = parseInt(inputs[1]);
            podTracking.myPods[i].speedX = parseInt(inputs[2]);
            podTracking.myPods[i].speedY = parseInt(inputs[3]);
            podTracking.myPods[i].angle = parseInt(inputs[4]);
            podTracking.myPods[i].nextCheckPointId = parseInt(inputs[5]);
        }
        // Enemy Pods
        for (var i = 0; i < 2; i++) {
            var inputs = readline().split(" ");
            podTracking.enemyPods[i].id = i;
            podTracking.enemyPods[i].positionX = parseInt(inputs[0]);
            podTracking.enemyPods[i].positionY = parseInt(inputs[1]);
            podTracking.enemyPods[i].speedX = parseInt(inputs[2]);
            podTracking.enemyPods[i].speedY = parseInt(inputs[3]);
            podTracking.enemyPods[i].angle = parseInt(inputs[4]);
            podTracking.enemyPods[i].nextCheckPointId = parseInt(inputs[5]);
        }
        var enemyPod0 = podTracking.enemyPods[0];
        var enemyPod1 = podTracking.enemyPods[1];
        var trackingPod0 = checkPointTracking.pods[0];
        var trackingPod1 = checkPointTracking.pods[1];
        if (enemyPod0.nextCheckPointId != trackingPod0.last) {
            trackingPod0.last = enemyPod0.nextCheckPointId;
            if (enemyPod0.nextCheckPointId === 0) {
                trackingPod0.lap += 1;
            }
            trackingPod0.danger = parseInt(`${trackingPod0.lap}${enemyPod0.nextCheckPointId}`);
        }
        if (enemyPod1.nextCheckPointId != trackingPod1.last) {
            trackingPod1.last = enemyPod1.nextCheckPointId;
            if (enemyPod1.nextCheckPointId === 0) {
                trackingPod1.lap += 1;
            }
            trackingPod1.danger = parseInt(`${trackingPod1.lap}${enemyPod1.nextCheckPointId}`);
        }
        if (trackingPod0.danger > trackingPod1.danger) {
            trackingPod0.first = true;
            trackingPod1.first = false;
        }
        else if (trackingPod0.danger < trackingPod1.danger) {
            trackingPod1.first = true;
            trackingPod0.first = false;
        }
    }
    static toDegrees(rad) {
        return rad * (180 / Math.PI);
    }
    static getDistanceBetween(pod1, pod2) {
        var a = pod1.positionX - pod2.positionX;
        var b = pod1.positionY - pod2.positionY;
        return Math.sqrt(a * a + b * b);
    }
    static getDistanceAccountingForVelocity(pod1, pod2) {
        var a = pod1.positionX + pod1.speedX - (pod2.positionX + pod2.speedX);
        var b = pod1.positionY + pod1.speedY - (pod2.positionY + pod2.speedY);
        return Math.floor(Math.sqrt(a * a + b * b));
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
    static getCheckPointsAhead(checkPointId, n) {
        var lastIndex = raceInfo.checkPoints.length - 1;
        var newIndex = checkPointId + n;
        if (newIndex > lastIndex) {
            return newIndex - raceInfo.checkPoints.length;
        }
        else {
            return newIndex;
        }
    }
    static getCheckPointsBehind(checkPointId, n) {
        var newIndex = checkPointId - n;
        if (newIndex < 0) {
            return newIndex + raceInfo.checkPoints.length;
        }
        else {
            return newIndex;
        }
    }
    static getAngleDifference(angle1, angle2) {
        var dist = ((angle1 - angle2 + 180 + 360) % 360) - 180;
        return Math.abs(dist);
    }
    static willTheyIntersect(origin1, target1, origin2, target2) {
        var det, gamma, lambda;
        var a = origin1.positionX;
        var b = origin1.positionY;
        var c = target1.positionX;
        var d = target1.positionY;
        var p = origin2.positionX;
        var q = origin2.positionY;
        var r = target2.positionX;
        var s = target2.positionY;
        det = (target1.positionX - origin1.positionX) * (target2.positionY - origin2.positionY) - (target2.positionX - origin2.positionX) * (target1.positionY - origin1.positionY);
        det = (c - a) * (s - q) - (r - p) * (d - b);
        if (det === 0) {
            return false;
        }
        else {
            lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
            gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
            return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
        }
    }
    ;
    static getQuadrant(angle) {
        if (angle < 90) {
            return 0;
        }
        else if (angle < 180) {
            return 1;
        }
        else if (angle < 270) {
            return 2;
        }
        else {
            return 3;
        }
    }
}
class Debug {
    static print(value) {
        printErr(JSON.stringify(value));
    }
}
var raceInfo = new RaceInfo();
var checkPointTracking = new CheckPointTracking();
var podTracking = new PodTracking();
raceInfo.laps = parseInt(readline());
var checkpointCount = parseInt(readline());
for (var i = 0; i < checkpointCount; i++) {
    var inputs = readline().split(" ");
    var checkpointX = parseInt(inputs[0]);
    var checkpointY = parseInt(inputs[1]);
    raceInfo.checkPoints.push(new CheckPoint(i, checkpointX, checkpointY));
}
raceInfo.checkPointToDefend = Math.floor(raceInfo.checkPoints.length / 3);
var racerIndex = 0;
var defenderIndex = 0;
var racer;
var defender;
// game loop
while (true) {
    // Increase frames
    raceInfo.frames++;
    // Shield timeout
    if (raceInfo.rShieldTimeout > 0) {
        raceInfo.rShieldTimeout--;
    }
    if (raceInfo.dShieldTimeout > 0) {
        raceInfo.dShieldTimeout--;
    }
    // Initialize pods
    HelperMethods.initializePods(podTracking);
    // Set Defender / Racer
    racer = podTracking.myPods[0];
    defender = podTracking.myPods[1];
    // Initial thrust values
    var rThrust = 100;
    var dThrust = 100;
    // if (raceInfo.frames === 1) {
    //   dThrust = 'BOOST';
    //   racer.boost = false;
    // }
    var racerNextPoint = new Point(0, 0);
    // Racer Logic
    if (racer.isAnyoneGoingToHitMeRacer([...podTracking.enemyPods]) && raceInfo.rShieldTimeout === 0) {
        Debug.print('step 4');
        racer.moveToPoint(raceInfo.nextCheckPoint(racer).positionX, raceInfo.nextCheckPoint(racer).positionY, "SHIELD");
        raceInfo.rShieldTimeout = 20;
    }
    else {
        var nextCheckPoint = raceInfo.nextCheckPoint(racer);
        var predictedCheckPoint = raceInfo.checkPoints[HelperMethods.getCheckPointsAhead(racer.nextCheckPointId, 1)];
        var inRange = racer.hasTargetInRange(nextCheckPoint);
        var actualLocation = racer.getFuturePositionGivenThrustValue(raceInfo.nextCheckPoint(racer));
        var actualLocationPlusSpeed = actualLocation;
        actualLocationPlusSpeed.positionX += racer.speedX;
        actualLocationPlusSpeed.positionY += racer.speedY;
        var actualDistance = HelperMethods.getDistanceBetween(actualLocation, raceInfo.nextCheckPoint(racer));
        var plusDistance = HelperMethods.getDistanceBetween(actualLocationPlusSpeed, raceInfo.nextCheckPoint(racer));
        var angleToCheckPoint = HelperMethods.getRelativeAngle(racer, raceInfo.nextCheckPoint(racer));
        var angleDifference = HelperMethods.getAngleDifference(angleToCheckPoint, racer.angle);
        var nextPoint = new Point(nextCheckPoint.positionX - racer.speedX * 2, nextCheckPoint.positionY - racer.speedY * 2);
        var predictedPoint = new Point(predictedCheckPoint.positionX - racer.speedX * 2, predictedCheckPoint.positionY - racer.speedY * 2);
        rThrust = 100;
        if (raceInfo.frames === 2) {
            rThrust = 'BOOST';
        }
        racerNextPoint = nextPoint;
        if (!racer.hasTargetInFront(raceInfo.nextCheckPoint(racer))) {
            rThrust = 0;
        }
        else if (rThrust != 'BOOST' && rThrust != 'SHIELD') {
            if (plusDistance > 2000) {
                if (angleDifference < 5) {
                    rThrust = 100;
                }
                else {
                    rThrust = 100 - Math.floor(angleDifference / 2);
                }
            }
            else {
                if (plusDistance < 600) {
                    racerNextPoint = predictedPoint;
                    if (racer.getAngleToNextCheckPoint() < 45) {
                        rThrust = 0;
                    }
                }
                if (racer.speedX > 100 && racer.speedY > 100 && racer.getAngleToNextCheckPoint() < 90) {
                    rThrust = 100 - Math.floor(racer.getAngleToNextCheckPoint() / 2);
                }
            }
        }
        racer.moveToPoint(racerNextPoint.positionX, racerNextPoint.positionY, rThrust);
    }
    // Defender logic
    var enemyPod = podTracking.enemyPods[checkPointTracking.getMostDangerous()];
    if (!defender.hasTargetInFront(enemyPod)) {
        dThrust = 0;
    }
    defender.defendCheckPointFrom(enemyPod);
}
