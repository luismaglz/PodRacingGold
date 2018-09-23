///<reference path="definitions.d.ts" />

class RaceInfo {
    frames: number = 0;
    laps: number = 0;
    checkPoints: CheckPoint[] = [];
    checkPointCount: number = 0;
    lastCheckPointId: number = 0;
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
        // this.setVisibleRange();
    }

    moveToPoint(x: number, y: number, thrust: number | string) {
        return print(`${x} ${y} ${thrust}`);
    }

    hasTargetInFront(target: CheckPoint | Pod): boolean {
        var targetAngle = HelperMethods.getRelativeAngle(this, target) + 360;
        var anglediff = (this.angle - targetAngle + 180 + 360) % 360 - 180
        return (anglediff <= this.boundDelta && anglediff >= -this.boundDelta)
    }
};

class CheckPoint extends Point {
    id: number = 0;
    constructor(id: number, x: string, y: string) {
        super(x, y);
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
    static getAllowedAngleForPredicting(checkPoint: CheckPoint, pod: Pod): number {
        var distanceToCheckpoint = this.getDistanceBetween(checkPoint, pod);
        var checkPointRadius = 300;
        var angleOfAttack = Math.atan(checkPointRadius / distanceToCheckpoint) * (180 / Math.PI);
        return angleOfAttack;
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
            targetAngle = angle + 270;
        } else if (deltaX > 0 && deltaY > 0) {
            // bottom right
            targetAngle = angle + 180;
        } else if (deltaX > 0 && deltaY < 0) {
            // top right
            targetAngle = angle + 90;
        }

        return Math.floor(targetAngle);
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

    var paco = podTracking.myPods[0];
    var megan = podTracking.myPods[1];

    var pacoThrust:number|string = 100;
    var meganThrust:number|string = 100;

    if (!paco.hasTargetInFront(raceInfo.nextCheckPoint(paco))) {
        pacoThrust = 0;
    }

    if (raceInfo.frames === 1){
        pacoThrust = 'BOOST';
    }

    
    if (!megan.hasTargetInFront(podTracking.enemyPods[1])) {
        meganThrust = 50;
    }

    var distance =  Math.floor(HelperMethods.getDistanceBetween(megan, podTracking.enemyPods[1]));

    paco.moveToPoint(raceInfo.nextCheckPoint(paco).positionX, raceInfo.nextCheckPoint(paco).positionY, pacoThrust);
    megan.moveToPoint((podTracking.enemyPods[1].positionX + podTracking.enemyPods[1].speedX * 10) , (podTracking.enemyPods[1].positionY + podTracking.enemyPods[1].speedY * 10) , meganThrust);
}
