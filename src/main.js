///////////
// Style //
///////////

// Style Maps

import Deque from "double-ended-queue";
import { BranchStyle } from "./treeStyle";

const fullRadians = 2 * Math.PI;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


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
        if ((inputStartElement.hasAttribute('min')) && (inputStartElement.value > inputStartElement.min)) {
            branchStyle[attribute].start = inputStartElement.min;
        } else {
            branchStyle[attribute].start = inputStartElement.value;
        }
        let inputEndElement = document.getElementById(`${attribute}-end-input`);
        if ((inputEndElement.hasAttribute('max')) && (inputEndElement.value > inputEndElement.max)) {
            branchStyle[attribute].end = inputEndElement.max;
        } else {
            branchStyle[attribute].end = inputEndElement.value;
        }
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

class AnimationHandler {
    constructor(framesInputId, typeInputId) {
        this.framesInputElement = document.getElementById(framesInputId);
        this.typeInputElement = document.getElementById(typeInputId);
        this._running = false;
    }

    _create_range_array(min, max) {
        const range = [];
        for (let i = min; i < max; i++) {
            range.push(i);
        }
        for (let i = max; i > min; i--) {
            range.push(i);
        }

        return range;
    }

    generateTreeAnimation = async () => {
        if (this._running) {
            return;
        }
        this._running = true;
        const framesPerSecond = Math.max(parseFloat(this.framesInputElement.value), 1);
        const millisecondsPerFrame = 1000 / framesPerSecond;

        const changingInputId = this.typeInputElement.value;
        const changingInputElement = document.getElementById(changingInputId);

        const min = parseInt(changingInputElement.min);
        const max = parseInt(changingInputElement.max);
        const range = this._create_range_array(min, max);
        const event = new Event("input");

        let lastFrame = new Date().getTime();
        let currTime;
        let timeDelta;
        let framesSkipped = 0;
        while (true) {
            if (!this._running) {
                break;
            }

            for (let i of range) {
                currTime = new Date().getTime();
                timeDelta = currTime - lastFrame;
                if (timeDelta < (millisecondsPerFrame * framesSkipped)) {
                    await sleep(millisecondsPerFrame - timeDelta);
                } else if (timeDelta > (millisecondsPerFrame * framesSkipped)) {
                    framesSkipped += 1;
                    continue;
                }
                lastFrame = currTime;
                framesSkipped = 0;

                if (!this._running) {
                    break;
                }
                changingInputElement.value = i;
                changingInputElement.dispatchEvent(event);
            }
        }
    }

    start = async () => {
        await this.generateTreeAnimation();
    }

    stop = async () => {
        this._running = false;
    }
}

function canvasResizeAndDraw(context, branchStyle) {
    const treeControlsY = document.getElementById("tree-controls").getBoundingClientRect().top;
    const canvas = document.getElementById("fractal-container");


    const scaleX = (window.innerWidth / canvas.width) * 0.95;
    const scaleY = (treeControlsY / canvas.height) * 0.95;

    canvas.width *= scaleX;
    canvas.height *= scaleY;
    generateTreeFromStyleInputs(context, branchStyle);
}


function main() {
    const canvas = document.getElementById("fractal-container");
    const context = canvas.getContext("2d");

    const branchStyle = new BranchStyle("./branchStyleDefaults.json");
    setupStyleModal();
    const animationHandler = new AnimationHandler("animation-frames-input", "animation-type-input");

    const inputIds = ["num-layers-input", "angle-input", "num-trees-input"];
    for (let inputId of inputIds) {
        document.getElementById(inputId).addEventListener("input", () => generateTreeFromInputs(context, branchStyle));
    }
    document.getElementById("apply-style-button").addEventListener("click", () => generateTreeFromStyleInputs(context, branchStyle));
    document.getElementById("reset-default-styles-button").addEventListener("click", () => generateTreeWithDefaultStyle(context, branchStyle));
    document.getElementById("run-animation-button").addEventListener("click", animationHandler.start);
    document.getElementById("stop-animation-button").addEventListener("click", animationHandler.stop);

    window.addEventListener('resize', () => canvasResizeAndDraw(context, branchStyle));

    generateTreeWithDefaultStyle(context, branchStyle);
}

main();
