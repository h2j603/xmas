let myFont;
let img;
let points = [];
let zoom = 1.0;
let offset;
let canvas;

// UI Elements
let textInput, canvasW, canvasH, vertexColor, resizeBtn, saveBtn, imageInput;

function preload() {
    // Using a default Google Font (Roboto) as a proxy for the web font
    myFont = loadFont('https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/Roboto-Regular.ttf');
}

function setup() {
    const holder = select('#canvas-holder');
    const w = parseInt(select('#canvasW').value());
    const h = parseInt(select('#canvasH').value());
    
    canvas = createCanvas(w, h);
    canvas.parent(holder);
    
    offset = createVector(0, 0);
    
    // UI Connections
    textInput = select('#textInput');
    canvasW = select('#canvasW');
    canvasH = select('#canvasH');
    vertexColor = select('#vertexColor');
    resizeBtn = select('#resizeBtn');
    saveBtn = select('#saveBtn');
    imageInput = select('#imageInput');

    resizeBtn.mousePressed(handleResize);
    saveBtn.mousePressed(() => saveCanvas('myGraphic', 'png'));
    imageInput.changed(handleImage);

    generatePoints();
}

function draw() {
    background(20);

    push();
    // Zoom and Pan transformations
    translate(width / 2 + offset.x, height / 2 + offset.y);
    scale(zoom);
    translate(-width / 2, -height / 2);

    if (img) {
        // Draw the points composed of the image
        noStroke();
        for (let i = 0; i < points.length; i++) {
            let p = points[i];
            
            // Sample color from image based on point coordinate
            // Mapping canvas space to image space
            let imgX = map(p.x, width/4, width*0.75, 0, img.width);
            let imgY = map(p.y, height/4, height*0.75, 0, img.height);
            let c = img.get(imgX, imgY);
            
            fill(c);
            circle(p.x, p.y, 4); // The "Method B" circles

            // Random decorative points (approx. 5% of total points)
            // Using seed for consistency during draw loops
            randomSeed(i); 
            if (random(1) < 0.05) {
                fill(vertexColor.value());
                circle(p.x, p.y, 8);
                fill(255);
                textSize(8);
                textAlign(CENTER, CENTER);
                text(i, p.x, p.y - 10);
            }
        }
    } else {
        // Placeholder text if no image uploaded
        fill(100);
        textAlign(CENTER, CENTER);
        text("Please upload an image to see the effect", width/2, height/2);
    }
    pop();
}

function generatePoints() {
    // Converts text to a path of points
    points = myFont.textToPoints(textInput.value(), width / 6, height / 1.8, 150, {
        sampleFactor: 0.15, // Density of points
        simplifyThreshold: 0
    });
}

function handleResize() {
    const w = parseInt(canvasW.value());
    const h = parseInt(canvasH.value());
    resizeCanvas(w, h);
    generatePoints();
}

function handleImage(e) {
    if (e.target.files.length > 0) {
        let file = e.target.files[0];
        img = loadImage(URL.createObjectURL(file), () => {
            generatePoints();
        });
    }
}

// Interaction: Zoom
function mouseWheel(event) {
    if (mouseX > 260) { // Only zoom if mouse is over canvas area
        let zoomAmount = -event.delta * 0.001;
        zoom += zoomAmount;
        zoom = constrain(zoom, 0.1, 5.0);
        return false;
    }
}

// Interaction: Pan (Drag)
function mouseDragged() {
    if (mouseX > 260) {
        offset.x += mouseX - pmouseX;
        offset.y += mouseY - pmouseY;
    }
}

// Update points when text changes
function keyReleased() {
    generatePoints();
}
