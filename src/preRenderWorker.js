/////////////////////
// Tree generation //
/////////////////////

const FULL_RADIANS = 2 * Math.PI;

function drawDot(context, branchStyle, currCoords) {
    let dotRadius = 3;
    context.beginPath();
    context.arc(currCoords.x, currCoords.y, dotRadius, 0, FULL_RADIANS);
    context.globalAlpha = 1;
    context.lineWidth = 2;
    context.fillStyle = branchStyle.symbolColor.getMappedValue(currCoords.layer);
    context.lineJoin = "round";
    context.fill();
}

function drawCircle(context, branchStyle, currCoords) {
    let circleRadius = 3;
    context.beginPath();
    context.globalAlpha = 0;
    context.moveTo(currCoords.x, currCoords.y);
    context.beginPath();
    context.arc(currCoords.x, currCoords.y, circleRadius, 0, FULL_RADIANS);
    context.globalAlpha = 1;
    context.lineWidth = 2;
    context.strokeStyle = branchStyle.symbolColor.getMappedValue(currCoords.layer);
    context.lineJoin = "round";
    context.stroke();
}

function drawLine(context, branchStyle, currCoords) {
    context.beginPath();
    context.lineJoin = "round";
    context.globalAlpha = branchStyle.opacity.getMappedValue(currCoords.layer);
    context.strokeStyle = branchStyle.color.getMappedValue(currCoords.layer);
    context.lineWidth = branchStyle.width.getMappedValue(currCoords.layer);
    context.moveTo(currCoords.parent.x, currCoords.parent.y);
    context.lineTo(currCoords.x, currCoords.y);
    context.stroke();
}

function drawSymbol(context, branchStyle, currCoords) {
    let drawnSymbol = branchStyle.symbol.getMappedValue(currCoords.layer);
    if (drawnSymbol === "dot") {
        drawDot(context, branchStyle, currCoords);
    } else if (drawnSymbol === "circle") {
        drawCircle(context, branchStyle, currCoords);
    }
}

onmessage = (e) => {
    const context = e.data.context;
    const branchStyle = e.data.branchStyle;
    const nodes = e.data.nodes;
    const renderMode = e.data.renderMode;

    for (let curr of nodes) {
        if (renderMode === "line") {
            drawLine(context, branchStyle, curr);
        } else if (renderMode === "symbol") {
            drawSymbol(context, branchStyle, curr);
        }
    }
}