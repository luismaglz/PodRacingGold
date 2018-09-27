///<reference path="definitions.d.ts" />

class RaceInfo {
    frames: number = 0;
    laps: number = 0;
    checkPoints: CheckPoint[] = [];
    checkPointToDefend: number = 0;
    shieldTimeout: number = 10;
    nextCheckPoint(pod: Pod) {
        return this.checkPoints[pod.nextCheckPointId];
    }
}

class Point {
    positionX: number;
    positionY: number;

    constructor(pX: string, pY: string) {
        this.positionX = parseInt(pX);
        this.positionY = parseInt(pY);
    }
}
class PodTracking {
    myPods: Pod[] = [];
    enemyPods: Pod[] = [];
}
class CheckPointTracking {
    enemyPod0LastCheckPoint = 0;
    enemyPod1LastCheckPoint = 0;
    enemyPod0Danger: number = 0;
    enemyPod1Danger: number = 0;

    getMostDangerous(): number {
        return (this.enemyPod0Danger > this.enemyPod1Danger ? 0 : 1);
    }
}
class Pod extends Point {
    id: number = 0;
    speedX: number = 0;
    speedY: number = 0;
    boundDelta: number = 90;
    angle: number = 0;
    nextCheckPointId: number = 0;

    constructor(id: number, x: string = '0', y: string = '0', sx: string = '0', sy: string = '0', angle: string = '0', nextId = '0') {
        super(x, y);
        this.id = id;
        this.speedX = parseInt(sx);
        this.speedY = parseInt(sy);
        this.angle = parseInt(angle);
        this.nextCheckPointId = parseInt(nextId);
    }

    moveToPoint(x: number, y: number, thrust: number | string) {
        return print(`${x} ${y} ${thrust}`);
    }

    hasTargetInFront(target: CheckPoint | Pod): boolean {
        Debug.print("hasTargetInFront")

        var targetAngle = HelperMethods.getRelativeAngle(this, target) + 360;
        var anglediff = (this.angle - targetAngle + 180 + 360) % 360 - 180
        return (anglediff <= this.boundDelta && anglediff >= -this.boundDelta);
    }

    getAllowedAngleForPredicting(target: CheckPoint | Pod): number {
        var distanceToCheckpoint = HelperMethods.getDistanceBetween(this, target);
        var checkPointRadius = 500;
        var angleOfAttack = Math.atan(checkPointRadius / distanceToCheckpoint) * (180 / Math.PI);
        return angleOfAttack;
    }

    hasTargetInRange(target: CheckPoint | Pod): boolean {
        var delta = this.getAllowedAngleForPredicting(target);
        Debug.print("hasTargetInRange")

        var targetAngle = HelperMethods.getRelativeAngle(this, target) + 360;
        var anglediff = (this.angle - targetAngle + 180 + 360) % 360 - 180
        return (anglediff <= delta && anglediff >= -delta);
    }

    isAnyoneGoingToHitMe(pods: Pod[]) {
        var myPod = this;
        var hitting = pods.findIndex(pod => HelperMethods.getDistanceAccountingForVelocity(myPod, pod) < 850);
        return hitting > -1;
    }

    getAngleToNextCheckPoint(): number {
        var nextCheckPoint = raceInfo.checkPoints[this.nextCheckPointId];
        var oneAhead = raceInfo.checkPoints[HelperMethods.getCheckPointsAhead(this.nextCheckPointId, 1)];
        Debug.print({
            next: nextCheckPoint,
            ahead: oneAhead
        })
        var b = HelperMethods.getDistanceBetween(this, nextCheckPoint);
        var a = HelperMethods.getDistanceBetween(this, oneAhead);
        var c = HelperMethods.getDistanceBetween(nextCheckPoint, oneAhead);
        var angle = Math.acos((b * b + c * c - a * a) / (2 * b * c))
        return Math.floor(HelperMethods.toDegrees(angle));
    }

