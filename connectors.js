// Connector Management
function getConnectorPath(connector, shapes, cameraZoom) {
    const startShape = shapes.find(s => s.id === connector.from.shapeId);
    const endShape = shapes.find(s => s.id === connector.to.shapeId);
    if (!startShape || !endShape) return [];
    const startPoint = getAttachPoint(startShape, connector.from.point, cameraZoom);
    const endPoint = getAttachPoint(endShape, connector.to.point, cameraZoom);
    return [startPoint, ...(connector.waypoints || []), endPoint];
}

function getConnectorSegmentAt(pos, connectors, shapes, cameraZoom) {
    const hitRadius = 5 / cameraZoom;
    for (const connector of connectors) {
        const pathPoints = getConnectorPath(connector, shapes, cameraZoom);
        if (pathPoints.length < 2) continue;
        
        const lineType = connector.lineType || 'line';
        const hasWaypoints = connector.waypoints && connector.waypoints.length > 0;
        let effectivePathPoints = pathPoints;
        
        if (lineType === 'curve' && hasWaypoints) {
            const approxPoints = [];
            const steps = 20;
            let p0 = pathPoints[0];
            approxPoints.push(p0);
            for (let i = 1; i < pathPoints.length - 1; i++) {
                const p1 = pathPoints[i];
                const p2 = (i < pathPoints.length - 2) ? 
                    { x: (p1.x + pathPoints[i + 1].x) / 2, y: (p1.y + pathPoints[i + 1].y) / 2 } : 
                    pathPoints[i + 1];
                for (let j = 1; j <= steps; j++) {
                    const t = j / steps;
                    const mt = 1 - t;
                    approxPoints.push({
                        x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
                        y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
                    });
                }
                p0 = p2;
            }
            effectivePathPoints = approxPoints;
        }
        
        for (let i = 0; i < effectivePathPoints.length - 1; i++) {
            const p1 = effectivePathPoints[i];
            const p2 = effectivePathPoints[i + 1];
            if (isPointOnLineSegment(pos, p1, p2, hitRadius)) {
                let closestOrigSegment = 0;
                let minDistSq = Infinity;
                for (let j = 0; j < pathPoints.length - 1; j++) {
                    const distSq = distToSegmentSquared(pos, pathPoints[j], pathPoints[j + 1]);
                    if (distSq < minDistSq) {
                        minDistSq = distSq;
                        closestOrigSegment = j + 1;
                    }
                }
                return { connector, segmentIndex: closestOrigSegment };
            }
        }
    }
    return null;
}

function getConnectorAt(pos, connectors, shapes, cameraZoom) {
    const hitInfo = getConnectorSegmentAt(pos, connectors, shapes, cameraZoom);
    return hitInfo ? hitInfo.connector : null;
}

function getConnectorEndAt(pos, selectedConnectors, shapes, cameraZoom) {
    if (selectedConnectors.length !== 1) return null;
    const connector = selectedConnectors[0];
    const pathPoints = getConnectorPath(connector, shapes, cameraZoom);
    if (pathPoints.length < 2) return null;
    
    const startPoint = pathPoints[0];
    const endPoint = pathPoints[pathPoints.length - 1];
    const hitRadius = 10 / cameraZoom;
    const distToStart = Math.hypot(pos.x - startPoint.x, pos.y - startPoint.y);
    const distToEnd = Math.hypot(pos.x - endPoint.x, pos.y - endPoint.y);
    
    if (distToEnd < hitRadius) return { connector, end: 'to' };
    if (distToStart < hitRadius) return { connector, end: 'from' };
    return null;
}

function getWaypointAt(pos, selectedConnectors, cameraZoom) {
    const hitRadius = 8 / cameraZoom;
    if (selectedConnectors.length === 1) {
        const connector = selectedConnectors[0];
        if (!connector.waypoints) return null;
        for (let i = 0; i < connector.waypoints.length; i++) {
            const wp = connector.waypoints[i];
            const distSq = (pos.x - wp.x) * (pos.x - wp.x) + (pos.y - wp.y) * (pos.y - wp.y);
            if (distSq < (hitRadius * hitRadius)) {
                return { connector, waypointIndex: i };
            }
        }
    }
    return null;
}
