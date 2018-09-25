///<reference path="definitions.d.ts" />

class RaceInfo {
    frames: number = 0;
    laps: number = 0;
    checkPoints: CheckPoint[] = [];
    checkPointCount: number = 0;
    lastCheckPointId: number = 0;
    checkPointToDefend: number = 0;
    checkPoint(index: number) {
        return this.checkPoints[index];
    }
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
            hit:hitting,
            d1: HelperMethods.getDistanceBetween(myPod, podTracking.enemyPods[0]),
            d2: HelperMethods.getDistanceBetween(myPod, podTracking.enemyPods[1])
        });
        return hitting > -1;
    }

    defendCheckPointFrom(pod: Pod) {
        // Update checkpoint to defend
        if (raceInfo.checkPointToDefend < pod.nextCheckPointId) {
            var twoCheckPointsAheadIndex = pod.nextCheckPointId + 1;
            var checkPointId = (raceInfo.lastCheckPointId < twoCheckPointsAheadIndex ? 0 : twoCheckPointsAheadIndex)
            raceInfo.checkPointToDefend = checkPointId;
        }

        var checkPoint = raceInfo.checkPoint(raceInfo.checkPointToDefend);
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
            this.moveToPoint(pod.positionX + Math.floor(pod.speedX * 1.5), pod.positionY + Math.floor(pod.speedY * 1.5), thrust);
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
        for (var i = 0; i < 2; i++) {
            var inputs = readline().split(' ');
            podTracking.myPods.push(new Pod(i, inputs[0], inputs[1], inputs[2], inputs[3], inputs[4], inputs[5]))
        }
        for (var i = 0; i < 2; i++) {
            var inputs = readline().split(' ');
            podTracking.enemyPods.push(new Pod(i + 2, inputs[0], inputs[1], inputs[2], inputs[3], inputs[4], inputs[5]))
        }
        return podTracking;
    }
    static getDistanceBetween(pod1: Pod | CheckPoint, pod2: Pod | CheckPoint) {
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
        if(relative === racer.angle){
            rThrust = 100;
        }else{
            var difference = HelperMethods.getAngleDifference(relative, racer.angle);
            rThrust = 100 - Math.floor(difference/2);
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
