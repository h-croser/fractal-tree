///////////
// Style //
///////////


const BRANCH_COLOR_START = "#42D9C8";
const BRANCH_COLOR_END = "#AD343E";
const BRANCH_WIDTH_START = 0.2;
const BRANCH_WIDTH_END = 0.7;

// Width Map

function buildWidthMap(widthMap, startWidth, endWidth, numLayers) {
    const widthDiff = endWidth - startWidth;
    for (let currLayer = 0; currLayer < numLayers; currLayer++) {
        let width = (widthDiff * (currLayer / numLayers)) + startWidth;
        widthMap.set(currLayer, width);
    }

    return widthMap;
}

// Length Map

function buildLengthMap(lengthMap, startLength, endLength, numLayers) {
    const lengthDiff = endLength - startLength;
    for (let currLayer = 0; currLayer < numLayers; currLayer++) {
        let width = (lengthDiff * (currLayer / numLayers)) + startLength;
        lengthMap.set(currLayer, width);
    }

    return lengthMap;
}

// Color Map

function hexToRGB(colorHex) {
    const rgbColor = [];
    for (let i = 1; i < 7; i += 2) {
        rgbColor.push(parseInt(colorHex.substring(i, i+2), 16));
    }

    return rgbColor;
}

function RGBtoHex(colorRGB) {
    let colorHex = "#";
    for (let component of colorRGB) {
        colorHex += Number(component).toString(16).padStart(2, '0');
    }
    return colorHex;
}

function buildColorMap(colorMap, startColor, endColor, numLayers) {
    const startRGB = hexToRGB(startColor);
    const endRGB = hexToRGB(endColor);
    let ratio = 1.0;
    for (let currLayer = 0; currLayer < numLayers; currLayer++) {
        const interpolatedColorRGB = [];
        for (let i = 0; i < startRGB.length; i++) {
            let interpolatedInt = Math.round(((endRGB[i] - startRGB[i]) * ratio) + startRGB[i]);
            interpolatedColorRGB.push(interpolatedInt);
        }
        colorMap.set(currLayer, RGBtoHex(interpolatedColorRGB));

        ratio *= 0.5;
    }

    return colorMap;
}


class BranchStyleAttribute {
    constructor(name) {
        this._name = name;
        this.layerMap = new Map();
    }

    getMappedValue(layer) {
        return this.layerMap.get(layer);
    }

    get start() {
        return localStorage.getItem(`${this._name}Start`);
    }

    set start(value) {
        localStorage.setItem(`${this._name}Start`, value);
    }

    set startDefault(value) {
        if (this.start === null) {
            this.start = value;
        }
    }

    get end() {
        return localStorage.getItem(`${this._name}End`);
    }

    set end(value) {
        localStorage.setItem(`${this._name}End`, value);
    }

    set endDefault(value) {
        if (this.end === null) {
            this.end = value;
        }
    }
}

class BranchStyle {
    constructor(defaultsFilename) {
        this.color = new BranchStyleAttribute("branchColor");
        this.width = new BranchStyleAttribute("branchWidth");
        this.length = new BranchStyleAttribute("branchLength");

        this.initialiseStyles(defaultsFilename);
    }

    set numLayers(value) {
        buildColorMap(this.color.layerMap, this.color.start, this.color.end, value);
        buildWidthMap(this.width.layerMap, this.width.start, this.width.end, value);
        buildLengthMap(this.length.layerMap, this.length.start, this.length.end, value);
    }

    async initialiseStyles(defaultsFilename) {
        this.initialiseDefaults(defaultsFilename);

    }

    async initialiseDefaults(defaultsFilename) {
        let fetchedData = await this.fetchDefaultStyles(defaultsFilename);
        this.color.startDefault = fetchedData.color.start;
        this.color.endDefault = fetchedData.color.end;
        this.width.startDefault = fetchedData.width.start;
        this.width.endDefault = fetchedData.width.end;
        this.length.startDefault = fetchedData.length.start;
        this.length.endDefault = fetchedData.length.end;
    }

    async fetchDefaultStyles(defaultsFilename) {
        return fetch(defaultsFilename)
            .then(response => response.json())
            .catch(error => {
                console.error("Could not load default tree styles", error);
            });
    }
}

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
    context.strokeStyle = branchStyle.color.getMappedValue(currCoords.layer);
    context.lineWidth = branchStyle.width.getMappedValue(currCoords.layer);
    context.closePath();
    context.stroke();
}

function generateTree(context, branchStyle, angleOffsetConstant, addedOffset, root) {
    const queue = [root];
    let curr;
    let leftOffset;
    let rightOffset;
    let branchLength;
    while (queue.length !== 0)  {
        curr = queue.shift();
        drawLine(context, branchStyle, curr);
        if (curr.layer <= 0) {
            continue;
        }
        branchLength = branchStyle.length.getMappedValue(curr.layer);
        leftOffset = curr.angle + angleOffsetConstant;
        rightOffset = curr.angle - angleOffsetConstant;
        for (let offset of [leftOffset, rightOffset]) {
            let newX = curr.x - branchLength * Math.sin(offset + addedOffset);
            let newY = curr.y - branchLength * Math.cos(offset + addedOffset);
            let newNode = {x: newX, y: newY, angle: offset, layer: curr.layer-1, parent: curr};
            queue.push(newNode);
        }
    }
}

function generateTreeFromInputs(context, branchStyle, midpoint) {
    context.reset();
    let branchLength = parseInt(document.getElementById("branch-length-input").value);
    let numLayers = parseInt(document.getElementById("num-layers-input").value);
    let degreesOffset = parseInt(document.getElementById("angle-input").value);
    let numRoots = parseInt(document.getElementById("num-trees-input").value);

    let currCoords = {x: midpoint[0], y: midpoint[1], angle: 0, layer: numLayers, parent: {x: midpoint[0], y: midpoint[1], angle: 0, layer: numLayers}};

    branchStyle.numLayers = numLayers;

    let addedDegrees = 0;
    for (let root = 1; root <= numRoots; root++) {
        addedDegrees = (360 / numRoots) * root;
        generateTree(context, branchStyle, toRadians(degreesOffset), toRadians(addedDegrees), currCoords);
    }
}


function main() {
    const midpoint = [500, 500];

    const canvas = document.getElementById("fractal-container");
    const context = canvas.getContext("2d");
    const branchStyle = new BranchStyle("./branchStyleDefaults.json");

    const inputIds = ["branch-length-input", "num-layers-input", "angle-input", "num-trees-input"];
    for (let inputId of inputIds) {
        document.getElementById(inputId).addEventListener("input", () => generateTreeFromInputs(context, branchStyle, midpoint), false);
    }

    generateTreeFromInputs(context, branchStyle, midpoint);
}

main();