    defendCheckPointFrom(pod: Pod) {
        // Update checkpoint to defend
        var checkPoint = raceInfo.checkPoints[raceInfo.checkPointToDefend];
        var thrust: string | number = 100;
        var distance = HelperMethods.getDistanceBetween(this, checkPoint);
        var point = 'checkpoint';
        var checkPointBeforeCheckPoint = raceInfo.checkPoints[HelperMethods.getCheckPointsAhead(raceInfo.checkPointToDefend, -1)]
        var rel = HelperMethods.getRelativeAngle(checkPoint, checkPointBeforeCheckPoint);
        var offSetX = 600;
        var offSetY = 600;

        if (91 <= rel && rel <= 180) {
            offSetX = offSetX * -1;
        } else if (181 <= rel && rel <= 270) {
            offSetX = offSetX * -1;
            offSetY = offSetY * -1;
        } else if (271 <= rel && rel <= 369) {
            offSetY = offSetY * -1;
        }

        if (this.isAnyoneGoingToHitMe([...podTracking.enemyPods])) {
            thrust = 'SHIELD';
        }

        if (pod.nextCheckPointId === raceInfo.checkPointToDefend) {
            point = 'pod';
        } else {
            point = 'checkpoint';
            if (distance < 2000 && thrust !== 'SHIELD') {
                point = 'pod';
            }
        }
 

        if (point === 'pod') {
            var relative = HelperMethods.getRelativeAngle(this, pod);
            var difference = HelperMethods.getAngleDifference(relative, this.angle);
            thrust = 100 - Math.floor(difference / 2);
            this.moveToPoint(pod.positionX + Math.floor(pod.speedX * 3.5), pod.positionY + Math.floor(pod.speedY * 3.5), thrust);
        } else {
            var offSetPoint = new Point((checkPoint.positionX + offSetX).toString(), (checkPoint.positionY + offSetY).toString());
            var relative = HelperMethods.getRelativeAngle(this, offSetPoint);
            var difference = HelperMethods.getAngleDifference(relative, this.angle);
            if (distance < 2000 && thrust !== 'SHIELD') {
                thrust = 0;
            }else{
                thrust = 100 - Math.floor(difference / 2);
            }
            this.moveToPoint(checkPoint.positionX + offSetX, checkPoint.positionY + offSetY, thrust);
        }
        var oneCheckPointAhead = pod.nextCheckPointId + 1;
        if (oneCheckPointAhead > raceInfo.checkPoints.length - 1) {
            oneCheckPointAhead = 0;
        }

        var nextCp = HelperMethods.getCheckPointsAhead(raceInfo.checkPointToDefend, 1);
        var delta = Math.floor(raceInfo.checkPoints.length / 3);
        if (nextCp === pod.nextCheckPointId) {
            raceInfo.checkPointToDefend = HelperMethods.getCheckPointsAhead(pod.nextCheckPointId, delta);
        }
    }
};

class CheckPoint extends Point {
    id: number = 0;
    constructor(id: number, x: string, y: string) {
        super(x, y);
        this.id = id;
    }
};

class NextCheckPoint extends Point {
    id: string;
    distance: number;
    angle: number;
    constructor(pX: string, pY: string, distance: string, angle: string) {
        super(pX, pY);
        this.id = `${pX}${pY}`;
        this.distance = parseInt(distance);
        this.angle = parseInt(angle);
    }
};

class HelperMethods {
    static initializePods(): PodTracking {
        var podTracking = new PodTracking();
        // My Pods
        for (var i = 0; i < 2; i++) {
            var inputs = readline().split(' ');
            podTracking.myPods.push(new Pod(i, inputs[0], inputs[1], inputs[2], inputs[3], inputs[4], inputs[5]))
        }
        // Enemy Pods
        for (var i = 0; i < 2; i++) {
            var inputs = readline().split(' ');
            podTracking.enemyPods.push(new Pod(i + 2, inputs[0], inputs[1], inputs[2], inputs[3], inputs[4], inputs[5]))
        }

        if (podTracking.enemyPods[0].nextCheckPointId !== checkPointTracking.enemyPod0LastCheckPoint) {
            checkPointTracking.enemyPod0Danger++;
            checkPointTracking.enemyPod0LastCheckPoint = podTracking.enemyPods[0].nextCheckPointId;
        }

        if (podTracking.enemyPods[1].nextCheckPointId !== checkPointTracking.enemyPod1LastCheckPoint) {
            checkPointTracking.enemyPod1Danger++;
            checkPointTracking.enemyPod1LastCheckPoint = podTracking.enemyPods[1].nextCheckPointId;
        }

        if (checkPointTracking.enemyPod0Danger > checkPointTracking.enemyPod1Danger) {
            checkPointTracking.enemyPod0Danger++;
        } else if (checkPointTracking.enemyPod0Danger < checkPointTracking.enemyPod1Danger) {
            checkPointTracking.enemyPod1Danger++
        }
        return podTracking;
    }


    static toDegrees(rad: number): number {
        return rad * (180 / Math.PI)
    }

