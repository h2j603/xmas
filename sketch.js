let myFont;
let img;
let cachedPoints = [];
let zoom = 1.0;
let offset;
let isFontLoaded = false;

function setup() {
    const w = parseInt(select('#canvasW').value());
    const h = parseInt(select('#canvasH').value());
    let canvas = createCanvas(w, h);
    canvas.parent('canvas-holder');
    
    offset = createVector(0, 0);
    
    // 폰트 로드 (콜백 방식 사용으로 로딩 멈춤 방지)
    const fontURL = 'https://open-font-stack.s3.amazonaws.com/fonts/roboto/Roboto-Regular.ttf';
    myFont = loadFont(fontURL, 
        () => { isFontLoaded = true; generateCachedPoints(); },
        () => { console.log("Font load failed, using default."); isFontLoaded = true; }
    );
    
    // UI 이벤트 바인딩
    select('#resizeBtn').mousePressed(updateCanvas);
    select('#saveBtn').mousePressed(() => saveCanvas('AOYSTU_GEN', 'png'));
    select('#imageInput').changed(handleImage);
    select('#textInput').input(generateCachedPoints);
}

function draw() {
    background(10);
    
    if (!isFontLoaded) {
        fill(255);
        textAlign(CENTER, CENTER);
        text("LOADING ENGINE...", width/2, height/2);
        return;
    }

    push();
    translate(width/2 + offset.x, height/2 + offset.y);
    scale(zoom);
    translate(-width/2, -height/2);

    if (cachedPoints.length === 0) {
        fill(50);
        textAlign(CENTER, CENTER);
        text("UPLOAD IMAGE TO START", width/2, height/2);
    }

    for (let p of cachedPoints) {
        noStroke();
        fill(p.clr);
        circle(p.x, p.y, p.size);

        if (p.isDecor) {
            stroke(select('#vertexColor').value());
            strokeWeight(1);
            noFill();
            circle(p.x, p.y, p.size * 2.5);
            noStroke();
            fill(255);
            textSize(10);
            text(p.id, p.x + 8, p.y);
        }
    }
    pop();
}

function generateCachedPoints() {
    if (!isFontLoaded) return;
    
    let txt = select('#textInput').value() || " ";
    // 화면 크기에 맞춰 텍스트 크기 자동 조절
    let fontSize = min(width, height) * 0.5;
    
    let pts = myFont.textToPoints(txt, width * 0.1, height * 0.6, fontSize, {
        sampleFactor: 0.1,
        simplifyThreshold: 0
    });

    cachedPoints = pts.map((p, i) => {
        let clr = [60, 60, 60];
        if (img) {
            let imgX = map(p.x, 0, width, 0, img.width);
            let imgY = map(p.y, 0, height, 0, img.height);
            clr = img.get(imgX, imgY);
        }
        randomSeed(i);
        return { 
            x: p.x, y: p.y, clr: clr, 
            isDecor: random(1) < 0.05, 
            id: i, size: 5 
        };
    });
}

function updateCanvas() {
    let w = parseInt(select('#canvasW').value());
    let h = parseInt(select('#canvasH').value());
    resizeCanvas(w, h);
    generateCachedPoints();
}

function handleImage(e) {
    if (e.target.files.length > 0) {
        img = loadImage(URL.createObjectURL(e.target.files[0]), generateCachedPoints);
    }
}

// 줌 및 드래그 (캔버스 영역에서만 작동하도록 제한)
function mouseWheel(event) {
    if (mouseY < height) {
        zoom -= event.delta * 0.001;
        zoom = constrain(zoom, 0.1, 5);
        return false;
    }
}

function mouseDragged() {
    if (mouseY < height) {
        offset.x += mouseX - pmouseX;
        offset.y += mouseY - pmouseY;
    }
}
