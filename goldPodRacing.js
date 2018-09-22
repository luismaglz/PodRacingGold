///<reference path="definitions.d.ts" />
class RaceInfo {
    constructor() {
        this.laps = 0;
        this.checkPoints = [];
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
    constructor() {
        super(...arguments);
        this.speedX = 0;
        this.speedY = 0;
        this.angle = 0;
        this.nextCheckPointId = 0;
    }
    moveToPoint(x, y, thrust) {
        return print(`${x} ${y} ${thrust}`);
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
}
class Debug {
    static print(value) {
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
podTracking.myPods = [new Pod('0', '0'), new Pod('0', '0')];
podTracking.enemyPods = [new Pod('0', '0'), new Pod('0', '0')];
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
