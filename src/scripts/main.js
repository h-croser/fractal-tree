///////////
// Style //
///////////

// Style Maps

function buildLinearScaledMap(attributeMap, startValue, endValue, numLayers) {
    const valueDiff = endValue - startValue;
    attributeMap.set(0, startValue);
    for (let currLayer = 1; currLayer <= numLayers; currLayer++) {
        let value = (valueDiff * ((currLayer - 1) / (numLayers - 1))) + startValue;
        attributeMap.set(currLayer, value);
    }
}

function buildNodeSymbolMap(symbolMap, startSymbol, endSymbol, numLayers) {
    for (let currLayer = 0; currLayer < numLayers; currLayer++) {
        symbolMap.set(currLayer, startSymbol);
    }
    symbolMap.set(numLayers, endSymbol);
}

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
    let ratio = 0.5;

    colorMap.set(numLayers, endColor);
    for (let currLayer = numLayers - 1; currLayer > 1; currLayer--) {
        const interpolatedColorRGB = [];
        for (let i = 0; i < startRGB.length; i++) {
            let interpolatedInt = Math.round(((endRGB[i] - startRGB[i]) * ratio) + startRGB[i]);
            interpolatedColorRGB.push(interpolatedInt);
        }
        colorMap.set(currLayer, RGBtoHex(interpolatedColorRGB));

        ratio *= 0.5;
    }
    colorMap.set(1, startColor);
    colorMap.set(0, startColor);
}


class ScalableBranchStyleAttribute {
    constructor(name, mapBuildFunction, castFunction) {
        this._name = name;
        this._mapBuildFunction = mapBuildFunction;
        this._castFunction = castFunction ? castFunction : x => x;
        this.layerMap = new Map();
    }

    buildMap(numLayers) {
        this._mapBuildFunction(this.layerMap, this.start, this.end, numLayers);
    }

    getMappedValue(layer) {
        return this.layerMap.get(layer);
    }

    get start() {
        return this._castFunction(localStorage.getItem(`${this._name}Start`));
    }

    set start(value) {
        localStorage.setItem(`${this._name}Start`, value);
    }

    set startIfNoCache(value) {
        let cached = this.start;
        if ((cached === null) || (isNaN(cached))) {
            this.start = value;
        }
    }

    get end() {
        return this._castFunction(localStorage.getItem(`${this._name}End`));
    }

    set end(value) {
        localStorage.setItem(`${this._name}End`, value);
    }

    set endIfNoCache(value) {
        let cached = this.end;
        if ((cached === null) || (isNaN(cached))) {
            this.end = value;
        }
    }
}

class BranchStyle {
    constructor(defaultsFilename) {
        this.defaultsFilename = defaultsFilename;

        this.color = new ScalableBranchStyleAttribute("branchColor", buildColorMap, null);
        this.width = new ScalableBranchStyleAttribute("branchWidth", buildLinearScaledMap, parseFloat);
        this.length = new ScalableBranchStyleAttribute("branchLength", buildLinearScaledMap, parseInt);
        this.opacity = new ScalableBranchStyleAttribute("branchOpacity", buildLinearScaledMap, parseFloat);
        this.symbol = new ScalableBranchStyleAttribute("symbol", buildNodeSymbolMap, null);
        this.attributesList = ["color", "width", "length", "opacity", "symbol"];

        this.initialiseStyles(false);
    }

    set numLayers(value) {
        for (let attribute of this.attributesList) {
            this[attribute].buildMap(value);
        }
    }

    async initialiseStyles(forceOverwrite) {
        await this.initialiseDefaults(forceOverwrite);
        await this.setInputValues();
    }

    async setInputValues() {
        for (let attribute of this.attributesList) {
            document.getElementById(`${attribute}-start-input`).value = this[attribute].start;
            document.getElementById(`${attribute}-end-input`).value = this[attribute].end;
        }
    }

    async initialiseDefaults(forceOverwrite) {
        let fetchedData = await fetch(this.defaultsFilename)
            .then(response => response.json())
            .catch(error => {
                console.error("Could not load default tree styles", error);
            });
        for (let attribute of this.attributesList) {
            if (forceOverwrite) {
                this[attribute].start = fetchedData[attribute].start;
                this[attribute].end = fetchedData[attribute].end;
            } else {
                this[attribute].startIfNoCache = fetchedData[attribute].start;
                this[attribute].endIfNoCache = fetchedData[attribute].end;
            }
        }
    }
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
    const queue = [root];
    let curr;
    let leftOffset;
    let rightOffset;
    let branchLength;
    while (queue.length !== 0)  {
        curr = queue.shift();
        drawLine(context, branchStyle, curr);
        if (curr.layer >= numLayers) {
            continue;
        }
        branchLength = branchStyle.length.getMappedValue(curr.layer);
        leftOffset = curr.angle + angleOffsetConstant;
        rightOffset = curr.angle - angleOffsetConstant;
        for (let offset of [leftOffset, rightOffset]) {
            let newX = curr.x - branchLength * Math.sin(offset + addedOffset);
            let newY = curr.y - branchLength * Math.cos(offset + addedOffset);
            let newNode = {x: newX, y: newY, angle: offset, layer: curr.layer + 1, parent: curr};
            queue.push(newNode);
        }
    }
}

function generateTreeFromInputs(context, branchStyle, midpoint) {
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
