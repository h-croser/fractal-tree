class Recording {
    constructor() {
        this._frames = [];
    }

    get currentlyRecording() {
        return this._frames.length > 0;
    }

    clearFrames() {
        this._frames = [];
    }

    get frames() {
        return this._frames;
    }

    set newFrame(frame) {
        this._frames.push(frame);
    }
}


export class RecordingHandler {
    constructor(canvas, animationHandler) {
        this._recording = new Recording();
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

    endRecording() {
        const blob = new Blob(this._recording.frames, { type: 'video/mp4' });

        const dataURL = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = dataURL;
        link.download = 'fractal-tree.mp4';

        link.click();
    }

    _captureFrame() {
        this._canvas.toBlob(this._recording.newFrame);
    }

    startRecording() {
        this._recording.clearFrames();
        this._animationHandler.recordFunction = this._captureFrame;
    }

    triggerRecord() {
        if (this._animationHandler.running) {
            if (this._recording.currentlyRecording) {
                this.endRecording();
            } else {
                this.startRecording();
            }
        } else {
            this.screenshot();
        }
    }
}