    static getDistanceBetween(pod1: Point, pod2: Point) {
        var a = pod1.positionX - pod2.positionX;
        var b = pod1.positionY - pod2.positionY;
        return Math.sqrt(a * a + b * b);
    }

    static getDistanceAccountingForVelocity(pod1: Pod, pod2: Pod) {
        var a = (pod1.positionX + pod1.speedX) - (pod2.positionX + pod2.speedX);
        var b = (pod1.positionY + pod1.speedY) - (pod2.positionY + pod2.speedY);
        return Math.sqrt(a * a + b * b);
    }

    static getRelativeAngle(pod: Point, target: Point): number {
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
        } else if (deltaX < 0 && deltaY > 0) {
            // bottom left
            targetAngle = 360 - angle;
        } else if (deltaX > 0 && deltaY > 0) {
            // bottom right
            targetAngle = angle + 180;
        } else if (deltaX > 0 && deltaY < 0) {
            // top right
            targetAngle = 180 - angle;
        }

        return Math.floor(targetAngle);
    }

    static getCheckPointsAhead(checkPointId: number, n: number): number {
        if (n < 0) {
            n = raceInfo.checkPoints.length - n;
        }

        var cpAhead = checkPointId + n;
        if (cpAhead > raceInfo.checkPoints.length - 1) {
            return cpAhead % (raceInfo.checkPoints.length - 1);
        }
        return cpAhead;
    }

    static getAngleDifference(angle1: number, angle2: number) {
        var dist = (angle1 - angle2 + 180 + 360) % 360 - 180
        return Math.abs(dist);
    }

}

class Debug {
    static print(value: any) {
        printErr(JSON.stringify(value));
    }
}

var raceInfo = new RaceInfo();
var podTracking: PodTracking;
var checkPointTracking = new CheckPointTracking();
raceInfo.laps = parseInt(readline());
var checkpointCount = parseInt(readline());
for (var i = 0; i < checkpointCount; i++) {
    var inputs = readline().split(' ');
    var checkpointX = inputs[0];
    var checkpointY = inputs[1];
    raceInfo.checkPoints.push(new CheckPoint(i, checkpointX, checkpointY));
}
raceInfo.checkPointToDefend = Math.floor(raceInfo.checkPoints.length / 3);
// game loop
while (true) {
    raceInfo.frames++;
    if (raceInfo.shieldTimeout > 0) {
        raceInfo.shieldTimeout--;
    }
    podTracking = HelperMethods.initializePods();

    var racer = podTracking.myPods[0];
    var defender = podTracking.myPods[1];

    var rThrust: number | string = 100;
    var dThrust: number | string = 100;

    if (!racer.hasTargetInFront(raceInfo.nextCheckPoint(racer))) {
        rThrust = 0;
    }
    Debug.print("while")
    var relative = HelperMethods.getRelativeAngle(racer, raceInfo.nextCheckPoint(racer));
    var allowed = racer.getAllowedAngleForPredicting(raceInfo.nextCheckPoint(racer));
    var difAngle = HelperMethods.getAngleDifference(relative, racer.angle);
    var distance = HelperMethods.getDistanceBetween(racer, raceInfo.nextCheckPoint(racer));
    if (allowed < difAngle) {
        rThrust = 100;
    } else {
        if (distance < 3000) {
            var angleToNext = 180 - racer.getAngleToNextCheckPoint()
            rThrust = 100 - Math.floor(angleToNext / 5);
            if (rThrust < 1) {
                rThrust = 10;
            }
        }
    }

    if (raceInfo.frames === 1) {
        rThrust = 'BOOST';
    }

    if (racer.isAnyoneGoingToHitMe([...podTracking.enemyPods]) && raceInfo.shieldTimeout === 0) {
        racer.moveToPoint(raceInfo.nextCheckPoint(racer).positionX, raceInfo.nextCheckPoint(racer).positionY, "SHIELD");
        raceInfo.shieldTimeout = 20;
    } else {
        racer.moveToPoint(raceInfo.nextCheckPoint(racer).positionX - racer.speedX, raceInfo.nextCheckPoint(racer).positionY - racer.speedY, rThrust);
    }

    var enemyPod = podTracking.enemyPods[checkPointTracking.getMostDangerous()];
    if (!defender.hasTargetInFront(enemyPod)) {
        dThrust = 0;
    }
    defender.defendCheckPointFrom(podTracking.enemyPods[checkPointTracking.getMostDangerous()]);
}
