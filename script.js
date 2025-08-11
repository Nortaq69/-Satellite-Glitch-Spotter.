// Satellite Glitch Spotter - Advanced Anomaly Detection System
// Author: Cursor AI
// Version: 1.0

class SatelliteGlitchSpotter {
    constructor() {
        this.imageCanvas = document.getElementById('image-canvas');
        this.overlayCanvas = document.getElementById('overlay-canvas');
        this.imageCtx = this.imageCanvas.getContext('2d');
        this.overlayCtx = this.overlayCanvas.getContext('2d');
        
        this.originalImage = null;
        this.imageData = null;
        this.anomalies = [];
        this.overlayVisible = true;
        
        this.initializeEventListeners();
        this.updateStatus('READY');
    }

    initializeEventListeners() {
        // File upload
        const fileInput = document.getElementById('file-input');
        const uploadArea = document.getElementById('upload-area');
        
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.loadImage(files[0]);
            }
        });
        
        // Analysis controls
        document.getElementById('analyze-btn').addEventListener('click', () => this.analyzeImage());
        document.getElementById('toggle-overlay').addEventListener('click', () => this.toggleOverlay());
        document.getElementById('reset-view').addEventListener('click', () => this.resetView());
        document.getElementById('fullscreen').addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('export-btn').addEventListener('click', () => this.exportReport());
        
        // Modal
        document.getElementById('close-modal').addEventListener('click', () => this.closeModal());
        document.getElementById('anomaly-modal').addEventListener('click', (e) => {
            if (e.target.id === 'anomaly-modal') this.closeModal();
        });
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            this.loadImage(file);
        }
    }

    loadImage(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        this.updateStatus('LOADING');
        this.showLoading(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.displayImage();
                this.showAnalysisSection();
                this.updateStatus('ANALYZING');
                this.analyzeImage();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    displayImage() {
        const canvas = this.imageCanvas;
        const ctx = this.imageCtx;
        
        // Calculate aspect ratio to fit image properly
        const canvasAspect = canvas.width / canvas.height;
        const imageAspect = this.originalImage.width / this.originalImage.height;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (imageAspect > canvasAspect) {
            // Image is wider than canvas
            drawWidth = canvas.width;
            drawHeight = canvas.width / imageAspect;
            offsetX = 0;
            offsetY = (canvas.height - drawHeight) / 2;
        } else {
            // Image is taller than canvas
            drawHeight = canvas.height;
            drawWidth = canvas.height * imageAspect;
            offsetX = (canvas.width - drawWidth) / 2;
            offsetY = 0;
        }
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw image
        ctx.drawImage(this.originalImage, offsetX, offsetY, drawWidth, drawHeight);
        
        // Store image data for analysis
        this.imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    showAnalysisSection() {
        document.getElementById('upload-section').style.display = 'none';
        document.getElementById('analysis-section').style.display = 'block';
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('loading-overlay');
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    updateStatus(status) {
        const statusText = document.querySelector('.status-text');
        const statusDot = document.querySelector('.status-dot');
        
        statusText.textContent = status;
        
        switch (status) {
            case 'READY':
                statusDot.style.background = '#00ff88';
                break;
            case 'LOADING':
                statusDot.style.background = '#ffaa00';
                break;
            case 'ANALYZING':
                statusDot.style.background = '#ff6b6b';
                break;
            case 'COMPLETE':
                statusDot.style.background = '#4ecdc4';
                break;
        }
    }

    async analyzeImage() {
        if (!this.imageData) return;

        this.showLoading(true);
        this.updateStatus('ANALYZING');
        this.anomalies = [];

        // Get active filters
        const filters = {
            edgeDetection: document.getElementById('edge-detection').checked,
            colorDeviation: document.getElementById('color-deviation').checked,
            patternDetection: document.getElementById('pattern-detection').checked,
            compressionArtifacts: document.getElementById('compression-artifacts').checked,
            contourMapping: document.getElementById('contour-mapping').checked
        };

        // Run analysis based on active filters
        if (filters.edgeDetection) {
            this.detectEdges();
        }
        
        if (filters.colorDeviation) {
            this.detectColorDeviations();
        }
        
        if (filters.patternDetection) {
            this.detectPatterns();
        }
        
        if (filters.compressionArtifacts) {
            this.detectCompressionArtifacts();
        }
        
        if (filters.contourMapping) {
            this.detectContours();
        }

        // Sort anomalies by score
        this.anomalies.sort((a, b) => b.score - a.score);

        // Update UI
        this.updateSuspicionScale();
        this.displayAnomalies();
        this.drawOverlay();

        this.showLoading(false);
        this.updateStatus('COMPLETE');
    }

    detectEdges() {
        const data = this.imageData.data;
        const width = this.imageData.width;
        const height = this.imageData.height;
        const threshold = 50;

        // Sobel edge detection
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                
                // Get surrounding pixels
                const top = (y - 1) * width + x;
                const bottom = (y + 1) * width + x;
                const left = y * width + (x - 1);
                const right = y * width + (x + 1);
                
                // Calculate gradients
                const gx = data[right * 4] - data[left * 4];
                const gy = data[bottom * 4] - data[top * 4];
                const magnitude = Math.sqrt(gx * gx + gy * gy);
                
                if (magnitude > threshold) {
                    this.anomalies.push({
                        type: 'Edge Detection',
                        x: x,
                        y: y,
                        score: Math.min(10, Math.floor(magnitude / 10)),
                        description: `Sharp edge detected with magnitude ${Math.floor(magnitude)}`,
                        color: '#ff6b6b'
                    });
                }
            }
        }
    }

    detectColorDeviations() {
        const data = this.imageData.data;
        const width = this.imageData.width;
        const height = this.imageData.height;
        const blockSize = 8;

        for (let y = 0; y < height - blockSize; y += blockSize) {
            for (let x = 0; x < width - blockSize; x += blockSize) {
                let totalR = 0, totalG = 0, totalB = 0;
                let count = 0;

                // Calculate average color in block
                for (let dy = 0; dy < blockSize; dy++) {
                    for (let dx = 0; dx < blockSize; dx++) {
                        const idx = ((y + dy) * width + (x + dx)) * 4;
                        totalR += data[idx];
                        totalG += data[idx + 1];
                        totalB += data[idx + 2];
                        count++;
                    }
                }

                const avgR = totalR / count;
                const avgG = totalG / count;
                const avgB = totalB / count;

                // Check for unusual color patterns
                const isBlack = avgR < 30 && avgG < 30 && avgB < 30;
                const isWhite = avgR > 225 && avgG > 225 && avgB > 225;
                const isRed = avgR > 200 && avgG < 100 && avgB < 100;
                const isGreen = avgR < 100 && avgG > 200 && avgB < 100;
                const isBlue = avgR < 100 && avgG < 100 && avgB > 200;

                if (isBlack || isWhite || isRed || isGreen || isBlue) {
                    const colorType = isBlack ? 'Black' : isWhite ? 'White' : isRed ? 'Red' : isGreen ? 'Green' : 'Blue';
                    this.anomalies.push({
                        type: 'Color Deviation',
                        x: x + blockSize / 2,
                        y: y + blockSize / 2,
                        score: isBlack ? 8 : isWhite ? 6 : 5,
                        description: `Unusual ${colorType} color block detected`,
                        color: '#ffaa00',
                        width: blockSize,
                        height: blockSize
                    });
                }
            }
        }
    }

    detectPatterns() {
        const data = this.imageData.data;
        const width = this.imageData.width;
        const height = this.imageData.height;
        const patternSize = 16;

        for (let y = 0; y < height - patternSize; y += patternSize) {
            for (let x = 0; x < width - patternSize; x += patternSize) {
                // Check for repeating patterns
                let isRepeating = true;
                const firstPixel = (y * width + x) * 4;

                for (let dy = 0; dy < patternSize && isRepeating; dy += 4) {
                    for (let dx = 0; dx < patternSize && isRepeating; dx += 4) {
                        const idx1 = ((y + dy) * width + (x + dx)) * 4;
                        const idx2 = ((y + dy + 4) * width + (x + dx + 4)) * 4;
                        
                        if (Math.abs(data[idx1] - data[idx2]) > 10 ||
                            Math.abs(data[idx1 + 1] - data[idx2 + 1]) > 10 ||
                            Math.abs(data[idx1 + 2] - data[idx2 + 2]) > 10) {
                            isRepeating = false;
                        }
                    }
                }

                if (isRepeating) {
                    this.anomalies.push({
                        type: 'Pattern Detection',
                        x: x + patternSize / 2,
                        y: y + patternSize / 2,
                        score: 7,
                        description: 'Repeating pixel pattern detected - possible digital artifact',
                        color: '#9370db',
                        width: patternSize,
                        height: patternSize
                    });
                }
            }
        }
    }

    detectCompressionArtifacts() {
        const data = this.imageData.data;
        const width = this.imageData.width;
        const height = this.imageData.height;
        const blockSize = 8;

        for (let y = 0; y < height - blockSize; y += blockSize) {
            for (let x = 0; x < width - blockSize; x += blockSize) {
                let hasArtifacts = false;
                let totalVariation = 0;

                // Check for JPEG compression artifacts
                for (let dy = 0; dy < blockSize - 1; dy++) {
                    for (let dx = 0; dx < blockSize - 1; dx++) {
                        const idx1 = ((y + dy) * width + (x + dx)) * 4;
                        const idx2 = ((y + dy) * width + (x + dx + 1)) * 4;
                        const idx3 = ((y + dy + 1) * width + (x + dx)) * 4;

                        const diff1 = Math.abs(data[idx1] - data[idx2]);
                        const diff2 = Math.abs(data[idx1] - data[idx3]);
                        totalVariation += diff1 + diff2;

                        if (diff1 > 50 || diff2 > 50) {
                            hasArtifacts = true;
                        }
                    }
                }

                if (hasArtifacts) {
                    this.anomalies.push({
                        type: 'Compression Artifacts',
                        x: x + blockSize / 2,
                        y: y + blockSize / 2,
                        score: Math.min(6, Math.floor(totalVariation / 100)),
                        description: `JPEG compression artifacts detected`,
                        color: '#ffd700',
                        width: blockSize,
                        height: blockSize
                    });
                }
            }
        }
    }

    detectContours() {
        const data = this.imageData.data;
        const width = this.imageData.width;
        const height = this.imageData.height;
        const threshold = 30;

        // Simple contour detection
        for (let y = 2; y < height - 2; y++) {
            for (let x = 2; x < width - 2; x++) {
                const idx = (y * width + x) * 4;
                const center = data[idx];

                // Check surrounding pixels for contour
                let contourPoints = 0;
                const neighbors = [
                    data[((y - 1) * width + x) * 4],
                    data[((y + 1) * width + x) * 4],
                    data[(y * width + (x - 1)) * 4],
                    data[(y * width + (x + 1)) * 4]
                ];

                neighbors.forEach(neighbor => {
                    if (Math.abs(center - neighbor) > threshold) {
                        contourPoints++;
                    }
                });

                if (contourPoints >= 3) {
                    this.anomalies.push({
                        type: 'Contour Mapping',
                        x: x,
                        y: y,
                        score: Math.min(8, 3 + contourPoints),
                        description: `Unusual geometric contour detected with ${contourPoints} strong edges`,
                        color: '#4ecdc4'
                    });
                }
            }
        }
    }

    updateSuspicionScale() {
        const maxScore = this.anomalies.length > 0 ? Math.max(...this.anomalies.map(a => a.score)) : 0;
        const averageScore = this.anomalies.length > 0 ? 
            this.anomalies.reduce((sum, a) => sum + a.score, 0) / this.anomalies.length : 0;
        
        const overallScore = Math.round((maxScore + averageScore) / 2);
        
        document.getElementById('scale-fill').style.width = `${overallScore * 10}%`;
        document.getElementById('scale-value').textContent = overallScore;
    }

    displayAnomalies() {
        const container = document.getElementById('anomaly-list');
        container.innerHTML = '';

        if (this.anomalies.length === 0) {
            container.innerHTML = '<div class="anomaly-item"><p>No anomalies detected</p></div>';
            return;
        }

        this.anomalies.forEach((anomaly, index) => {
            const item = document.createElement('div');
            item.className = 'anomaly-item';
            item.innerHTML = `
                <div class="anomaly-header">
                    <span class="anomaly-type">${anomaly.type}</span>
                    <span class="anomaly-score">${anomaly.score}</span>
                </div>
                <div class="anomaly-description">${anomaly.description}</div>
            `;
            
            item.addEventListener('click', () => this.showAnomalyDetails(anomaly, index));
            container.appendChild(item);
        });
    }

    drawOverlay() {
        this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        
        if (!this.overlayVisible) return;

        this.anomalies.forEach(anomaly => {
            this.overlayCtx.strokeStyle = anomaly.color;
            this.overlayCtx.lineWidth = 2;
            this.overlayCtx.setLineDash([5, 5]);
            
            const x = anomaly.x;
            const y = anomaly.y;
            const width = anomaly.width || 10;
            const height = anomaly.height || 10;
            
            this.overlayCtx.strokeRect(x - width/2, y - height/2, width, height);
            
            // Draw score
            this.overlayCtx.fillStyle = anomaly.color;
            this.overlayCtx.font = '12px Orbitron';
            this.overlayCtx.fillText(anomaly.score.toString(), x + width/2 + 5, y);
        });
    }

    showAnomalyDetails(anomaly, index) {
        const modal = document.getElementById('anomaly-modal');
        const modalBody = document.getElementById('modal-body');
        
        const suspicionEmoji = anomaly.score <= 2 ? '😐' : 
                              anomaly.score <= 4 ? '🤔' : 
                              anomaly.score <= 6 ? '😳' : 
                              anomaly.score <= 8 ? '😱' : '👽';
        
        modalBody.innerHTML = `
            <div class="anomaly-detail">
                <h4>${anomaly.type} ${suspicionEmoji}</h4>
                <p><strong>Score:</strong> ${anomaly.score}/10</p>
                <p><strong>Description:</strong> ${anomaly.description}</p>
                <p><strong>Location:</strong> (${anomaly.x}, ${anomaly.y})</p>
                <p><strong>Analysis:</strong> This anomaly was detected using advanced image processing algorithms. 
                The score indicates the level of suspicion based on multiple factors including pattern analysis, 
                color deviation, and geometric consistency.</p>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    closeModal() {
        document.getElementById('anomaly-modal').style.display = 'none';
    }

    toggleOverlay() {
        this.overlayVisible = !this.overlayVisible;
        this.drawOverlay();
        
        const btn = document.getElementById('toggle-overlay');
        btn.innerHTML = this.overlayVisible ? '<span class="icon">👁️</span>' : '<span class="icon">👁️‍🗨️</span>';
    }

    resetView() {
        this.displayImage();
        this.drawOverlay();
    }

    toggleFullscreen() {
        const canvas = this.imageCanvas;
        if (!document.fullscreenElement) {
            canvas.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    exportReport() {
        // Create a canvas with the image and annotations
        const exportCanvas = document.createElement('canvas');
        const exportCtx = exportCanvas.getContext('2d');
        
        exportCanvas.width = this.imageCanvas.width;
        exportCanvas.height = this.imageCanvas.height;
        
        // Draw the original image
        exportCtx.drawImage(this.imageCanvas, 0, 0);
        
        // Draw annotations
        this.anomalies.forEach(anomaly => {
            exportCtx.strokeStyle = anomaly.color;
            exportCtx.lineWidth = 3;
            exportCtx.setLineDash([5, 5]);
            
            const x = anomaly.x;
            const y = anomaly.y;
            const width = anomaly.width || 10;
            const height = anomaly.height || 10;
            
            exportCtx.strokeRect(x - width/2, y - height/2, width, height);
            
            // Draw score
            exportCtx.fillStyle = anomaly.color;
            exportCtx.font = 'bold 16px Orbitron';
            exportCtx.fillText(anomaly.score.toString(), x + width/2 + 5, y);
        });
        
        // Convert to blob and download
        exportCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `satellite-analysis-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new SatelliteGlitchSpotter();
}); 