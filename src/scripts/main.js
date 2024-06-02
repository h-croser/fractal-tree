const STROKE_WIDTH = 1;
const BRANCH_COLOR = "#AD343E";
const APP_BACKGROUND_COLOR = "#000000";

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function generateTree(graphics, branchLength, angleOffsetConstant, currLayer, angleOffset, addedOffset, nodeX, nodeY) {
    if (currLayer === 0) {
        return;
    }
    let newLayer = currLayer - 1;

    let leftOffset = angleOffset + angleOffsetConstant;
    let rightOffset = angleOffset - angleOffsetConstant;
    for (let offset of [leftOffset, rightOffset]) {
        let newX = nodeX + branchLength * Math.sin(offset + addedOffset);
        let newY = nodeY + branchLength * Math.cos(offset + addedOffset);
        graphics.moveTo(nodeX, nodeY);
        graphics.lineTo(newX, newY);
        graphics.stroke({ width: STROKE_WIDTH, color: BRANCH_COLOR });

        generateTree(graphics, branchLength, angleOffsetConstant, newLayer, offset, addedOffset, newX, newY);
    }
}

function generateTreeFromInputs(fractalStage, midpoint) {
    fractalStage.clear();
    let branchLength = parseInt(document.getElementById("branch-length-input").value);
    let numLayers = parseInt(document.getElementById("num-layers-input").value);
    let degreesOffset = parseInt(document.getElementById("angle-input").value);
    let numRoots = parseInt(document.getElementById("num-trees-input").value);

    branchLength = -branchLength;
    let addedDegrees = 0;
    for (let root = 1; root <= numRoots; root++) {
        addedDegrees = (360 / numRoots) * root;
        generateTree(fractalStage, branchLength, toRadians(degreesOffset), numLayers, 0, toRadians(addedDegrees), midpoint[0], midpoint[1]);
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