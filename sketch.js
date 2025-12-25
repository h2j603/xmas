let fonts = {};
let currentFont = null;
let img;
let tiles = [];
let zoom = 1.0;
let offset;
let fontsLoaded = 0;
const totalFonts = 4;

// 효과 토글
let showWeb = false;
let showRotate = false;
let showPulse = false;

// 저장된 설정값
let currentFontSize = 50;
let currentTileSize = 5;
let currentScaleX = 100;
let currentLetterSpace = 0;
let currentLineHeight = 120;

// 텍스트 중심점
let textCenterX = 0;
let textCenterY = 0;

// 비디오 녹화
let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];

// 폰트 URL
const fontURLs = {
    roboto: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf',
    playfair: 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFiD-vYSZviVYUb_rj3ij__anPXDTzYgEM86xQ.ttf',
    bebas: 'https://fonts.gstatic.com/s/bebasneue/v9/JTUSjIg69CK48gW7PXoo9Wlhyw.ttf',
    pacifico: 'https://fonts.gstatic.com/s/pacifico/v22/FwZY7-Qmy14u9lezJ96A4sijpFu_.ttf'
};

function setup() {
    const w = parseInt(select('#canvasW').value());
    const h = parseInt(select('#canvasH').value());
    let canvas = createCanvas(w, h);
    canvas.parent('canvas-holder');
    
    offset = createVector(0, 0);
    textCenterX = w / 2;
    textCenterY = h / 2;
    
    // 모든 폰트 로드
    for (let key in fontURLs) {
        fonts[key] = loadFont(fontURLs[key], 
            () => { 
                fontsLoaded++;
                if (fontsLoaded === totalFonts) {
                    currentFont = fonts['roboto'];
                    updateStatus("폰트 로드 완료");
                }
            },
            () => { 
                fontsLoaded++;
                updateStatus("일부 폰트 로드 실패");
            }
        );
    }
    
    // 버튼 이벤트
    select('#convertBtn').mousePressed(generateDisplay);
    select('#resizeBtn').mousePressed(updateCanvas);
    select('#saveBtn').mousePressed(saveImage);
    select('#saveVideoBtn').mousePressed(startRecording);
    select('#previewBtn').mousePressed(showPreview);
    select('#closeFullscreen').mousePressed(hidePreview);
    select('#imageInput').changed(handleImage);
    
    // 폰트 선택
    select('#fontSelect').changed(() => {
        let selected = select('#fontSelect').value();
        currentFont = fonts[selected];
    });
    
    // 슬라이더 값 표시
    select('#fontSize').input(() => {
        select('#fontSizeVal').html(select('#fontSize').value());
    });
    select('#tileSize').input(() => {
        select('#tileSizeVal').html(select('#tileSize').value());
    });
    select('#scaleX').input(() => {
        select('#scaleXVal').html(select('#scaleX').value());
    });
    select('#letterSpace').input(() => {
        select('#letterSpaceVal').html(select('#letterSpace').value());
    });
    select('#lineHeight').input(() => {
        select('#lineHeightVal').html(select('#lineHeight').value());
    });
    
    // 토글 버튼
    select('#toggleLine').mousePressed(() => {
        showWeb = !showWeb;
        toggleClass('#toggleLine', showWeb);
    });
    
    select('#toggleRotate').mousePressed(() => {
        showRotate = !showRotate;
        toggleClass('#toggleRotate', showRotate);
    });
    
    select('#togglePulse').mousePressed(() => {
        showPulse = !showPulse;
        toggleClass('#togglePulse', showPulse);
    });
}

function toggleClass(selector, isActive) {
    if (isActive) {
        select(selector).addClass('active');
    } else {
        select(selector).removeClass('active');
    }
}

