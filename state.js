// State Management
const state = {
    shapes: [],
    connectors: [],
    selectedItems: [],
    selectedConnectors: [],
    hoveredConnector: null,
    draggedWaypointInfo: null,
    isReconnecting: null,
    
    isDragging: false,
    isResizing: false,
    isConnecting: false,
    isPanning: false,
    isSelecting: false,
    isRotating: false,
    
    lastMousePos: { x: 0, y: 0 },
    startMousePos: { x: 0, y: 0 },
    startShapeState: null,
    resizeHandle: null,
    resizeAspectRatio: 1,
    currentConnector: null,
    panStart: { x: 0, y: 0 },
    selectionBox: { x: 0, y: 0, width: 0, height: 0 },
    
    cameraOffset: { x: 0, y: 0 },
    cameraZoom: 1,
    snapToGrid: false,
    
    lastTap: 0,
    lastTouchDistance: null,
    isMultiTouching: false,
    
    savedFilename: null
};

const config = {
    MAX_ZOOM: 5,
    MIN_ZOOM: 0.1,
    SCROLL_SENSITIVITY: 0.0005,
    GRID_SIZE: 20
};
