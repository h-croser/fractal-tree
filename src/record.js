export class RecordingHandler {
    constructor(canvas) {
        this._canvas = canvas;
        this.container = null;
        const canvasStream = canvas.captureStream(30);
        const containers = ['mp4', 'webm'];
        const codecs = ['h265', 'h264', 'vp9', 'vp8'];
        let options = {
            audioBitsPerSecond: 0,
            videoBitsPerSecond: 400*1000*1000,
            mimeType: containers.at(0)
        };
        let containerCodec;
        let selectedCodec = null;
        this._recorder = null;
        for (let container of containers) {
            if (this._recorder !== null) {
                break;
            }
            this.container = container;
            for (let codec of codecs) {
                containerCodec = `video/${container};codecs=${codec}`;
                if (MediaRecorder.isTypeSupported(containerCodec)) {
                    selectedCodec = codec;
                    options.mimeType = containerCodec;
                    this._recorder = new MediaRecorder(canvasStream, options);
                    break;
                }
            }
        }
        if (this._recorder === null) {
            console.warn("No predefined container/codec combination unsupported in this environment: using environment default");
            this._recorder = new MediaRecorder(canvasStream, {
                audioBitsPerSecond: 0,
                videoBitsPerSecond: 400*1000*1000
            });
            this.container = "";
        }

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
        link.download = `fractal-tree.${this.container}`;
        link.click();

        URL.revokeObjectURL(dataURL);
    }

    triggerRecord() {
        if (this._recorder.state === "recording") {
            this.endRecording();
        } else {
            this.startRecording();
        }
    }
}