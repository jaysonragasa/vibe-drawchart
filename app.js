// Main Application
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('flowchart-canvas');
    const ctx = canvas.getContext('2d');

    function init() {
        resizeCanvas();
        setupEventListeners();
        draw();
    }

    function resizeCanvas() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        draw();
    }

    function draw() {
        ctx.save();
        const isDark = document.documentElement.classList.contains('dark');
        ctx.fillStyle = isDark ? '#1f2937' : '#f9fafb';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.translate(state.cameraOffset.x, state.cameraOffset.y);
        ctx.scale(state.cameraZoom, state.cameraZoom);
        drawGrid(ctx, canvas, state.cameraOffset, state.cameraZoom, config.GRID_SIZE);
        state.connectors.forEach(c => drawConnector(ctx, c, state.selectedConnectors, state.hoveredConnector, state.isReconnecting, state.lastMousePos, state.shapes, state.cameraZoom));
        state.shapes.forEach(s => drawShape(ctx, s, state.selectedItems, state.cameraZoom));
        if (state.isSelecting) {
            ctx.strokeStyle = 'rgba(52, 152, 219, 0.8)';
            ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
            ctx.lineWidth = 1 / state.cameraZoom;
            ctx.strokeRect(state.selectionBox.x, state.selectionBox.y, state.selectionBox.width, state.selectionBox.height);
            ctx.fillRect(state.selectionBox.x, state.selectionBox.y, state.selectionBox.width, state.selectionBox.height);
        }
        if (state.selectedItems.length === 1) drawHandles(ctx, state.selectedItems[0], state.cameraZoom);
        ctx.restore();
    }

    function setupEventListeners() {
        window.addEventListener('resize', resizeCanvas);
        canvas.addEventListener('mousedown', e => handleMouseDown(e));
        canvas.addEventListener('mousemove', e => handleMouseMove(e));
        canvas.addEventListener('mouseup', e => handleMouseUp(e));
        canvas.addEventListener('dblclick', e => handleDoubleClick(e));
        canvas.addEventListener('wheel', e => handleWheel(e));
        document.querySelectorAll('.shape-palette-item').forEach(item => {
            item.addEventListener('click', e => {
                const type = e.currentTarget.id.split('-')[1];
                const x = (-state.cameraOffset.x + canvas.width / 2) / state.cameraZoom;
                const y = (-state.cameraOffset.y + canvas.height / 2) / state.cameraZoom;
                const newShape = addShape(type, x, y, state.shapes);
                state.selectedItems = [newShape];
                state.selectedConnectors = [];
                updatePropertiesPanel(state.selectedItems, state.selectedConnectors, state.shapes, draw);
                draw();
            });
        });
        document.getElementById('group-btn').addEventListener('click', groupSelection);
        document.getElementById('ungroup-btn').addEventListener('click', ungroupSelection);
        document.getElementById('save-btn').addEventListener('click', saveFile);
        document.getElementById('save-as-btn').addEventListener('click', saveAsFile);
        document.getElementById('import-file').addEventListener('change', importJSON);
        document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);
        document.getElementById('snap-grid').addEventListener('change', e => { state.snapToGrid = e.target.checked; });
        window.addEventListener('keydown', handleKeyDown);
    }



    function handleMouseDown(e) {
        if (e.altKey) {
            state.isPanning = true;
            state.panStart = { x: e.clientX, y: e.clientY };
            canvas.style.cursor = 'grabbing';
            return;
        }
        const mousePos = getEventPos(e, canvas, state.cameraOffset, state.cameraZoom);
        state.draggedWaypointInfo = getWaypointAt(mousePos, state.selectedConnectors, state.cameraZoom);
        if (state.draggedWaypointInfo) return;
        state.isReconnecting = getConnectorEndAt(mousePos, state.selectedConnectors, state.shapes, state.cameraZoom);
        if (state.isReconnecting) { state.lastMousePos = mousePos; return; }
        if (state.selectedItems.length === 1) {
            const shape = state.selectedItems[0];
            if (getRotationHandleAt(mousePos, shape, state.cameraZoom)) { state.isRotating = true; return; }
            const connectionPoint = getConnectionPointAt(mousePos, shape, state.cameraZoom);
            if (connectionPoint) {
                state.isConnecting = true;
                state.currentConnector = { from: { shapeId: shape.id, point: connectionPoint }, to: { x: mousePos.x, y: mousePos.y } };
                return;
            }
            state.resizeHandle = getResizeHandleAt(mousePos, shape, state.cameraZoom);
            if (state.resizeHandle) {
                state.isResizing = true;
                state.resizeAspectRatio = shape.width / shape.height;
                state.startShapeState = { x: shape.x, y: shape.y, w: shape.width, h: shape.height };
                state.startMousePos = mousePos;
                return;
            }
        }
        const clickedConnector = getConnectorAt(mousePos, state.connectors, state.shapes, state.cameraZoom);
        if (clickedConnector) {
            state.selectedItems = [];
            state.selectedConnectors = [clickedConnector];
            updatePropertiesPanel(state.selectedItems, state.selectedConnectors, state.shapes, draw);
            draw();
            return;
        }
        const clickedShape = getShapeAt(mousePos, state.shapes);
        if (clickedShape) {
            state.selectedConnectors = [];
            if (!state.selectedItems.includes(clickedShape)) state.selectedItems = [clickedShape];
            state.isDragging = true;
            state.lastMousePos = mousePos;
        } else {
            state.selectedItems = [];
            state.selectedConnectors = [];
            state.isSelecting = true;
            state.selectionBox = { x: mousePos.x, y: mousePos.y, width: 0, height: 0 };
        }
        updatePropertiesPanel(state.selectedItems, state.selectedConnectors, state.shapes, draw);
        draw();
    }

    function handleMouseMove(e) {
        if (state.isPanning) {
            state.cameraOffset.x += e.clientX - state.panStart.x;
            state.cameraOffset.y += e.clientY - state.panStart.y;
            state.panStart = { x: e.clientX, y: e.clientY };
            draw();
            return;
        }
        const mousePos = getEventPos(e, canvas, state.cameraOffset, state.cameraZoom);
        if (state.isRotating) {
            const shape = state.selectedItems[0];
            const angle = Math.atan2(mousePos.y - (shape.y + shape.height / 2), mousePos.x - (shape.x + shape.width / 2));
            shape.rotation = angle + Math.PI / 2;
            draw();
            return;
        }
        if (state.isReconnecting) { state.lastMousePos = mousePos; draw(); return; }
        if (state.draggedWaypointInfo) {
            state.draggedWaypointInfo.connector.waypoints[state.draggedWaypointInfo.waypointIndex] = mousePos;
            draw();
            return;
        }
        if (state.isResizing) {
            const shape = state.selectedItems[0];
            const dx = mousePos.x - state.startMousePos.x;
            const dy = mousePos.y - state.startMousePos.y;
            const sin = Math.sin(-(shape.rotation || 0));
            const cos = Math.cos(-(shape.rotation || 0));
            const localDx = dx * cos - dy * sin;
            const localDy = dx * sin + dy * cos;
            let newW = state.startShapeState.w, newH = state.startShapeState.h;
            let newX = state.startShapeState.x, newY = state.startShapeState.y;
            if (state.resizeHandle === 'bottomRight') {
                newW += localDx; newH += localDy;
            } else if (state.resizeHandle === 'bottomLeft') {
                newW -= localDx; newH += localDy;
                newX = (state.startShapeState.x + state.startShapeState.w) - newW;
            } else if (state.resizeHandle === 'topRight') {
                newW += localDx; newH -= localDy;
                newY = (state.startShapeState.y + state.startShapeState.h) - newH;
            } else if (state.resizeHandle === 'topLeft') {
                newW -= localDx; newH -= localDy;
                newX = (state.startShapeState.x + state.startShapeState.w) - newW;
                newY = (state.startShapeState.y + state.startShapeState.h) - newH;
            } else {
                if (state.resizeHandle.includes('right')) newW += localDx;
                if (state.resizeHandle.includes('left')) { newW -= localDx; newX += localDx; }
                if (state.resizeHandle.includes('bottom')) newH += localDy;
                if (state.resizeHandle.includes('top')) { newH -= localDy; newY += localDy; }
            }
            if (['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].includes(state.resizeHandle)) {
                const r = state.resizeAspectRatio;
                const refinedH = (newW * r + newH) / (r * r + 1);
                newW = refinedH * r; newH = refinedH;
                if (state.resizeHandle === 'bottomLeft') newX = (state.startShapeState.x + state.startShapeState.w) - newW;
                else if (state.resizeHandle === 'topRight') newY = (state.startShapeState.y + state.startShapeState.h) - newH;
                else if (state.resizeHandle === 'topLeft') {
                    newX = (state.startShapeState.x + state.startShapeState.w) - newW;
                    newY = (state.startShapeState.y + state.startShapeState.h) - newH;
                }
            }
            if (newW < 20) newW = 20; if (newH < 20) newH = 20;
            shape.width = newW; shape.height = newH; shape.x = newX; shape.y = newY;
            if (state.snapToGrid) snapShape(shape, config.GRID_SIZE);
            draw();
        } else if (state.isDragging) {
            const dx = mousePos.x - state.lastMousePos.x;
            const dy = mousePos.y - state.lastMousePos.y;
            state.selectedItems.forEach(shape => { 
                shape.x += dx; 
                shape.y += dy;
                updateChildrenPositions(shape, dx, dy, state.shapes);
            });
            state.lastMousePos = mousePos;
            draw();
        } else if (state.isSelecting) {
            state.selectionBox.width = mousePos.x - state.selectionBox.x;
            state.selectionBox.height = mousePos.y - state.selectionBox.y;
            draw();
        }
    }

    function handleMouseUp(e) {
        const mousePos = getEventPos(e, canvas, state.cameraOffset, state.cameraZoom);
        
        if (state.isSelecting) {
            const box = { 
                x: Math.min(state.selectionBox.x, state.selectionBox.x + state.selectionBox.width),
                y: Math.min(state.selectionBox.y, state.selectionBox.y + state.selectionBox.height),
                width: Math.abs(state.selectionBox.width),
                height: Math.abs(state.selectionBox.height)
            };
            state.selectedItems = state.shapes.filter(shape => 
                shape.x < box.x + box.width && 
                shape.x + shape.width > box.x && 
                shape.y < box.y + box.height && 
                shape.y + shape.height > box.y
            );
            updatePropertiesPanel(state.selectedItems, state.selectedConnectors, state.shapes, draw);
        }
        
        if (state.isReconnecting) {
            const endShape = getShapeAt(mousePos, state.shapes);
            if (endShape && endShape.allowConnections !== false) {
                const isConnectingFrom = state.isReconnecting.end === 'from';
                const staticEndShapeId = isConnectingFrom ? state.isReconnecting.connector.to.shapeId : state.isReconnecting.connector.from.shapeId;
                
                if (endShape.id !== staticEndShapeId) {
                    let endPoint = null;
                    const points = getConnectionPoints(endShape, state.cameraZoom);
                    let minDist = Infinity;
                    for (const pointName in points) {
                        const pointPos = getAttachPoint(endShape, pointName, state.cameraZoom);
                        const dist = Math.hypot(mousePos.x - pointPos.x, mousePos.y - pointPos.y);
                        if (dist < minDist) {
                            minDist = dist;
                            endPoint = pointName;
                        }
                    }
                    if (endPoint) {
                        if (isConnectingFrom) {
                            state.isReconnecting.connector.from = { shapeId: endShape.id, point: endPoint };
                        } else {
                            state.isReconnecting.connector.to = { shapeId: endShape.id, point: endPoint };
                        }
                    }
                }
            }
        } else if (state.isConnecting) {
            const endShape = getShapeAt(mousePos, state.shapes);
            if (endShape && endShape.id !== state.currentConnector.from.shapeId && endShape.allowConnections !== false) {
                const points = getConnectionPoints(endShape, state.cameraZoom);
                let endPoint = null;
                let minDist = Infinity;
                for (const pointName in points) {
                    const pointPos = getAttachPoint(endShape, pointName, state.cameraZoom);
                    const dist = Math.hypot(mousePos.x - pointPos.x, mousePos.y - pointPos.y);
                    if (dist < minDist) {
                        minDist = dist;
                        endPoint = pointName;
                    }
                }
                if (endPoint) {
                    state.connectors.push({
                        id: Date.now(),
                        from: state.currentConnector.from,
                        to: { shapeId: endShape.id, point: endPoint },
                        waypoints: [],
                        color: '#ddd',
                        thickness: 2,
                        lineStyle: 'solid',
                        lineType: 'line'
                    });
                }
            }
        }
        
        if (state.isDragging && state.snapToGrid) {
            state.selectedItems.forEach(shape => snapShape(shape, config.GRID_SIZE));
        }
        
        state.draggedWaypointInfo = null;
        state.isDragging = false;
        state.isResizing = false;
        state.isConnecting = false;
        state.isSelecting = false;
        state.isRotating = false;
        state.isReconnecting = null;
        state.isPanning = false;
        state.currentConnector = null;
        canvas.style.cursor = 'default';
        draw();
    }

    function handleWheel(e) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldX = (mouseX - state.cameraOffset.x) / state.cameraZoom;
        const worldY = (mouseY - state.cameraOffset.y) / state.cameraZoom;
        const delta = e.deltaY * config.SCROLL_SENSITIVITY;
        const newZoom = state.cameraZoom * (1 - delta);
        state.cameraZoom = Math.max(config.MIN_ZOOM, Math.min(config.MAX_ZOOM, newZoom));
        state.cameraOffset.x = mouseX - worldX * state.cameraZoom;
        state.cameraOffset.y = mouseY - worldY * state.cameraZoom;
        draw();
    }

    function handleDoubleClick(e) {
        const mousePos = getEventPos(e, canvas, state.cameraOffset, state.cameraZoom);
        
        const waypointHit = getWaypointAt(mousePos, state.selectedConnectors, state.cameraZoom);
        if (waypointHit) {
            waypointHit.connector.waypoints.splice(waypointHit.waypointIndex, 1);
            draw();
            return;
        }
        
        const hit = getConnectorSegmentAt(mousePos, state.connectors, state.shapes, state.cameraZoom);
        if (hit) {
            if (!hit.connector.waypoints) hit.connector.waypoints = [];
            hit.connector.waypoints.splice(hit.segmentIndex - 1, 0, mousePos);
            state.selectedConnectors = [hit.connector];
            state.selectedItems = [];
            updatePropertiesPanel(state.selectedItems, state.selectedConnectors, state.shapes, draw);
            draw();
        }
    }

    function groupSelection() {
        if (state.selectedItems.length <= 1) return;
        let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
        state.selectedItems.forEach(s => {
            minX = Math.min(minX, s.x);
            minY = Math.min(minY, s.y);
            maxX = Math.max(maxX, s.x + s.width);
            maxY = Math.max(maxY, s.y + s.height);
        });
        const padding = 20;
        const groupShape = {
            id: Date.now(),
            type: 'group',
            x: minX - padding,
            y: minY - padding,
            width: (maxX - minX) + padding * 2,
            height: (maxY - minY) + padding * 2,
            text: '',
            borderColor: '#3498db',
            borderWidth: 2,
            fill: false,
            border: true,
            children: state.selectedItems.map(s => s.id),
            parentId: null,
            rotation: 0
        };
        state.selectedItems.forEach(s => s.parentId = groupShape.id);
        state.shapes.push(groupShape);
        state.selectedItems = [groupShape];
        updatePropertiesPanel(state.selectedItems, state.selectedConnectors, state.shapes, draw);
        draw();
    }

    function ungroupSelection() {
        if (state.selectedItems.length !== 1 || state.selectedItems[0].type !== 'group') return;
        const group = state.selectedItems[0];
        group.children.forEach(childId => {
            const child = state.shapes.find(s => s.id === childId);
            if (child) child.parentId = null;
        });
        state.shapes = state.shapes.filter(s => s.id !== group.id);
        state.selectedItems = [];
        updatePropertiesPanel(state.selectedItems, state.selectedConnectors, state.shapes, draw);
        draw();
    }

    function saveFile() {
        if (!state.savedFilename) {
            saveAsFile();
            return;
        }
        const data = { shapes: state.shapes, connectors: state.connectors, cameraOffset: state.cameraOffset, cameraZoom: state.cameraZoom };
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = state.savedFilename;
        a.click();
        URL.revokeObjectURL(url);
    }

    function saveAsFile() {
        const filename = prompt('Enter filename:', state.savedFilename || 'flowchart.json');
        if (!filename) return;
        state.savedFilename = filename.endsWith('.json') ? filename : filename + '.json';
        const data = { shapes: state.shapes, connectors: state.connectors, cameraOffset: state.cameraOffset, cameraZoom: state.cameraZoom };
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = state.savedFilename;
        a.click();
        URL.revokeObjectURL(url);
    }

    function importJSON(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = event => {
            try {
                const data = JSON.parse(event.target.result);
                state.shapes = data.shapes || [];
                state.shapes.forEach(s => { if (s.type === 'image') s.imageElem = null; });
                state.connectors = data.connectors || [];
                state.cameraOffset = data.cameraOffset || { x: 0, y: 0 };
                state.cameraZoom = data.cameraZoom || 1;
                state.selectedItems = [];
                state.selectedConnectors = [];
                updatePropertiesPanel(state.selectedItems, state.selectedConnectors, state.shapes, draw);
                draw();
            } catch (error) {
                console.error('Error parsing JSON file:', error);
            }
        };
        reader.readAsText(file);
    }

    function handleKeyDown(e) {
        if (e.key === 'Delete') {
            if (state.selectedItems.length > 0 || state.selectedConnectors.length > 0) {
                e.preventDefault();
                deleteSelected();
            }
        }
    }

    function deleteSelected() {
        if (state.selectedItems.length > 0) {
            const hasGroup = state.selectedItems.some(s => s.type === 'group');
            if (hasGroup) {
                if (!confirm('Are you sure you want to delete this group and all its children?')) {
                    return;
                }
            }
            const idsToDelete = new Set(state.selectedItems.flatMap(s => 
                s.type === 'group' ? [s.id, ...s.children] : [s.id]
            ));
            state.shapes = state.shapes.filter(s => !idsToDelete.has(s.id));
            state.connectors = state.connectors.filter(c => 
                !idsToDelete.has(c.from.shapeId) && !idsToDelete.has(c.to.shapeId)
            );
        } else if (state.selectedConnectors.length > 0) {
            const idsToDelete = new Set(state.selectedConnectors.map(c => c.id));
            state.connectors = state.connectors.filter(c => !idsToDelete.has(c.id));
        }
        state.selectedItems = [];
        state.selectedConnectors = [];
        updatePropertiesPanel(state.selectedItems, state.selectedConnectors, state.shapes, draw);
        draw();
    }

    function toggleTheme() {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        const sunIcon = document.getElementById('theme-icon-sun');
        const moonIcon = document.getElementById('theme-icon-moon');
        if (isDark) {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        }
        draw();
    }

    init();
});