function draw() {
    let bgColor = select('#bgColor').value();
    background(bgColor);
    
    if (fontsLoaded < totalFonts) {
        fill(255);
        textAlign(CENTER, CENTER);
        textFont('sans-serif');
        text("LOADING FONTS... " + fontsLoaded + "/" + totalFonts, width/2, height/2);
        return;
    }

    push();
    translate(width/2, height/2);
    scale(zoom);
    translate(-textCenterX + offset.x, -textCenterY + offset.y);

    if (!img) {
        fill(100);
        textAlign(CENTER, CENTER);
        textFont('sans-serif');
        text("1. SELECT PHOTO\n2. CLICK CONVERT", textCenterX, textCenterY);
    } else if (tiles.length > 0) {
        if (showWeb) {
            drawWebLines();
        }
        drawTiles();
    }
    
    pop();
}

function drawWebLines() {
    strokeWeight(0.8);
    
    let maxDist = min(width, height) * 0.1;
    
    for (let i = 0; i < tiles.length; i++) {
        let t1 = tiles[i];
        
        let connections = 0;
        for (let j = i + 1; j < tiles.length && connections < 4; j++) {
            let t2 = tiles[j];
            let d = dist(t1.x, t1.y, t2.x, t2.y);
            
            if (d < maxDist) {
                let midX = (t1.x + t2.x) / 2;
                let midY = (t1.y + t2.y) / 2;
                let lineClr = getImageColor(midX, midY);
                
                let alpha = map(d, 0, maxDist, 200, 30);
                stroke(red(lineClr), green(lineClr), blue(lineClr), alpha);
                line(t1.x, t1.y, t2.x, t2.y);
                connections++;
            }
        }
        
        randomSeed(i * 100);
        if (random(1) < 0.03) {
            let randomIdx = floor(random(tiles.length));
            let t2 = tiles[randomIdx];
            let lineClr = getImageColor(t1.x, t1.y);
            stroke(red(lineClr), green(lineClr), blue(lineClr), 40);
            line(t1.x, t1.y, t2.x, t2.y);
        }
    }
}

function getImageColor(x, y) {
    if (!img) return color(255);
    
    let imgX = floor(map(x, 0, width, 0, img.width));
    let imgY = floor(map(y, 0, height, 0, img.height));
    imgX = constrain(imgX, 0, img.width - 1);
    imgY = constrain(imgY, 0, img.height - 1);
    
    return img.get(imgX, imgY);
}

function drawTiles() {
    let baseTileSize = min(width, height) * (currentTileSize / 100);
    
    for (let i = 0; i < tiles.length; i++) {
        let t = tiles[i];
        let tileSize = baseTileSize;
        
        if (showPulse) {
            let pulse = sin(frameCount * 0.05 + i * 0.3) * 0.3 + 1;
            tileSize *= pulse;
        }
        
        push();
        translate(t.x, t.y);
        
        if (showRotate) {
            randomSeed(i);
            rotate(random(-0.4, 0.4));
        }
        
        image(img, -tileSize/2, -tileSize/2, tileSize, tileSize);
        pop();
    }
}

