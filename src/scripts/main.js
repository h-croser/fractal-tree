///////////
// Style //
///////////

// Style Maps

import Deque from "double-ended-queue";


/////////////////////
// Tree generation //
/////////////////////

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function drawLine(context, branchStyle, currCoords) {
    context.beginPath();
    context.moveTo(currCoords.parent.x, currCoords.parent.y);
    context.lineTo(currCoords.x, currCoords.y);
    context.globalAlpha = branchStyle.opacity.getMappedValue(currCoords.layer);
    context.strokeStyle = branchStyle.color.getMappedValue(currCoords.layer);
    context.lineWidth = branchStyle.width.getMappedValue(currCoords.layer);
    context.lineJoin = "round";
    context.stroke();
}

function generateTree(context, branchStyle, numLayers, angleOffsetConstant, addedOffset, root) {
    // const queue = [root];
    const queue = new Deque([root]);
    const angleOffsetAdjusted = angleOffsetConstant + addedOffset;
    let curr, leftOffset, rightOffset, branchLength, newX, newY, newNode, offset;
    while (queue.length !== 0)  {
        curr = queue.shift();
        drawLine(context, branchStyle, curr);
        if (curr.layer >= numLayers) {
            continue;
        }
        branchLength = branchStyle.length.getMappedValue(curr.layer);
        leftOffset = curr.angle + angleOffsetAdjusted;
        rightOffset = curr.angle - angleOffsetAdjusted;
        for (offset of [leftOffset, rightOffset]) {
            newX = curr.x - branchLength * Math.sin(offset);
            newY = curr.y - branchLength * Math.cos(offset);
            newNode = {x: Math.floor(newX), y: Math.floor(newY), angle: offset, layer: curr.layer + 1, parent: curr};
            queue.push(newNode);
        }
    }
}

function generateTreeFromInputs(context, branchStyle, midpoint) {
    let startTime = new Date().getTime();
    context.reset();

    // Tree variables
    let numLayers = parseInt(document.getElementById("num-layers-input").value);
    let degreesOffset = parseInt(document.getElementById("angle-input").value);
    let numRoots = parseInt(document.getElementById("num-trees-input").value);

    branchStyle.numLayers = numLayers;

    let currCoords = {x: midpoint[0], y: midpoint[1], angle: 0, layer: 0, parent: {x: midpoint[0], y: midpoint[1], angle: 0, layer: 0, parent: null}};
    let addedDegrees = 0;
    for (let root = 1; root <= numRoots; root++) {
        addedDegrees = (360 / numRoots) * root;
        generateTree(context, branchStyle, numLayers, toRadians(degreesOffset), toRadians(addedDegrees), currCoords);
    }
    let totalSeconds = (new Date().getTime() - startTime) / 1000;
    console.log(`Time taken to render: ${totalSeconds}s`);
}

function generateTreeFromStyleInputs(context, branchStyle, midpoint) {
    // Style variables
    branchStyle.color.start = document.getElementById("color-start-input").value;
    branchStyle.color.end = document.getElementById("color-end-input").value;
    branchStyle.width.start = parseFloat(document.getElementById("width-start-input").value);
    branchStyle.width.end = parseFloat(document.getElementById("width-end-input").value);
    branchStyle.length.start = parseInt(document.getElementById("length-start-input").value);
    branchStyle.length.end = parseInt(document.getElementById("length-end-input").value);
    branchStyle.opacity.start = parseFloat(document.getElementById("opacity-start-input").value);
    branchStyle.opacity.end = parseFloat(document.getElementById("opacity-end-input").value);
    branchStyle.symbol.start = document.getElementById("symbol-start-input").value;
    branchStyle.symbol.end = document.getElementById("symbol-end-input").value;

    generateTreeFromInputs(context, branchStyle, midpoint);
}

async function generateTreeWithDefaultStyle(context, branchStyle, midpoint) {
    await branchStyle.initialiseStyles(true);
    generateTreeFromInputs(context, branchStyle, midpoint);
}


function main() {
    const midpoint = [500, 500];

    const canvas = document.getElementById("fractal-container");
    const context = canvas.getContext("2d");
    // const scaleX = (window.innerWidth / canvas.width) * 0.75;
    // const scaleY = (window.innerHeight / canvas.height) * 0.75;
    //
    // const scaleToFit = Math.min(scaleX, scaleY);
    // const scaleToCover = Math.max(scaleX, scaleY);

    // document.getElementById("fractal-container").style.transformOrigin = "0 0"; //scale from top left
    // document.getElementById("fractal-container").style.transform = `scale(${scaleToFit})`;

    const branchStyle = new BranchStyle("./branchStyleDefaults.json");
    setupStyleModal();

    const inputIds = ["num-layers-input", "angle-input", "num-trees-input"];
    for (let inputId of inputIds) {
        document.getElementById(inputId).addEventListener("input", () => generateTreeFromInputs(context, branchStyle, midpoint));
    }
    document.getElementById("apply-style-button").addEventListener("click", () => generateTreeFromStyleInputs(context, branchStyle, midpoint));
    document.getElementById("reset-default-styles-button").addEventListener("click", () => generateTreeWithDefaultStyle(context, branchStyle, midpoint));

    generateTreeWithDefaultStyle(context, branchStyle, midpoint);
}

main();
