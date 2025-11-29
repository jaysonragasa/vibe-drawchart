// Drawing Functions
function drawGrid(ctx, canvas, cameraOffset, cameraZoom, gridSize) {
    const isDark = document.documentElement.classList.contains('dark');
    ctx.strokeStyle = isDark ? '#374151' : '#e5e7eb';
    ctx.lineWidth = 1 / cameraZoom;
    
    const viewLeft = -cameraOffset.x / cameraZoom;
    const viewTop = -cameraOffset.y / cameraZoom;
    const viewRight = (canvas.width - cameraOffset.x) / cameraZoom;
    const viewBottom = (canvas.height - cameraOffset.y) / cameraZoom;
    
    const startX = Math.floor(viewLeft / gridSize) * gridSize;
    const startY = Math.floor(viewTop / gridSize) * gridSize;
    
    for (let x = startX; x < viewRight; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, viewTop);
        ctx.lineTo(x, viewBottom);
        ctx.stroke();
    }
    for (let y = startY; y < viewBottom; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(viewLeft, y);
        ctx.lineTo(viewRight, y);
        ctx.stroke();
    }
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '', lines = [];
    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = context.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);
    const totalHeight = lines.length * lineHeight;
    const startY = y - totalHeight / 2 + lineHeight / 2;
    for (let i = 0; i < lines.length; i++) {
        context.fillText(lines[i].trim(), x, startY + i * lineHeight);
    }
}

