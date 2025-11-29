// Utility Functions
function getEventPos(evt, canvas, cameraOffset, cameraZoom) {
    const rect = canvas.getBoundingClientRect();
    const clientX = evt.clientX ?? evt.touches[0].clientX;
    const clientY = evt.clientY ?? evt.touches[0].clientY;
    return { 
        x: (clientX - rect.left - cameraOffset.x) / cameraZoom, 
        y: (clientY - rect.top - cameraOffset.y) / cameraZoom 
    };
}

function rotatePoint(point, center, angle) {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return { 
        x: center.x + dx * cos - dy * sin, 
        y: center.y + dx * sin + dy * cos 
    };
}

function snapShape(shape, gridSize) {
    shape.x = Math.round(shape.x / gridSize) * gridSize;
    shape.y = Math.round(shape.y / gridSize) * gridSize;
    shape.width = Math.round(shape.width / gridSize) * gridSize;
    shape.height = Math.round(shape.height / gridSize) * gridSize;
}

function isPointOnLineSegment(p, a, b, radius) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y) < radius;
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const closestX = a.x + t * dx;
    const closestY = a.y + t * dy;
    const distSq = (p.x - closestX) * (p.x - closestX) + (p.y - closestY) * (p.y - closestY);
    return distSq < radius * radius;
}

function distToSegmentSquared(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y) ** 2;
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const closestX = a.x + t * dx;
    const closestY = a.y + t * dy;
    return (p.x - closestX) * (p.x - closestX) + (p.y - closestY) * (p.y - closestY);
}

function getTouchDistance(e) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.hypot(dx, dy);
}

function getMidpoint(e) {
    return { 
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2, 
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2 
    };
}

function getResizeCursor(handle, rotation = 0) {
    let angle = 0;
    switch (handle) {
        case 'right': angle = 0; break;
        case 'bottomRight': angle = 45; break;
        case 'bottom': angle = 90; break;
        case 'bottomLeft': angle = 135; break;
        case 'left': angle = 180; break;
        case 'topLeft': angle = 225; break;
        case 'top': angle = 270; break;
        case 'topRight': angle = 315; break;
    }
    angle += (rotation * 180 / Math.PI);
    angle = (angle % 360 + 360) % 360;
    if (angle >= 337.5 || angle < 22.5) return 'ew-resize';
    if (angle >= 22.5 && angle < 67.5) return 'nwse-resize';
    if (angle >= 67.5 && angle < 112.5) return 'ns-resize';
    if (angle >= 112.5 && angle < 157.5) return 'nesw-resize';
    if (angle >= 157.5 && angle < 202.5) return 'ew-resize';
    if (angle >= 202.5 && angle < 247.5) return 'nwse-resize';
    if (angle >= 247.5 && angle < 292.5) return 'ns-resize';
    if (angle >= 292.5 && angle < 337.5) return 'nesw-resize';
    return 'default';
}
