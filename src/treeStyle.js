function buildLinearScaledMap(attributeMap, startValue, endValue, numLayers) {
    const valueDiff = endValue - startValue;
    attributeMap.set(0, startValue);
    for (let currLayer = 1; currLayer <= numLayers; currLayer++) {
        let value = (valueDiff * ((currLayer - 1) / (numLayers - 1))) + startValue;
        attributeMap.set(currLayer, value);
    }
}

function buildNodeMap(symbolMap, startSymbol, endSymbol, numLayers) {
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

export class BranchStyle {
    constructor(defaultsFilename) {
        this.defaultsFilename = defaultsFilename;

        this.color = new ScalableBranchStyleAttribute("branchColor", buildColorMap, null);
        this.width = new ScalableBranchStyleAttribute("branchWidth", buildLinearScaledMap, parseFloat);
        this.length = new ScalableBranchStyleAttribute("branchLength", buildLinearScaledMap, parseInt);
        this.opacity = new ScalableBranchStyleAttribute("branchOpacity", buildLinearScaledMap, parseFloat);
        this.symbol = new ScalableBranchStyleAttribute("symbol", buildNodeMap, null);
        this.symbolColor = new ScalableBranchStyleAttribute("symbolColor", buildNodeMap, null);
        this.attributesList = ["color", "width", "length", "opacity", "symbol", "symbolColor"];

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
