let myFont;
let img;
let cachedPoints = []; // 최적화의 핵심: 좌표와 색상을 미리 계산해 저장
let zoom = 1.0;
let offset;

function preload() {
    // textToPoints 구동을 위한 최소한의 가벼운 폰트 로드
    myFont = loadFont('https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/Roboto-Regular.ttf');
}

function setup() {
    const w = parseInt(select('#canvasW').value());
    const h = parseInt(select('#canvasH').value());
    let canvas = createCanvas(w, h);
    canvas.parent('canvas-holder');
    
    offset = createVector(0, 0);
    
    // UI 이벤트 바인딩
    select('#resizeBtn').mousePressed(updateCanvas);
    select('#saveBtn').mousePressed(() => saveCanvas('output', 'png'));
    select('#imageInput').changed(handleImage);
    select('#textInput').input(generateCachedPoints); // 텍스트 입력 시 즉시 갱신
    
    generateCachedPoints();
}

function draw() {
    background(0);
    
    push();
    translate(width/2 + offset.x, height/2 + offset.y);
    scale(zoom);
    translate(-width/2, -height/2);

    // 연산 없이 저장된 점들만 빠르게 렌더링
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
            text(p.id, p.x + 10, p.y);
        }
    }
    pop();
}

// 핵심 최적화 함수: 점의 좌표와 해당 위치의 색상을 미리 계산
function generateCachedPoints() {
    let txt = select('#textInput').value() || " ";
    let pts = myFont.textToPoints(txt, width * 0.1, height * 0.6, width * 0.4, {
        sampleFactor: 0.12, 
        simplifyThreshold: 0
    });

    cachedPoints = pts.map((p, i) => {
        let clr = [150, 150, 150]; // 기본 색상 (이미지 없을 때)
        if (img) {
            let imgX = map(p.x, 0, width, 0, img.width);
            let imgY = map(p.y, 0, height, 0, img.height);
            clr = img.get(imgX, imgY);
        }
        
        // 장식 여부를 미리 결정
        randomSeed(i);
        let isDecor = random(1) < 0.05;

        return { x: p.x, y: p.y, clr: clr, isDecor: isDecor, id: i, size: 5 };
    });
}

function updateCanvas() {
    resizeCanvas(parseInt(select('#canvasW').value()), parseInt(select('#canvasH').value()));
    generateCachedPoints();
}

function handleImage(e) {
    if (e.target.files.length > 0) {
        img = loadImage(URL.createObjectURL(e.target.files[0]), generateCachedPoints);
    }
}

// 터치 및 마우스 인터랙션
function mouseWheel(event) {
    if (mouseY < height) {
        zoom -= event.delta * 0.001;
        zoom = constrain(zoom, 0.1, 10);
        return false;
    }
}

function mouseDragged() {
    if (mouseY < height) {
        offset.x += mouseX - pmouseX;
        offset.y += mouseY - pmouseY;
    }
}
