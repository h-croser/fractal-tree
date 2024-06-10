function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class AnimationHandler {
    constructor(framesInputElement, typeInputElement) {
        this._running = false;
        this._millisecondsPerFrame = 0;
        this._reversing = false;
        this._changingInputElement = null;

        this._framesInputElement = framesInputElement;
        this._typeInputElement = typeInputElement;
        this._framesInputElement.addEventListener("input", this.setMillisecondsPerFrame);
        this._typeInputElement.addEventListener("input", this.setChangingInputElement);
        this.setMillisecondsPerFrame();
        this.setChangingInputElement();
    }

    setMillisecondsPerFrame = async () => {
        let framesInput = parseFloat(this._framesInputElement.value);
        let framesNullChecked = framesInput ? framesInput : 1;
        const framesPerSecond = Math.max(framesNullChecked, 1);
        this._framesInputElement.value = framesPerSecond;

        this._millisecondsPerFrame = 1000 / framesPerSecond;
    }

    setChangingInputElement = async () => {
        this._changingInputElement = document.getElementById(this._typeInputElement.value);
    }

    generateTreeAnimation = async () => {
        const event = new Event("input");

        let lastFrame = new Date().getTime();
        let framesTraversed = 1;
        let currTime, timeDelta, expectedFrameDuration;
        let min, max, diff, value;
        while (this._running) {
            currTime = new Date().getTime();
            timeDelta = currTime - lastFrame;
            expectedFrameDuration = this._millisecondsPerFrame * framesTraversed;
            if (timeDelta < expectedFrameDuration) {
                await sleep(expectedFrameDuration - timeDelta);
            } else if (timeDelta > expectedFrameDuration) {
                framesTraversed += 1;
                continue;
            }
            if (!this._running) {
                break;
            }

            min = parseInt(this._changingInputElement.min);
            max = parseInt(this._changingInputElement.max);
            if (this._reversing) {
                value = parseInt(this._changingInputElement.value) - framesTraversed;
                if (value <= min) {
                    diff = Math.abs(min - value);
                    value = min + diff;
                    this._reversing = false;
                }
            } else {
                value = parseInt(this._changingInputElement.value) + framesTraversed;
                if (value >= max) {
                    diff = Math.abs(max - value);
                    value = max - diff;
                    this._reversing = true;
                }
            }
            this._changingInputElement.value = value;
            this._changingInputElement.dispatchEvent(event);
            lastFrame = new Date().getTime();

            framesTraversed = 1;
        }
    }

    playPause = async () => {
        this._running = !this._running;
        if (this._running) {
            await this.generateTreeAnimation();
        }
    }
}
