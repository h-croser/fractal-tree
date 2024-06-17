export class RecordingHandler {
    constructor(canvas, animationHandler) {
        this._canvas = canvas;
        this._recorder = new MediaRecorder(canvas.captureStream(), { mimeType: "video/webm;codecs=vp8" });
        this._animationHandler = animationHandler;

        this._recorder.ondataavailable = (e) => {
            this.downloadRecording(e.data);
        };
    }

    get running() {
        return this._recorder.state === "recording";
    }

    screenshot() {
        const dataURL = this._canvas.toDataURL('image/png');

        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'fractal-tree.png';

        link.click();
    }

    endRecording() {
        this._recorder.stop();
    }

    startRecording() {
        this._recorder.start();
    }

    downloadRecording = (data) => {
        const dataURL = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = dataURL;
        link.download = 'fractal-tree.webm';

        link.click();
    }

    triggerRecord() {
        if (this._recorder.state === "recording") {
            this.endRecording();
        } else {
            this.startRecording();
        }
    }
}