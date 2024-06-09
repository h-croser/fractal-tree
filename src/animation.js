function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class AnimationHandler {
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
        let framesSkipped = 0;
        let currTime, timeDelta, expectedFrameDuration;
        while (true) {
            if (!this._running) {
                break;
            }

            for (let i of range) {
                currTime = new Date().getTime();
                timeDelta = currTime - lastFrame;
                expectedFrameDuration = millisecondsPerFrame * (framesSkipped + 1);
                if (timeDelta < expectedFrameDuration) {
                    await sleep(millisecondsPerFrame - timeDelta);
                } else if (timeDelta > expectedFrameDuration) {
                    framesSkipped += 1;
                    continue;
                }
                if (!this._running) {
                    break;
                }
                changingInputElement.value = i;
                changingInputElement.dispatchEvent(event);
                framesSkipped = 0;
                lastFrame = new Date().getTime();
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
