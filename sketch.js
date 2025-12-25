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
    
    // 폰트 로드
    const fontURL = 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/Roboto-Regular.ttf';
    myFont = loadFont(fontURL, 
        () => { isFontLoaded = true; console.log("Font Ready"); },
        () => { isFontLoaded = true; console.log("Font Fail - Use Default"); }
    );
    
    // UI 이벤트
    select('#convertBtn').mousePressed(generateCachedPoints); // 변환 버튼 클릭 시에만 실행
    select('#resizeBtn').mousePressed(updateCanvas);
    select('#saveBtn').mousePressed(() => saveCanvas('AOYSTU_GEN', 'png'));
    select('#imageInput').changed(handleImage);
}

function draw() {
    background(0);
    
    if (!isFontLoaded) {
        fill(255);
        textAlign(CENTER, CENTER);
        text("LOADING FONT...", width/2, height/2);
        return;
    }

    push();
    translate(width/2 + offset.x, height/2 + offset.y);
    scale(zoom);
    translate(-width/2, -height/2);

    if (cachedPoints.length === 0) {
        fill(100);
        textAlign(CENTER, CENTER);
        text("1. SELECT PHOTO\n2. CLICK CONVERT", width/2, height/2);
    }

    for (let p of cachedPoints) {
        noStroke();
        fill(p.clr);
        circle(p.x, p.y, p.size);

        if (p.isDecor) {
            stroke(select('#vertexColor').value());
            strokeWeight(1);
            noFill();
            circle(p.x, p.y, p.size * 2.2);
            noStroke();
            fill(255);
            textSize(9);
            text(p.id, p.x + 7, p.y - 7);
        }
    }
    pop();
}

function generateCachedPoints() {
    if (!isFontLoaded) return;
    
    let txt = select('#textInput').value() || " ";
    let fontSize = min(width, height) * 0.6;
    
    // 텍스트를 포인트로 변환
    let pts = myFont.textToPoints(txt, width * 0.1, height * 0.65, fontSize, {
        sampleFactor: 0.15, 
        simplifyThreshold: 0
    });

    // 이미지 픽셀 데이터 로드 확인
    if (img) {
        img.loadPixels();
    }

    cachedPoints = pts.map((p, i) => {
        let clr = [80, 80, 80]; // 기본 회색
        
        if (img && img.width > 0) {
            // 캔버스 좌표를 이미지 좌표로 맵핑 (안전하게 계산)
            let imgX = floor(map(p.x, 0, width, 0, img.width));
            let imgY = floor(map(p.y, 0, height, 0, img.height));
            
            // 이미지 범위 안인지 체크 후 색상 추출
            if (imgX >= 0 && imgX < img.width && imgY >= 0 && imgY < img.height) {
                clr = img.get(imgX, imgY);
            }
        }
        
        randomSeed(i);
        return { 
            x: p.x, y: p.y, clr: clr, 
            isDecor: random(1) < 0.05, 
            id: i, size: 5 
        };
    });
    
    select('#info-text').html("CONVERTED: " + cachedPoints.length + " points");
}

function handleImage(e) {
    if (e.target.files.length > 0) {
        let file = e.target.files[0];
        let url = URL.createObjectURL(file);
        
        select('#info-text').html("LOADING IMAGE...");
        
        img = loadImage(url, () => {
            select('#info-text').html("IMAGE READY. CLICK CONVERT!");
        });
    }
}

function updateCanvas() {
    resizeCanvas(parseInt(select('#canvasW').value()), parseInt(select('#canvasH').value()));
    cachedPoints = []; // 캔버스 크기 변경 시 초기화
}

// 인터랙션 로직은 동일
function mouseWheel(event) { if (mouseY < height) { zoom -= event.delta * 0.001; zoom = constrain(zoom, 0.1, 5); return false; } }
function mouseDragged() { if (mouseY < height) { offset.x += mouseX - pmouseX; offset.y += mouseY - pmouseY; } }
