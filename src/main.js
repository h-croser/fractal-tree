///////////
// Style //
///////////

// Style Maps

import Deque from "double-ended-queue";
import { BranchStyle } from "./treeStyle";
import { AnimationHandler } from "./animation";
import { RecordingHandler } from "./record";

const NUM_WORKERS = 1;
const RADIANS_FACTOR = Math.PI / 180;

function toRadians(degrees) {
    return degrees * RADIANS_FACTOR;
}

function generateTree(context, workers, branchStyle, numLayers, angleOffsetConstant, addedOffset, root) {
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

    pushJobToRenderWorkers(context, workers, branchStyle, nodes, "line");
    pushJobToRenderWorkers(context, workers, branchStyle, nodes, "symbol");
}

function generateTreeFromInputs(context, workers, branchStyle) {
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
        generateTree(context, workers, branchStyle, numLayers, toRadians(degreesOffset), toRadians(addedDegrees), currCoords);
    }
}

function generateTreeFromStyleInputs(context, workers, branchStyle) {
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

    generateTreeFromInputs(context, workers, branchStyle);
}

async function generateTreeDefaultStyle(context, workers, branchStyle, forceOverwrite) {
    await branchStyle.initialiseStyles(forceOverwrite);
    generateTreeFromInputs(context, workers, branchStyle);
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

function setControlRecordButtonStyle(animationHandler, recordingHandler) {
    const playPauseButton = document.getElementById("play-pause-animation-button");
    const recordButton = document.getElementById("record-button");

    if (animationHandler.running) {
        playPauseButton.innerHTML = "pause_circle";
    } else {
        playPauseButton.innerHTML = "play_circle";
    }

    if (recordingHandler.running) {
        recordButton.style.color = "#BB1C1B";
        recordButton.style.backgroundColor = "#FFFFFF";

        recordButton.addEventListener("mouseover", function() {
            recordButton.style.backgroundColor = "#AEAEAE";
        });
        recordButton.addEventListener("mouseout", function() {
            recordButton.style.backgroundColor = "#FFFFFF";
        });
    } else {
        recordButton.style.color = "#FFFFFF";
        recordButton.style.backgroundColor = "#D74A49";

        recordButton.addEventListener("mouseover", function() {
            recordButton.style.backgroundColor = "#BB1C1B";
        });
        recordButton.addEventListener("mouseout", function() {
            recordButton.style.backgroundColor = "#D74A49";
        });
    }
}

function canvasResizeAndDraw(context, workers, branchStyle, draw) {
    const canvas = document.getElementById("fractal-container");

    const scaleFactor = 0.95;
    const smallerDimension = Math.min(window.innerWidth, window.innerHeight) * scaleFactor;

    canvas.style.width = `${smallerDimension}px`;
    canvas.style.height = `${smallerDimension}px`;
    canvas.style.transformOrigin = '0 0';

    if (draw) {
        generateTreeFromStyleInputs(context, workers, branchStyle);
    }
}

function initialiseRenderWorkers(numWorkers) {
    const workers = [];
    for (let i = 0; i < numWorkers; i++) {
        workers.push(new Worker("preRenderWorker.js"));
    }

    return workers;
}

function pushJobToRenderWorkers(context, workers, branchStyle, nodes, renderMode) {
    const numNodes = nodes.length;
    const numWorkers = workers.length;
    const partSize = Math.floor(numNodes / numWorkers);
    const remainder = numNodes % numWorkers;

    let start = 0;
    let end;
    for (let i = 0; i < numWorkers; i++) {
        end = start + partSize + (i < remainder ? 1 : 0);
        workers[i].postMessage({
            context: context,
            branchStyle: branchStyle,
            nodes: nodes.slice(start, end),
            renderMode: renderMode
        });
        start = end;
    }
}


function main() {
    let workers = [];
    if (window.Worker) {
        workers = initialiseRenderWorkers(NUM_WORKERS);
    }

    const canvas = document.getElementById("fractal-container");
    const context = canvas.getContext("2d");

    const branchStyle = new BranchStyle("./branchStyleDefaults.json");
    setupStyleModal();

    let animationFramesElement = document.getElementById("animation-frames-input");
    let animationTypeElement = document.getElementById("animation-type-input");
    const animationHandler = new AnimationHandler(animationFramesElement, animationTypeElement);

    const recordingHandler = new RecordingHandler(canvas);
    const recordButton = document.getElementById("record-button");
    recordButton.addEventListener("click", function() {
        recordingHandler.triggerRecord();
        setControlRecordButtonStyle(animationHandler, recordingHandler);
    });
    const captureButton = document.getElementById("capture-button");
    captureButton.addEventListener("click", function() {
        recordingHandler.screenshot();
    });

    const playPauseButton = document.getElementById("play-pause-animation-button");
    playPauseButton.addEventListener("click", function() {
        animationHandler.playPause();
        setControlRecordButtonStyle(animationHandler, recordingHandler);
    });

    const inputIds = ["num-layers-input", "angle-input", "num-trees-input"];
    for (let inputId of inputIds) {
        document.getElementById(inputId).addEventListener("input", () => generateTreeFromInputs(context, workers, branchStyle));
    }
    for (let attribute of branchStyle.attributesList) {
        document.getElementById(`${attribute}-start-input`).addEventListener("input", () => generateTreeFromStyleInputs(context, workers, branchStyle));
        document.getElementById(`${attribute}-end-input`).addEventListener("input", () => generateTreeFromStyleInputs(context, workers, branchStyle));
    }

    document.getElementById("reset-default-styles-button").addEventListener("click", () => generateTreeDefaultStyle(context, workers, branchStyle, true));

    window.addEventListener('resize', () => canvasResizeAndDraw(context, branchStyle, true));

    canvasResizeAndDraw(context, branchStyle, false)
    generateTreeDefaultStyle(context, workers, branchStyle, false);
}

main();
