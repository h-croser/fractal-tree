export class RecordingHandler {
    constructor(canvas, animationHandler) {
        this._canvas = canvas;
        this._animationHandler = animationHandler;
    }

    screenshot() {
        const dataURL = this._canvas.toDataURL('image/png');

        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'fractal-tree.png';

        link.click();
    }

    record() {
    }

    triggerRecord() {
        this.screenshot();
        // if (this._animationHandler.running) {
        //     this.record();
        // } else {
        //     this.screenshot();
        // }
    }
}