function generateDisplay() {
    if (!currentFont) {
        updateStatus("에러: 폰트 없음");
        return;
    }
    
    if (!img) {
        updateStatus("이미지를 먼저 선택하세요!");
        return;
    }
    
    let txt = document.getElementById('textInput').value || "A";
    let lines = txt.split('\n');
    
    currentFontSize = parseInt(select('#fontSize').value());
    currentTileSize = parseInt(select('#tileSize').value());
    currentScaleX = parseInt(select('#scaleX').value());
    currentLetterSpace = parseInt(select('#letterSpace').value());
    currentLineHeight = parseInt(select('#lineHeight').value());
    
    let fontSize = min(width, height) * (currentFontSize / 100);
    let density = map(currentTileSize, 1, 20, 0.5, 0.03);
    
    tiles = [];
    let allMinX = Infinity, allMaxX = -Infinity;
    let allMinY = Infinity, allMaxY = -Infinity;
    
    let lineHeightPx = fontSize * (currentLineHeight / 100);
    let totalHeight = lines.length * lineHeightPx;
    let startY = (height - totalHeight) / 2 + fontSize * 0.8;
    
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        let lineTxt = lines[lineIdx];
        if (lineTxt.trim() === '') continue;
        
        let chars = lineTxt.split('');
        let totalWidth = 0;
        
        for (let c = 0; c < chars.length; c++) {
            let charBounds = currentFont.textBounds(chars[c], 0, 0, fontSize);
            totalWidth += charBounds.w * (currentScaleX / 100);
            if (c < chars.length - 1) {
                totalWidth += currentLetterSpace;
            }
        }
        
        let startX = (width - totalWidth) / 2;
        let y = startY + lineIdx * lineHeightPx;
        let currentX = startX;
        
        for (let c = 0; c < chars.length; c++) {
            let char = chars[c];
            if (char === ' ') {
                currentX += fontSize * 0.3 * (currentScaleX / 100) + currentLetterSpace;
                continue;
            }
            
            let charBounds = currentFont.textBounds(char, 0, 0, fontSize);
            
            let outlinePoints = currentFont.textToPoints(char, 0, 0, fontSize, {
                sampleFactor: density,
                simplifyThreshold: 0
            });
            
            for (let p of outlinePoints) {
                let scaledX = p.x * (currentScaleX / 100);
                let finalX = currentX + scaledX;
                let finalY = y + p.y;
                
                tiles.push({
                    x: finalX,
                    y: finalY,
                    index: tiles.length
                });
                
                allMinX = min(allMinX, finalX);
                allMaxX = max(allMaxX, finalX);
                allMinY = min(allMinY, finalY);
                allMaxY = max(allMaxY, finalY);
            }
            
            currentX += charBounds.w * (currentScaleX / 100) + currentLetterSpace;
        }
    }
    
    if (tiles.length === 0) {
        updateStatus("에러: 포인트 추출 실패");
        return;
    }
    
    textCenterX = (allMinX + allMaxX) / 2;
    textCenterY = (allMinY + allMaxY) / 2;
    
    offset = createVector(0, 0);
    zoom = 1.0;
    
    updateStatus("타일 " + tiles.length + "개 생성됨");
}

function showPreview() {
    select('#fullscreen-view').removeClass('hidden');
}

function hidePreview() {
    select('#fullscreen-view').addClass('hidden');
}

function saveImage() {
    let savedOffset = offset.copy();
    let savedZoom = zoom;
    offset = createVector(0, 0);
    zoom = 1.0;
    
    draw();
    saveCanvas('TEXT_MOSAIC', 'png');
    
    offset = savedOffset;
    zoom = savedZoom;
    
    updateStatus("이미지 저장됨!");
}

function startRecording() {
    if (isRecording) {
        updateStatus("이미 녹화 중입니다");
        return;
    }
    
    if (!showPulse) {
        updateStatus("PULSE 모드를 켜야 비디오 저장 가능!");
        return;
    }
    
    let duration = parseInt(document.getElementById('videoDuration').value) || 3;
    duration = constrain(duration, 1, 30);
    
    let canvas = document.querySelector('#canvas-holder canvas');
    let stream = canvas.captureStream(30);
    
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    
    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            recordedChunks.push(e.data);
        }
    };
    
    mediaRecorder.onstop = () => {
        let blob = new Blob(recordedChunks, { type: 'video/webm' });
        let url = URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.href = url;
        a.download = 'TEXT_MOSAIC.webm';
        a.click();
        URL.revokeObjectURL(url);
        isRecording = false;
        select('#saveVideoBtn').html('REC');
        updateStatus("비디오 저장됨!");
    };
    
    offset = createVector(0, 0);
    zoom = 1.0;
    
    mediaRecorder.start();
    isRecording = true;
    select('#saveVideoBtn').html('...');
    updateStatus(duration + "초 녹화 중...");
    
    setTimeout(() => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
    }, duration * 1000);
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
    textCenterX = width / 2;
    textCenterY = height / 2;
    updateStatus("캔버스: " + width + "x" + height);
}

function mouseWheel(event) {
    if (!select('#fullscreen-view').hasClass('hidden')) {
        zoom -= event.delta * 0.001;
        zoom = constrain(zoom, 0.1, 5);
        return false;
    }
}

function mouseDragged() {
    if (!select('#fullscreen-view').hasClass('hidden')) {
        offset.x += (mouseX - pmouseX) / zoom;
        offset.y += (mouseY - pmouseY) / zoom;
    }
}