///////////
// Style //
///////////

// Style Maps

import Deque from "double-ended-queue";
import { BranchStyle } from "./treeStyle";
import { AnimationHandler } from "./animation";
import {RecordingHandler} from "./record";

const fullRadians = 2 * Math.PI;
const radiansFactor = Math.PI / 180;


/////////////////////
// Tree generation //
/////////////////////

function toRadians(degrees) {
    return degrees * radiansFactor;
}

function drawDot(context, branchStyle, currCoords) {
    let dotRadius = 3;
    context.beginPath();
    context.arc(currCoords.x, currCoords.y, dotRadius, 0, fullRadians);
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
    context.arc(currCoords.x, currCoords.y, circleRadius, 0, fullRadians);
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

function generateTree(context, branchStyle, numLayers, angleOffsetConstant, addedOffset, root) {
    const queue = new Deque([root]);
    const nodes = [];
    let curr, leftOffset, rightOffset, branchLength, newX, newY, newNode, offset;
    while (queue.length !== 0)  {
        curr = queue.shift();
        nodes.push(curr);
        if (curr.layer < numLayers) {
            branchLength = branchStyle.length.getMappedValue(curr.layer);
            leftOffset = curr.angle + angleOffsetConstant;
            rightOffset = curr.angle - angleOffsetConstant;
            for (offset of [leftOffset, rightOffset]) {
                newX = curr.x - branchLength * Math.sin(offset + addedOffset);
                newY = curr.y - branchLength * Math.cos(offset + addedOffset);
                newNode = {x: newX, y: newY, angle: offset, layer: curr.layer + 1, parent: curr};
                queue.push(newNode);
            }
        }
    }
    for (let curr of nodes) {
        drawLine(context, branchStyle, curr);
    }
    for (let curr of nodes) {
        drawSymbol(context, branchStyle, curr);
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
        let inputStartElement = document.getElementById(`${attribute}-start-input`);
        let inputStartValue = branchStyle[attribute].castFunction(inputStartElement.value);
        if ((inputStartElement.hasAttribute('min')) && (inputStartElement.hasAttribute('max'))) {
            if (inputStartValue < inputStartElement.min) {
                branchStyle[attribute].start = inputStartElement.min;
            } else if (inputStartValue > inputStartElement.max) {
                branchStyle[attribute].start = inputStartElement.max;
            } else {
                branchStyle[attribute].start = inputStartValue;
            }
        } else {
            branchStyle[attribute].start = inputStartValue;
        }
        let inputEndElement = document.getElementById(`${attribute}-end-input`);
        let inputEndValue = branchStyle[attribute].castFunction(inputEndElement.value);
        if ((inputEndElement.hasAttribute('min')) && (inputEndElement.hasAttribute('max'))) {
            if (inputEndValue < inputEndElement.min) {
                branchStyle[attribute].end = inputEndElement.min;
            } else if (inputEndValue > inputEndElement.max) {
                branchStyle[attribute].end = inputEndElement.max;
            } else {
                branchStyle[attribute].end = inputEndValue;
            }
        } else {
            branchStyle[attribute].end = inputEndValue;
        }
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

function changeRecordingButton(animationHandler) {
    const recordButton = document.getElementById("record-button");
    const screenshotSymbol = "&#x1F4F8;";
    const recordSymbol = "&#x23FA;";

    if (animationHandler.running) {
        recordButton.innerHTML = recordSymbol;
    } else {
        recordButton.innerHTML = screenshotSymbol;
    }
}

function canvasResizeAndDraw(context, branchStyle, draw) {
    const canvas = document.getElementById("fractal-container");

    const scaleFactor = 0.95;
    const smallerDimension = Math.min(window.innerWidth, window.innerHeight) * scaleFactor;

    canvas.style.width = `${smallerDimension}px`;
    canvas.style.height = `${smallerDimension}px`;
    canvas.style.transformOrigin = '0 0';

    if (draw) {
        generateTreeFromStyleInputs(context, branchStyle);
    }
}


function main() {
    const canvas = document.getElementById("fractal-container");
    const context = canvas.getContext("2d");

    const branchStyle = new BranchStyle("./branchStyleDefaults.json");
    setupStyleModal();
    let animationFramesElement = document.getElementById("animation-frames-input");
    let animationTypeElement = document.getElementById("animation-type-input");
    const animationHandler = new AnimationHandler(animationFramesElement, animationTypeElement);
    document.getElementById("run-stop-animation-button").addEventListener("click", () => animationHandler.playPause());
    document.getElementById("run-stop-animation-button").addEventListener("click", () => changeRecordingButton(animationHandler));

    const recordingHandler = new RecordingHandler(canvas, animationHandler);
    document.getElementById("record-button").addEventListener("click", () => recordingHandler.triggerRecord());

    const inputIds = ["num-layers-input", "angle-input", "num-trees-input"];
    for (let inputId of inputIds) {
        document.getElementById(inputId).addEventListener("input", () => generateTreeFromInputs(context, branchStyle));
    }
    for (let attribute of branchStyle.attributesList) {
        document.getElementById(`${attribute}-start-input`).addEventListener("input", () => generateTreeFromStyleInputs(context, branchStyle));
        document.getElementById(`${attribute}-end-input`).addEventListener("input", () => generateTreeFromStyleInputs(context, branchStyle));
    }

    document.getElementById("reset-default-styles-button").addEventListener("click", () => generateTreeWithDefaultStyle(context, branchStyle));

    window.addEventListener('resize', () => canvasResizeAndDraw(context, branchStyle, true));

    canvasResizeAndDraw(context, branchStyle, false)
    generateTreeWithDefaultStyle(context, branchStyle);
}

main();
