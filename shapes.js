// Shape Management
function getShapeAt(pos, shapes) {
    for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        const center = { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
        const unrotatedPos = rotatePoint(pos, center, -(shape.rotation || 0));
        if (unrotatedPos.x >= shape.x && unrotatedPos.x <= shape.x + shape.width && 
            unrotatedPos.y >= shape.y && unrotatedPos.y <= shape.y + shape.height) {
            return shape;
        }
    }
    return null;
}

function getResizeHandles(shape) {
    return {
        topLeft: { x: shape.x, y: shape.y },
        topRight: { x: shape.x + shape.width, y: shape.y },
        bottomLeft: { x: shape.x, y: shape.y + shape.height },
        bottomRight: { x: shape.x + shape.width, y: shape.y + shape.height },
        top: { x: shape.x + shape.width / 2, y: shape.y },
        bottom: { x: shape.x + shape.width / 2, y: shape.y + shape.height },
        left: { x: shape.x, y: shape.y + shape.height / 2 },
        right: { x: shape.x + shape.width, y: shape.y + shape.height / 2 }
    };
}

function getConnectionPoints(shape, cameraZoom) {
    const offset = 15 / cameraZoom;
    return {
        top: { x: shape.x + shape.width / 2, y: shape.y - offset },
        bottom: { x: shape.x + shape.width / 2, y: shape.y + shape.height + offset },
        left: { x: shape.x - offset, y: shape.y + shape.height / 2 },
        right: { x: shape.x + shape.width + offset, y: shape.y + shape.height / 2 }
    };
}

function getRotationHandle(shape, cameraZoom) {
    return { x: shape.x + shape.width / 2, y: shape.y - 30 / cameraZoom };
}

function getResizeHandleAt(pos, shape, cameraZoom) {
    const handles = getResizeHandles(shape);
    const center = { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
    const hitRadius = 14 / cameraZoom;
    for (const handle in handles) {
        const rotatedHandle = rotatePoint(handles[handle], center, shape.rotation || 0);
        if (Math.hypot(pos.x - rotatedHandle.x, pos.y - rotatedHandle.y) < hitRadius / 2) {
            return handle;
        }
    }
    return null;
}

function getConnectionPointAt(pos, shape, cameraZoom) {
    if (shape.allowConnections === false) return null;
    const points = getConnectionPoints(shape, cameraZoom);
    const center = { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
    const hitRadius = 10 / cameraZoom;
    for (const point in points) {
        const rotatedPoint = rotatePoint(points[point], center, shape.rotation || 0);
        if (Math.hypot(pos.x - rotatedPoint.x, pos.y - rotatedPoint.y) < hitRadius / 2) {
            return point;
        }
    }
    return null;
}

function getRotationHandleAt(pos, shape, cameraZoom) {
    const center = { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
    const handlePos = rotatePoint(getRotationHandle(shape, cameraZoom), center, shape.rotation || 0);
    const hitRadius = 10 / cameraZoom;
    return Math.hypot(pos.x - handlePos.x, pos.y - handlePos.y) < hitRadius;
}

function getAttachPoint(shape, pointName, cameraZoom) {
    const unrotatedPoints = getConnectionPoints(shape, cameraZoom);
    const center = { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
    const unrotatedPoint = unrotatedPoints[pointName] || center;
    return rotatePoint(unrotatedPoint, center, shape.rotation || 0);
}

function addShape(type, x, y, shapes) {
    const newShape = {
        id: Date.now(),
        type: type,
        x: x - 75,
        y: y - 40,
        width: 150,
        height: 80,
        text: 'New Shape',
        textColor: '#ffffff',
        fontSize: 14,
        fillColor: '#4a5568',
        borderColor: '#a0aec0',
        borderWidth: 2,
        fill: true,
        border: true,
        children: [],
        parentId: null,
        borderRadius: 4,
        opacity: 1,
        rotation: 0,
        allowConnections: true
    };
    
    if (type === 'text') {
        newShape.fill = false;
        newShape.border = false;
        newShape.text = 'Enter text...';
    }
    if (type === 'pie') newShape.angle = 90;
    if (type === 'checkmark') {
        newShape.fill = false;
        newShape.width = 50;
        newShape.height = 50;
        newShape.text = '';
    }
    if (type === 'image') {
        newShape.text = '';
        newShape.imageSrc = null;
        newShape.imageFit = 'fill';
    }
    
    const parentShape = getShapeAt({ x, y }, shapes);
    if (parentShape) {
        newShape.parentId = parentShape.id;
        parentShape.children.push(newShape.id);
    }
    
    shapes.push(newShape);
    return newShape;
}

function updateChildrenPositions(parentShape, dx, dy, shapes) {
    if (parentShape.type !== 'group' || !parentShape.children) return;
    parentShape.children.forEach(childId => {
        const child = shapes.find(s => s.id === childId);
        if (child) {
            child.x += dx;
            child.y += dy;
            updateChildrenPositions(child, dx, dy, shapes);
        }
    });
}
