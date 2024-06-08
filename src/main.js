///////////
// Style //
///////////

// Style Maps

import Deque from "double-ended-queue";
import { BranchStyle } from "./treeStyle";

const fullRadians = 2 * Math.PI;


/////////////////////
// Tree generation //
/////////////////////

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function drawDot(context, branchStyle, currCoords) {
    let dotRadius = 3;
    context.stroke();
    context.moveTo(currCoords.parent.x, currCoords.parent.y);
    context.arc(currCoords.x, currCoords.y, dotRadius, 0, fullRadians);
    context.globalAlpha = 1;
    context.lineWidth = 2;
    context.fillStyle = branchStyle.symbolColor.getMappedValue(currCoords.layer);
    context.lineJoin = "round";
    context.fill();
}

function drawCircle(context, branchStyle, currCoords) {
    let circleRadius = 3;
    context.moveTo(currCoords.parent.x, currCoords.parent.y);
    context.arc(currCoords.x, currCoords.y, circleRadius, 0, fullRadians);
    context.globalAlpha = 1;
    context.lineWidth = 2;
    context.strokeStyle = branchStyle.symbolColor.getMappedValue(currCoords.layer);
    context.lineJoin = "round";
    context.stroke();
}

function drawLine(context, branchStyle, currCoords) {
    context.beginPath();
    context.moveTo(currCoords.parent.x, currCoords.parent.y);
    context.lineTo(currCoords.x, currCoords.y);
    context.lineJoin = "round";
    context.globalAlpha = branchStyle.opacity.getMappedValue(currCoords.layer);
    context.strokeStyle = branchStyle.color.getMappedValue(currCoords.layer);
    context.lineWidth = branchStyle.width.getMappedValue(currCoords.layer);
    let drawnSymbol = branchStyle.symbol.getMappedValue(currCoords.layer);

    if (drawnSymbol === "dot") {
        drawDot(context, branchStyle, currCoords);
    } else if (drawnSymbol === "circle") {
        drawCircle(context, branchStyle, currCoords);
    } else {
        context.stroke();
    }
}

function generateTree(context, branchStyle, numLayers, angleOffsetConstant, addedOffset, root) {
    const queue = new Deque([root]);
    let curr, leftOffset, rightOffset, branchLength, newX, newY, newNode, offset;
    while (queue.length !== 0)  {
        curr = queue.shift();
        drawLine(context, branchStyle, curr);
        if (curr.layer < numLayers) {
            branchLength = branchStyle.length.getMappedValue(curr.layer);
            leftOffset = curr.angle + angleOffsetConstant + addedOffset;
            rightOffset = curr.angle - angleOffsetConstant + addedOffset;
            for (offset of [leftOffset, rightOffset]) {
                newX = curr.x - branchLength * Math.sin(offset);
                newY = curr.y - branchLength * Math.cos(offset);
                newNode = {x: newX, y: newY, angle: offset, layer: curr.layer + 1, parent: curr};
                queue.push(newNode);
            }
        }
    }
}

function generateTreeFromInputs(context, branchStyle) {
    context.reset();

    // Tree variables
    let numLayers = parseInt(document.getElementById("num-layers-input").value);
    let degreesOffset = parseInt(document.getElementById("angle-input").value);
    let numRoots = parseInt(document.getElementById("num-trees-input").value);

    branchStyle.numLayers = numLayers;

    let startX = context.canvas.width / 2;
    let startY = context.canvas.height / 2;

    let currCoords = {x: startX, y: startY, angle: 0, layer: 0, parent: {x: startX, y: startY, angle: 0, layer: 0, parent: null}};
    let addedDegrees = 0;
    for (let root = 1; root <= numRoots; root++) {
        addedDegrees = (360 / numRoots) * root;
        generateTree(context, branchStyle, numLayers, toRadians(degreesOffset), toRadians(addedDegrees), currCoords);
    }
}

function generateTreeFromStyleInputs(context, branchStyle) {
    for (let attribute of branchStyle.attributesList) {
        branchStyle[attribute].start = document.getElementById(`${attribute}-start-input`).value;
        branchStyle[attribute].end = document.getElementById(`${attribute}-end-input`).value;
    }

    generateTreeFromInputs(context, branchStyle);
}

async function generateTreeWithDefaultStyle(context, branchStyle) {
    await branchStyle.initialiseStyles(true);
    generateTreeFromInputs(context, branchStyle);
}

function setupStyleModal() {
    const modal = document.getElementById("styleModal");
    const modalOpenButton = document.getElementById("modalOpenButton");
    const modalCloseButton = document.getElementById("modelCloseButton");

    modalOpenButton.onclick = function() {
        modal.style.display = "block";
    }

    modalCloseButton.onclick = function() {
        modal.style.display = "none";
    }

    // Close the modal when clicking outside the modal content
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    }
}


function main() {
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
        document.getElementById(inputId).addEventListener("input", () => generateTreeFromInputs(context, branchStyle));
    }
    document.getElementById("apply-style-button").addEventListener("click", () => generateTreeFromStyleInputs(context, branchStyle));
    document.getElementById("reset-default-styles-button").addEventListener("click", () => generateTreeWithDefaultStyle(context, branchStyle));

    generateTreeWithDefaultStyle(context, branchStyle);
}

main();
