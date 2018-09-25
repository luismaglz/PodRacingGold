///<reference path="definitions.d.ts" />

class RaceInfo {
    frames: number = 0;
    laps: number = 0;
    checkPoints: CheckPoint[] = [];
    checkPointToDefend: number = 0;
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
        var targetAngle = HelperMethods.getRelativeAngle(this, target) + 360;
        var anglediff = (this.angle - targetAngle + 180 + 360) % 360 - 180
        return (anglediff <= delta && anglediff >= -delta);
    }

    isAnyoneGoingToHitMe(pods: Pod[]) {
        var myPod = this;
        var hitting = pods.findIndex(pod => HelperMethods.getDistanceBetween(myPod, pod) < 1000);
        Debug.print({
            hit: hitting,
            d1: HelperMethods.getDistanceBetween(myPod, podTracking.enemyPods[0]),
            d2: HelperMethods.getDistanceBetween(myPod, podTracking.enemyPods[1])
        });
        return hitting > -1;
    }

    defendCheckPointFrom(pod: Pod) {
        // Update checkpoint to defend
        var checkPoint = raceInfo.checkPoints[raceInfo.checkPointToDefend];
        var thrust = null;
        var distance = HelperMethods.getDistanceBetween(this, checkPoint);
        var point = checkPoint;

        var podDistanceFromCheckPoint = HelperMethods.getDistanceBetween(pod, checkPoint);

        if (this.isAnyoneGoingToHitMe([...podTracking.enemyPods])) {
            thrust = 'SHIELD';
        } else {
            thrust = 100;
        }

        if (podDistanceFromCheckPoint < 4000) {
            this.moveToPoint(pod.positionX + Math.floor(pod.speedX * 1.5), pod.positionY + Math.floor(pod.speedY * 1.5), "BOOST");
        } else {
            if (distance < 2500 && thrust !== 'SHIELD') {
                thrust = 30
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

        if (raceInfo.checkPointToDefend === pod.nextCheckPointId) {
            var twoCheckPointsAheadIndex = pod.nextCheckPointId + 2;
            if (twoCheckPointsAheadIndex > raceInfo.checkPoints.length - 1) {
                raceInfo.checkPointToDefend = twoCheckPointsAheadIndex % (raceInfo.checkPoints.length - 1);
            } else {
                raceInfo.checkPointToDefend = twoCheckPointsAheadIndex;
            }
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
            checkPointTracking.enemyPod0LastCheckPoint = checkPointTracking.enemyPod0LastCheckPoint;
        }

        if (podTracking.enemyPods[1].nextCheckPointId !== checkPointTracking.enemyPod1LastCheckPoint) {
            checkPointTracking.enemyPod1Danger++;
            checkPointTracking.enemyPod1LastCheckPoint = checkPointTracking.enemyPod1LastCheckPoint;
        }

        return podTracking;
    }
    static getDistanceBetween(pod1: Point, pod2: Point) {
        var a = pod1.positionX - pod2.positionX;
        var b = pod1.positionY - pod2.positionY;
        return Math.sqrt(a * a + b * b);
    }

    static getRelativeAngle(pod: Pod, target: CheckPoint | Pod): number {
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
raceInfo.checkPointToDefend = 2;
// game loop
while (true) {
    raceInfo.frames++;
    podTracking = HelperMethods.initializePods();

    var racer = podTracking.myPods[0];
    var defender = podTracking.myPods[1];

    var rThrust: number | string = 100;
    var dThrust: number | string = 100;

    if (!racer.hasTargetInFront(raceInfo.nextCheckPoint(racer))) {
        rThrust = 0;
    }

    if (raceInfo.frames === 1) {
        rThrust = 'BOOST';
    }


    if (!defender.hasTargetInFront(podTracking.enemyPods[1])) {
        dThrust = 0;
    } else {
        var nextCheckPoint = raceInfo.nextCheckPoint(racer);
        var relative = HelperMethods.getRelativeAngle(racer, nextCheckPoint);
        if (relative === racer.angle) {
            rThrust = 100;
        } else {
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
    var futurePod = new Point((racer.positionX + racer.speedX).toString(), (racer.positionY + racer.positionY).toString());
    var predictedDistance = HelperMethods.getDistanceBetween(racer, raceInfo.checkPoints[1]);
    Debug.print({distance:predictedDistance});
    
    if (predictedDistance < 600) {
        Debug.print('moving ahead');
        var checkPointAheadIndex = (racer.nextCheckPointId + 1 > raceInfo.checkPoints.length ? 0 :racer.nextCheckPointId + 1);
        var checkPointAhead = raceInfo.checkPoints[checkPointAheadIndex];

        var relative = HelperMethods.getRelativeAngle(racer, checkPointAhead);
        if (relative === racer.angle) {
            rThrust = 100;
        } else {
            var difference = HelperMethods.getAngleDifference(relative, racer.angle);
            rThrust = 100 - Math.floor(difference / 2);
        }

        racer.moveToPoint(checkPointAhead.positionX, checkPointAhead.positionY, rThrust);
    } else {
        racer.moveToPoint(raceInfo.nextCheckPoint(racer).positionX, raceInfo.nextCheckPoint(racer).positionY, rThrust);
    }

    defender.defendCheckPointFrom(podTracking.enemyPods[checkPointTracking.getMostDangerous()]);
}
