///<reference path="definitions.d.ts" />

class RaceInfo {
    laps: number = 0;
    checkPoints: CheckPoint[] = [];
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
    speedX: number = 0;
    speedY: number = 0;
    angle: number = 0;
    nextCheckPointId: number = 0;

    moveToPoint(x: number, y: number, thrust: number | string) {
        return print(`${x} ${y} ${thrust}`);
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
}

class Debug {
    static print(value: any) {
        printErr(JSON.stringify(value));
    }
}

var raceInfo = new RaceInfo();
var podTracking = new PodTracking();
raceInfo.laps = parseInt(readline());
var checkpointCount = parseInt(readline());
for (var i = 0; i < checkpointCount; i++) {
    var inputs = readline().split(' ');
    var checkpointX = inputs[0];
    var checkpointY = inputs[1];
    raceInfo.checkPoints.push(new CheckPoint(i, checkpointX, checkpointY));
}

podTracking.myPods = [new Pod('0','0'), new Pod('0','0')];
podTracking.enemyPods = [new Pod('0','0'), new Pod('0','0')];

// game loop
while (true) {
    for (var i = 0; i < 2; i++) {
        var inputs = readline().split(' ');
        podTracking.myPods[i].positionX = parseInt(inputs[0]);
        podTracking.myPods[i].positionY = parseInt(inputs[1]);
        podTracking.myPods[i].speedX = parseInt(inputs[2]);
        podTracking.myPods[i].speedY = parseInt(inputs[3]);
        podTracking.myPods[i].angle = parseInt(inputs[4]);
        podTracking.myPods[i].nextCheckPointId = parseInt(inputs[5]);
    }
    for (var i = 0; i < 2; i++) {
        var inputs = readline().split(' ');
        podTracking.enemyPods[i].positionX = parseInt(inputs[0]);
        podTracking.enemyPods[i].positionY = parseInt(inputs[1]);
        podTracking.enemyPods[i].speedX = parseInt(inputs[2]);
        podTracking.enemyPods[i].speedY = parseInt(inputs[3]);
        podTracking.enemyPods[i].angle = parseInt(inputs[4]);
        podTracking.enemyPods[i].nextCheckPointId = parseInt(inputs[5]);
    }

    // Write an action using print()
    // To debug: printErr('Debug messages...');


    // You have to output the target position
    // followed by the power (0 <= thrust <= 100)
    // i.e.: "x y thrust"
    print('8000 4500 100');
    print('8000 4500 100');
}


