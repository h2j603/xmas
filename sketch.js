let myFont;
let img;
let tiles = [];
let zoom = 1.0;
let offset;
let isFontLoaded = false;
let isSaving = false;

// 효과 토글
let showLine = false;
let showRotate = false;

// 저장된 설정값
let currentFontSize = 75;
let currentTileSize = 12;

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
            updateStatus("폰트 로드 완료");
        },
        (err) => { 
            updateStatus("폰트 로드 실패");
        }
    );
    
    // 버튼 이벤트
    select('#convertBtn').mousePressed(generateDisplay);
    select('#resizeBtn').mousePressed(updateCanvas);
    select('#saveBtn').mousePressed(saveImage);
    select('#previewBtn').mousePressed(showPreview);
    select('#closeFullscreen').mousePressed(hidePreview);
    select('#imageInput').changed(handleImage);
    
    // 슬라이더 값 표시
    select('#fontSize').input(() => {
        select('#fontSizeVal').html(select('#fontSize').value());
    });
    select('#tileSize').input(() => {
        select('#tileSizeVal').html(select('#tileSize').value());
    });
    
    // 토글 버튼
    select('#toggleLine').mousePressed(() => {
        showLine = !showLine;
        if (showLine) {
            select('#toggleLine').addClass('active');
        } else {
            select('#toggleLine').removeClass('active');
        }
    });
    
    select('#toggleRotate').mousePressed(() => {
        showRotate = !showRotate;
        if (showRotate) {
            select('#toggleRotate').addClass('active');
        } else {
            select('#toggleRotate').removeClass('active');
        }
    });
}

function draw() {
    background(0);
    
    if (!isFontLoaded) {
        fill(255);
        textAlign(CENTER, CENTER);
        textFont('sans-serif');
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
    } else if (tiles.length > 0) {
        // 연결선 그리기
        if (showLine) {
            drawConnectLines();
        }
        
        // 타일 그리기
        drawTiles();
    }
    
    pop();
}

function drawConnectLines() {
    let lineColor = select('#lineColor').value();
    stroke(lineColor);
    strokeWeight(1);
    noFill();
    
    beginShape();
    for (let t of tiles) {
        vertex(t.x, t.y);
    }
    endShape(CLOSE);
}

function drawTiles() {
    for (let i = 0; i < tiles.length; i++) {
        let t = tiles[i];
        
        push();
        translate(t.x, t.y);
        
        if (showRotate) {
            randomSeed(i);
            rotate(random(-0.3, 0.3));
        }
        
        image(img, -currentTileSize/2, -currentTileSize/2, currentTileSize, currentTileSize);
        pop();
    }
}

function generateDisplay() {
    if (!isFontLoaded || !myFont) {
        updateStatus("에러: 폰트 없음");
        return;
    }
    
    if (!img) {
        updateStatus("이미지를 먼저 선택하세요!");
        return;
    }
    
    let txt = select('#textInput').value() || "A";
    currentFontSize = parseInt(select('#fontSize').value());
    currentTileSize = parseInt(select('#tileSize').value());
    
    let fontSize = min(width, height) * (currentFontSize / 100);
    
    // 텍스트 위치 계산
    let bounds = myFont.textBounds(txt, 0, 0, fontSize);
    let startX = (width - bounds.w) / 2 - bounds.x;
    let startY = (height + bounds.h) / 2 - bounds.y - bounds.h;
    
    // sampleFactor를 타일 크기에 맞게 조절
    let density = map(currentTileSize, 4, 40, 0.4, 0.05);
    
    // 윤곽선 포인트 추출
    let outlinePoints = myFont.textToPoints(txt, startX, startY, fontSize, {
        sampleFactor: density,
        simplifyThreshold: 0
    });
    
    if (outlinePoints.length === 0) {
        updateStatus("에러: 포인트 추출 실패");
        return;
    }
    
    tiles = outlinePoints.map((p, i) => ({
        x: p.x,
        y: p.y,
        index: i
    }));
    
    updateStatus("타일 " + tiles.length + "개 생성됨");
}

function showPreview() {
    select('#fullscreen-view').removeClass('hidden');
}

function hidePreview() {
    select('#fullscreen-view').addClass('hidden');
}

function saveImage() {
    isSaving = true;
    saveCanvas('TEXT_MOSAIC', 'png');
    updateStatus("이미지 저장됨!");
}

function updateStatus(msg) {
    select('#info-text').html(msg);
}

function handleImage(e) {
    if (e.target.files.length > 0) {
        let file = e.target.files[0];
        let url = URL.createObjectURL(file);
        
        updateStatus("이미지 로딩중...");
        
        img = loadImage(url, () => {
            updateStatus("이미지 준비 완료! CONVERT 클릭");
        }, () => {
            updateStatus("이미지 로드 실패");
        });
    }
}

function updateCanvas() {
    resizeCanvas(parseInt(select('#canvasW').value()), parseInt(select('#canvasH').value()));
    tiles = [];
    offset = createVector(0, 0);
    zoom = 1.0;
    updateStatus("캔버스: " + width + "x" + height);
}

function mouseWheel(event) {
    // 프리뷰 모드에서만 줌
    if (!select('#fullscreen-view').hasClass('hidden')) {
        zoom -= event.delta * 0.001;
        zoom = constrain(zoom, 0.1, 5);
        return false;
    }
}

function mouseDragged() {
    if (!select('#fullscreen-view').hasClass('hidden')) {
        offset.x += mouseX - pmouseX;
        offset.y += mouseY - pmouseY;
    }
}