function drawShape(ctx, shape, selectedItems, cameraZoom) {
    const centerX = shape.x + shape.width / 2;
    const centerY = shape.y + shape.height / 2;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(shape.rotation || 0);
    ctx.translate(-centerX, -centerY);
    ctx.globalAlpha = shape.opacity || 1;
    
    if (shape.type !== 'image') {
        ctx.strokeStyle = shape.borderColor;
        ctx.fillStyle = shape.fillColor;
        ctx.lineWidth = shape.borderWidth / cameraZoom;
    }
    
    if (selectedItems.includes(shape)) {
        ctx.shadowColor = 'rgba(0, 123, 255, 0.7)';
        ctx.shadowBlur = 10 / cameraZoom;
    }
    
    switch (shape.type) {
        case 'rectangle':
            ctx.beginPath();
            const r = Math.max(0, Math.min(shape.borderRadius || 0, shape.width / 2, shape.height / 2));
            const x = shape.x, y = shape.y, w = shape.width, h = shape.height;
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
            break;
        case 'diamond':
            ctx.beginPath();
            ctx.moveTo(shape.x + shape.width / 2, shape.y);
            ctx.lineTo(shape.x + shape.width, shape.y + shape.height / 2);
            ctx.lineTo(shape.x + shape.width / 2, shape.y + shape.height);
            ctx.lineTo(shape.x, shape.y + shape.height / 2);
            ctx.closePath();
            break;
        case 'ellipse':
            ctx.beginPath();
            ctx.ellipse(shape.x + shape.width / 2, shape.y + shape.height / 2, shape.width / 2, shape.height / 2, 0, 0, 2 * Math.PI);
            break;
        case 'pie':
            ctx.beginPath();
            ctx.moveTo(shape.x + shape.width / 2, shape.y + shape.height / 2);
            ctx.arc(shape.x + shape.width / 2, shape.y + shape.height / 2, Math.min(shape.width, shape.height) / 2, -Math.PI / 2, -Math.PI / 2 + (shape.angle * Math.PI / 180), false);
            ctx.closePath();
            break;
        case 'text':
            ctx.beginPath();
            ctx.rect(shape.x, shape.y, shape.width, shape.height);
            break;
        case 'image':
            ctx.beginPath();
            ctx.rect(shape.x, shape.y, shape.width, shape.height);
            if (shape.imageSrc) {
                if (!shape.imageElem) {
                    const img = new Image();
                    img.onload = () => { shape.imageElem = img; };
                    img.src = shape.imageSrc;
                    shape.imageElem = 'loading';
                } else if (shape.imageElem !== 'loading') {
                    const img = shape.imageElem;
                    const fit = shape.imageFit || 'fill';
                    const sw = shape.width, sh = shape.height;
                    const iw = img.naturalWidth || img.width;
                    const ih = img.naturalHeight || img.height;
                    ctx.save();
                    ctx.clip();
                    if (fit === 'fill') {
                        ctx.drawImage(img, shape.x, shape.y, sw, sh);
                    } else if (fit === 'aspectFit') {
                        const scale = Math.min(sw / iw, sh / ih);
                        const nw = iw * scale, nh = ih * scale;
                        ctx.drawImage(img, shape.x + (sw - nw) / 2, shape.y + (sh - nh) / 2, nw, nh);
                    } else if (fit === 'aspectFill') {
                        const scale = Math.max(sw / iw, sh / ih);
                        const nw = iw * scale, nh = ih * scale;
                        ctx.drawImage(img, shape.x + (sw - nw) / 2, shape.y + (sh - nh) / 2, nw, nh);
                    } else if (fit === 'center') {
                        ctx.drawImage(img, shape.x + (sw - iw) / 2, shape.y + (sh - ih) / 2, iw, ih);
                    }
                    ctx.restore();
                }
            } else {
                ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#4a5568' : '#e2e8f0';
                ctx.fill();
                ctx.strokeStyle = '#cbd5e0';
                ctx.lineWidth = 2 / cameraZoom;
                ctx.setLineDash([5 / cameraZoom, 5 / cameraZoom]);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#718096';
                ctx.font = `${14 / cameraZoom}px Inter`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('No Image', shape.x + shape.width / 2, shape.y + shape.height / 2);
            }
            break;
        case 'checkmark':
            ctx.strokeStyle = shape.borderColor;
            ctx.lineWidth = Math.min(shape.width, shape.height) * 0.15;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(shape.x + shape.width * 0.2, shape.y + shape.height * 0.5);
            ctx.lineTo(shape.x + shape.width * 0.45, shape.y + shape.height * 0.75);
            ctx.lineTo(shape.x + shape.width * 0.8, shape.y + shape.height * 0.25);
            ctx.stroke();
            ctx.restore();
            return;
        case 'group':
            ctx.setLineDash([5 / cameraZoom, 5 / cameraZoom]);
            ctx.beginPath();
            ctx.rect(shape.x, shape.y, shape.width, shape.height);
            break;
    }
    
    if (shape.type !== 'image') {
        if (shape.fill) ctx.fill();
        if (shape.border || (shape.type === 'text' && selectedItems.includes(shape))) ctx.stroke();
    } else if (shape.type === 'image' && selectedItems.includes(shape)) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1 / cameraZoom;
        ctx.stroke();
    }
    ctx.setLineDash([]);
    
    if (shape.type !== 'image') {
        ctx.fillStyle = shape.textColor;
        ctx.font = `${shape.fontSize}px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        wrapText(ctx, shape.text, shape.x + shape.width / 2, shape.y + shape.height / 2, shape.width - 10, shape.fontSize * 1.2);
    }
    
    ctx.restore();
}

function drawHandles(ctx, shape, cameraZoom) {
    const handles = getResizeHandles(shape);
    const connectionPoints = getConnectionPoints(shape, cameraZoom);
    const rotationHandle = getRotationHandle(shape, cameraZoom);
    const center = { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
    
    const handleSize = 8 / cameraZoom;
    const connectionPointSize = 5 / cameraZoom;
    
    const rotatedRotationHandle = rotatePoint(rotationHandle, center, shape.rotation || 0);
    const rotatedTopCenter = rotatePoint({ x: shape.x + shape.width / 2, y: shape.y }, center, shape.rotation || 0);
    
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 1 / cameraZoom;
    ctx.beginPath();
    ctx.moveTo(rotatedTopCenter.x, rotatedTopCenter.y);
    ctx.lineTo(rotatedRotationHandle.x, rotatedRotationHandle.y);
    ctx.stroke();
    
    ctx.fillStyle = '#007bff';
    ctx.beginPath();
    ctx.arc(rotatedRotationHandle.x, rotatedRotationHandle.y, handleSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    for (const handle in handles) {
        const pos = rotatePoint(handles[handle], center, shape.rotation || 0);
        ctx.fillRect(pos.x - handleSize / 2, pos.y - handleSize / 2, handleSize, handleSize);
    }
    
    if (shape.allowConnections !== false) {
        ctx.fillStyle = '#28a745';
        for (const point in connectionPoints) {
            const pos = rotatePoint(connectionPoints[point], center, shape.rotation || 0);
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, connectionPointSize, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}

function drawConnector(ctx, connector, selectedConnectors, hoveredConnector, isReconnecting, lastMousePos, shapes, cameraZoom) {
    const isSelected = selectedConnectors.includes(connector);
    const isHovered = hoveredConnector === connector;
    
    let pathPoints = getConnectorPath(connector, shapes, cameraZoom);
    if (pathPoints.length < 2) return;
    
    if (isReconnecting && isReconnecting.connector.id === connector.id) {
        const tempPath = [...pathPoints];
        if (isReconnecting.end === 'from') {
            tempPath[0] = lastMousePos;
        } else {
            tempPath[tempPath.length - 1] = lastMousePos;
        }
        pathPoints = tempPath;
    }
    
    const color = connector.color || '#ddd';
    const thickness = connector.thickness || 2;
    const lineStyle = connector.lineStyle || 'solid';
    const lineType = connector.lineType || 'line';
    const hasWaypoints = connector.waypoints && connector.waypoints.length > 0;
    
    ctx.strokeStyle = isSelected ? '#dc3545' : color;
    ctx.lineWidth = (thickness + (isSelected || isHovered ? 2 : 0)) / cameraZoom;
    
    if (lineStyle === 'dashed') {
        ctx.setLineDash([8 / cameraZoom, 4 / cameraZoom]);
    } else if (lineStyle === 'dotted') {
        ctx.setLineDash([thickness / cameraZoom, (thickness * 1.5) / cameraZoom]);
    }
    
    ctx.beginPath();
    if (lineType === 'curve' && hasWaypoints) {
        ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
        let i = 1;
        for (; i < pathPoints.length - 2; i++) {
            const xc = (pathPoints[i].x + pathPoints[i + 1].x) / 2;
            const yc = (pathPoints[i].y + pathPoints[i + 1].y) / 2;
            ctx.quadraticCurveTo(pathPoints[i].x, pathPoints[i].y, xc, yc);
        }
        ctx.quadraticCurveTo(pathPoints[i].x, pathPoints[i].y, pathPoints[i + 1].x, pathPoints[i + 1].y);
    } else {
        ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
        for (let i = 1; i < pathPoints.length; i++) {
            ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
        }
    }
    ctx.stroke();
    ctx.setLineDash([]);
    
    if (pathPoints.length >= 2) {
        const endPoint = pathPoints[pathPoints.length - 1];
        let fromPointForArrow = pathPoints[pathPoints.length - 2];
        drawArrowhead(ctx, fromPointForArrow, endPoint, isSelected, color);
    }
    
    if (isSelected) {
        ctx.fillStyle = '#ffc107';
        const handleSize = 6 / cameraZoom;
        (connector.waypoints || []).forEach(wp => {
            ctx.beginPath();
            ctx.rect(wp.x - handleSize / 2, wp.y - handleSize / 2, handleSize, handleSize);
            ctx.fill();
        });
    }
}

function drawArrowhead(ctx, from, to, isSelected, color) {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    ctx.save();
    ctx.translate(to.x, to.y);
    ctx.rotate(angle);
    ctx.strokeStyle = isSelected ? '#dc3545' : color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-10, -5);
    ctx.moveTo(0, 0);
    ctx.lineTo(-10, 5);
    ctx.stroke();
    ctx.restore();
}
