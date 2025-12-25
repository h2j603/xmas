let myFont;
let img;
let vertexPoints = [];
let tiles = [];
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
    const fontURL = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf';
    myFont = loadFont(fontURL, 
        () => { 
            isFontLoaded = true; 
            console.log("Font Ready"); 
        },
        (err) => { 
            console.error("Font Load Error:", err);
        }
    );
    
    // UI 이벤트
    select('#convertBtn').mousePressed(generateDisplay);
    select('#resizeBtn').mousePressed(updateCanvas);
    select('#saveBtn').mousePressed(() => saveCanvas('TEXT_MOSAIC', 'png'));
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

    if (!img) {
        fill(100);
        textAlign(CENTER, CENTER);
        text("1. SELECT PHOTO\n2. CLICK CONVERT", width/2, height/2);
    } else if (tiles.length > 0) {
        // 1. 작은 이미지들로 텍스트 모양 채우기
        for (let t of tiles) {
            image(img, t.x, t.y, t.size, t.size);
        }
        
        // 2. 꼭짓점에 원과 번호 표시
        drawVertexMarkers();
    }
    
    pop();
}

function drawVertexMarkers() {
    let vertexColor = select('#vertexColor').value();
    
    for (let i = 0; i < vertexPoints.length; i++) {
        let p = vertexPoints[i];
        
        // 원 그리기
        stroke(vertexColor);
        strokeWeight(2);
        noFill();
        circle(p.x, p.y, 14);
        
        // 번호 표시
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
        console.log("Font not ready");
        return;
    }
    
    if (!img) {
        select('#info-text').html("이미지를 먼저 선택하세요!");
        return;
    }
    
    let txt = select('#textInput').value() || "A";
    let fontSize = min(width, height) * 0.75;
    let tileSize = 8;
    
    // 텍스트 중앙 정렬 위치 계산
    let bounds = myFont.textBounds(txt, 0, 0, fontSize);
    let startX = (width - bounds.w) / 2 - bounds.x;
    let startY = (height + bounds.h) / 2 - bounds.y - bounds.h;
    
    // 텍스트 모양 마스크 생성
    let mask = createGraphics(width, height);
    mask.pixelDensity(1); // 중요! 픽셀 밀도 고정
    mask.background(0);
    mask.fill(255);
    mask.noStroke();
    mask.textFont(myFont);
    mask.textSize(fontSize);
    mask.text(txt, startX, startY);
    
    // 타일 배치: get()으로 색상 체크
    tiles = [];
    for (let y = 0; y < height; y += tileSize) {
        for (let x = 0; x < width; x += tileSize) {
            let c = mask.get(x + tileSize/2, y + tileSize/2);
            // 흰색(255)에 가까우면 텍스트 내부
            if (brightness(c) > 128) {
                tiles.push({ x: x, y: y, size: tileSize });
            }
        }
    }
    
    // 꼭짓점 추출
    vertexPoints = myFont.textToPoints(txt, startX, startY, fontSize, {
        sampleFactor: 0.03,
        simplifyThreshold: 1
    });
    
    console.log("Tiles:", tiles.length, "Vertices:", vertexPoints.length);
    select('#info-text').html("타일 " + tiles.length + "개 / 꼭짓점 " + vertexPoints.length + "개");
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
    tiles = [];
    vertexPoints = [];
}

// 인터랙션
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