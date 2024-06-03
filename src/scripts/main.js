const BRANCH_COLOR_START = "#AD343E";
const BRANCH_COLOR_END = "#42D9C8";
const BRANCH_WIDTH_START = 0.5;
const BRANCH_WIDTH_END = 1.0;
const APP_BACKGROUND_COLOR = "#121016";

function buildWidthMap(startWidth, endWidth, numLayers) {
    const widthDiff = endWidth - startWidth;

    const widthMap = new Map();
    for (let currLayer = 0; currLayer < numLayers; currLayer++) {
        let width = (widthDiff * (currLayer / numLayers)) + startWidth;
        widthMap.set(currLayer, width);
    }

    return widthMap;
}

function buildColorMap(startColor, endColor, numLayers) {
    const startRGB = hexToRGB(startColor);
    const endRGB = hexToRGB(endColor);
    let ratio = 1.0;

    const colorMap = new Map();
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

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function generateTree(fractalStage, colorMap, widthMap, branchLength, angleOffsetConstant, currLayer, angleOffset, addedOffset, nodeX, nodeY) {
    if (currLayer === 0) {
        return;
    }
    let newLayer = currLayer - 1;
    // console.log(`Start: ${BRANCH_START_COLOR}, end: ${BRANCH_END_COLOR}, currLayer: ${currLayer}, totalLayers: ${totalLayers}`);

    let leftOffset = angleOffset + angleOffsetConstant;
    let rightOffset = angleOffset - angleOffsetConstant;
    for (let offset of [leftOffset, rightOffset]) {
        let newX = nodeX + branchLength * Math.sin(offset + addedOffset);
        let newY = nodeY + branchLength * Math.cos(offset + addedOffset);
        fractalStage.moveTo(nodeX, nodeY);
        fractalStage.lineTo(newX, newY);
        fractalStage.stroke({ width: widthMap.get(newLayer), color: colorMap.get(newLayer) });

        generateTree(fractalStage, colorMap, widthMap, branchLength, angleOffsetConstant, newLayer, offset, addedOffset, newX, newY);
    }
}

function generateTreeFromInputs(fractalStage, midpoint) {
    fractalStage.clear();
    let branchLength = parseInt(document.getElementById("branch-length-input").value);
    let numLayers = parseInt(document.getElementById("num-layers-input").value);
    let degreesOffset = parseInt(document.getElementById("angle-input").value);
    let numRoots = parseInt(document.getElementById("num-trees-input").value);

    let colorMap = buildColorMap(BRANCH_COLOR_START, BRANCH_COLOR_END, numLayers);
    let widthMap = buildWidthMap(BRANCH_WIDTH_START, BRANCH_WIDTH_END, numLayers);

    branchLength = -branchLength;
    let addedDegrees = 0;
    for (let root = 1; root <= numRoots; root++) {
        addedDegrees = (360 / numRoots) * root;
        generateTree(fractalStage, colorMap, widthMap, branchLength, toRadians(degreesOffset), numLayers, 0, toRadians(addedDegrees), midpoint[0], midpoint[1]);
    }
}

function main() {
    (async () =>
    {
        const app = new PIXI.Application();
        await app.init({ width: 1000, height: 1000, antialias: true });
        document.getElementById("fractal-container").appendChild(app.canvas);

        const midpoint = [500, 500];

        const backgroundRectangle = new PIXI.Graphics()
            .rect(0, 0, 1000, 1000)
            .fill(APP_BACKGROUND_COLOR);

        app.stage.addChild(backgroundRectangle);
        const fractalStage = new PIXI.Graphics();
        app.stage.addChild(fractalStage);

        const inputIds = ["branch-length-input", "num-layers-input", "angle-input", "num-trees-input"];
        for (let inputId of inputIds) {
            document.getElementById(inputId).addEventListener("input", () => generateTreeFromInputs(fractalStage, midpoint), false);
        }

        generateTreeFromInputs(fractalStage, midpoint);
    })();
}

main();