const G = 6.67408/1e11;
const zoom = .000000002;
const diameterMultiplier = 50;
const diameterIntercept = -300;
const diameterAntiZoom = 20000000;

const yearDuration = 30;  // seconds
const frameDelay = 10;
const showTrack = false;
const dt = (365.25 * 24 * 60 * 60) / 1000 * frameDelay / yearDuration;  // seconds in an hour

var canvas;
var ctx;
var loopTimer;
var bodies = [];
var ticks = 0;

class Body {
    constructor(name, color, mass, diameter, x, y, velocity_x, velocity_y) {
        this.name = name;
        this.color = color;
        this.mass = mass;                           // in kg
        this.diameter = diameter                    // in m
        this.x = x;                                 // in m
        this.y = y;                                 // in m
        this.velocity_x = velocity_x;               // in m/s
        this.velocity_y = velocity_y;               // in m/s
        this.old_x = [];
        this.old_y = [];
        
        this.displayDiameter = (Math.log10(diameter) * diameterMultiplier + diameterIntercept) * diameterAntiZoom;
        if (this.displayDiameter < 0) { this.displayDiameter = 1;}
    }
}

const setup = function () {
    canvas = document.getElementById('space');
    ctx = canvas.getContext('2d');

    ctx.canvas.width  = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    
    let sun = new Body('Sun', '#FFE900', 1.98847e30, 1.392700e9, 0, 0, 0, 0);
    let mercury = new Body('Mercury', '#ddbbcc', 3.285e23, 4.879e6, 6.9818e10, 0, 0, 38860);
    let venus = new Body('Venus', '#3A8D2F', 4.867e24, 1.2104e7, 1.0756e11, 0, 0, 35020);
    let earth = new Body('Earth', '#008AD8', 5.9722e24, 1.2742e7, 1.49e11, 0, 0, 29780);
    let moon = new Body('Moon', '#ffffff', 7.346e22, 1.7381e3, earth.x + 4.055e8, earth.y, earth.velocity_x, earth.velocity_y + 970);
    let mars = new Body('Mars', '#aa0000', 6.39e23, 6.779e6, 2.493e11, 0, 0, 21970);
    let jupiter = new Body('Jupiter', '#E2C0B8', 1.89813e27, 1.3982e8, 7.4186e11, 0, 0, 13070);
    let comet = new Body('Halley\' Comet', '#EFCFFA', 2.2e14, 1e4, -9.2633543328e10, 2.55365362125e11, 26151.38065026183, -16758.86041256348);

    bodies.push(sun);
    bodies.push(mercury);
    bodies.push(venus);
    bodies.push(earth);
    // bodies.push(moon);
    bodies.push(mars);
    bodies.push(jupiter);
    bodies.push(comet);
    render();

    loopTimer = setInterval(loop, frameDelay);
}

const render = function () {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    for (const body of bodies) {
        if (body.name == 'Haley\' Comet') {
            console.log(body.x, body.y, body.velocity_x, body.velocity_y);
        }
        if (showTrack) {
            drawTrack(body);
        }
        drawBody(body);
    }
}

const drawBody = function(body) {
    body.circle = drawCircle(body.x * zoom, body.y * zoom, body.displayDiameter * zoom, body.color, null, null);    
}

const drawTrack = function(body) {

    for (let i = 0; i < body.old_x.length; i++) {
        drawPoint(body.old_x[i] * zoom, body.old_y[i] * zoom, body.color, 1);
    }
}

const drawPoint = function(x, y, stroke, strokeWidth) {
    let width = canvas.clientWidth;
    let height = canvas.clientHeight;

    ctx.fillStyle = '#555555';
    ctx.fillRect((width + x) / 2, (height + y) / 2, strokeWidth, strokeWidth);
}

const drawCircle = function (x, y, radius, fill, stroke, strokeWidth) {
    let circle = new Path2D();      
    let width = canvas.clientWidth;
    let height = canvas.clientHeight;

    circle.arc((width + x) / 2, (height + y) / 2, radius < 1 ? 1 : radius, 0, 2 * Math.PI, false);

    if (fill) {
        ctx.fillStyle = fill;
        ctx.fill(circle); 
    }
    
    if (stroke) {
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = stroke
        ctx.stroke(circle);  
    }

    return circle;
}

const getForceAndDistance = function(body0, body1) {
    const distanceSquared = Math.pow(body1.x - body0.x, 2) + Math.pow(body1.y - body0.y, 2);   
    const distance = Math.sqrt(distanceSquared);   
    const force = (G * body0.mass * body1.mass) / distanceSquared;
    
    return [force, distance];
}

const updatePositions = function() {

    for (let i = 0; i < bodies.length; i++) { // obviously this is O(n^2), may need to ignore some combos
        for (let j = i + 1; j < bodies.length; j++) {
            const [force, distance] = getForceAndDistance(bodies[i], bodies[j]);   //  force in newtons = kg * m / s^2  

            const distance_x = bodies[j].x - bodies[i].x;
            const distance_y = bodies[j].y - bodies[i].y;

            updateVelocity(bodies[i], -force, distance, distance_x, distance_y);
            updateVelocity(bodies[j], force, distance, distance_x, distance_y);                   
        }
    }      
    
    for (const body of bodies) {

        if (showTrack) {
            body.old_x.push(body.x);
            body.old_y.push(body.y);
        }

        body.x += body.velocity_x * dt;
        body.y += body.velocity_y * dt;   
    }    
}

const updateVelocity = function(body, force, distance, distance_x, distance_y) {
    const acceleration = force / body.mass;  //  in m / s^2

    const acceleration_x = -acceleration * distance_x / distance;
    const acceleration_y = -acceleration * distance_y / distance;

    const velocity_delta_x = acceleration_x;
    const velocity_delta_y = acceleration_y;

    body.velocity_x += velocity_delta_x * dt;
    body.velocity_y += velocity_delta_y * dt; 
}

const loop = function () { 
    updatePositions();
    render();

    ticks++;
    // if (ticks > 0) { clearInterval(loopTimer); }
}

setup();