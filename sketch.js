let myFont;
let img;
let vertexPoints = [];
let tiles = [];
let zoom = 1.0;
let offset;
let isFontLoaded = false;
let debugMsg = "";

function setup() {
    const w = parseInt(select('#canvasW').value());
    const h = parseInt(select('#canvasH').value());
    let canvas = createCanvas(w, h);
    canvas.parent('canvas-holder');
    
    offset = createVector(0, 0);
    
    const fontURL = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf';
    myFont = loadFont(fontURL, 
        () => { 
            isFontLoaded = true; 
            debugMsg = "폰트 로드 완료";
        },
        (err) => { 
            debugMsg = "폰트 로드 실패";
        }
    );
    
    select('#convertBtn').mousePressed(generateDisplay);
    select('#resizeBtn').mousePressed(updateCanvas);
    select('#saveBtn').mousePressed(() => saveCanvas('TEXT_MOSAIC', 'png'));
    select('#imageInput').changed(handleImage);
}

function draw() {
    background(0);
    
    // 디버그 메시지 표시
    fill(255, 255, 0);
    textSize(10);
    textAlign(LEFT, TOP);
    textFont('sans-serif');
    text(debugMsg, 10, 10);
    
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

    if (!img) {
        fill(100);
        textAlign(CENTER, CENTER);
        textFont('sans-serif');
        text("1. SELECT PHOTO\n2. CLICK CONVERT", width/2, height/2);
    } else {
        // 타일 그리기
        for (let t of tiles) {
            image(img, t.x, t.y, t.size, t.size);
        }
        
        // 꼭짓점 그리기
        drawVertexMarkers();
    }
    
    pop();
}

function drawVertexMarkers() {
    let vertexColor = select('#vertexColor').value();
    
    for (let i = 0; i < vertexPoints.length; i++) {
        let p = vertexPoints[i];
        
        stroke(vertexColor);
        strokeWeight(2);
        noFill();
        circle(p.x, p.y, 14);
        
        noStroke();
        fill(vertexColor);
        textFont('sans-serif');
        textSize(10);
        textAlign(LEFT, BOTTOM);
        text(i + 1, p.x + 9, p.y - 5);
    }
}

function generateDisplay() {
    if (!isFontLoaded || !myFont) {
        debugMsg = "에러: 폰트 없음";
        return;
    }
    
    if (!img) {
        debugMsg = "에러: 이미지 없음";
        return;
    }
    
    debugMsg = "변환 시작...";
    
    let txt = select('#textInput').value() || "A";
    let fontSize = min(width, height) * 0.75;
    let tileSize = 10;
    
    // 텍스트 위치 계산
    let bounds = myFont.textBounds(txt, 0, 0, fontSize);
    let startX = (width - bounds.w) / 2 - bounds.x;
    let startY = (height + bounds.h) / 2 - bounds.y - bounds.h;
    
    debugMsg = "bounds: " + floor(bounds.w) + "x" + floor(bounds.h);
    
    // 꼭짓점 먼저 추출
    let allPoints = myFont.textToPoints(txt, startX, startY, fontSize, {
        sampleFactor: 0.2,
        simplifyThreshold: 0
    });
    
    vertexPoints = myFont.textToPoints(txt, startX, startY, fontSize, {
        sampleFactor: 0.03,
        simplifyThreshold: 1
    });
    
    // 텍스트 영역 찾기 (꼭짓점들의 범위 기반)
    if (allPoints.length === 0) {
        debugMsg = "에러: 포인트 추출 실패";
        return;
    }
    
    // 타일 배치 - 점들이 있는 영역 내부 채우기
    tiles = [];
    
    // 각 타일 위치에서 텍스트 내부인지 확인
    for (let y = 0; y < height; y += tileSize) {
        for (let x = 0; x < width; x += tileSize) {
            if (isInsideText(x + tileSize/2, y + tileSize/2, allPoints, tileSize * 2)) {
                tiles.push({ x: x, y: y, size: tileSize });
            }
        }
    }
    
    debugMsg = "타일:" + tiles.length + " 꼭짓점:" + vertexPoints.length;
    select('#info-text').html("타일 " + tiles.length + "개 / 꼭짓점 " + vertexPoints.length + "개");
}

// 점이 텍스트 내부에 있는지 확인 (근처에 윤곽선 점이 있는지)
function isInsideText(px, py, points, threshold) {
    for (let p of points) {
        let d = dist(px, py, p.x, p.y);
        if (d < threshold) {
            return true;
        }
    }
    return false;
}

function handleImage(e) {
    if (e.target.files.length > 0) {
        let file = e.target.files[0];
        let url = URL.createObjectURL(file);
        
        debugMsg = "이미지 로딩중...";
        
        img = loadImage(url, () => {
            debugMsg = "이미지 로드 완료: " + img.width + "x" + img.height;
            select('#info-text').html("IMAGE READY. CLICK CONVERT!");
        }, () => {
            debugMsg = "이미지 로드 실패";
        });
    }
}

function updateCanvas() {
    resizeCanvas(parseInt(select('#canvasW').value()), parseInt(select('#canvasH').value()));
    tiles = [];
    vertexPoints = [];
    debugMsg = "캔버스 리사이즈: " + width + "x" + height;
}

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