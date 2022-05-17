class CitaviPickerPdfEvents {
    //chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai/pdf.js
    //https://bugs.chromium.org/p/chromium/issues/detail?id=777814

    constructor() {
        this.plugin = document.body.firstElementChild;
        document.addEventListener('keydown', this.handleEvent_);

        //21.03.2018: funktioniert in Chrome 66 (Beta) nicht mehr.
        //Auch mit pointer-events versuchen.
        //Adhoc setInterval verwenden.
        //document.addEventListener('mouseup', this.handleEvent_);
        //document.addEventListener('mousemove', this.handleEvent_);
        //document.addEventListener('mouseout', this.handleEvent_);

        window.setInterval(() => {
            this.plugin.postMessage({ type: 'getSelectedText' }, window.origin);
        }, 500);

        this.handleEvent_();
    }

    handleEvent_() {
        window.clearTimeout(this.timer);
        this.timer = window.setTimeout(() => {
            try {
                window.postMessage({ type: 'getSelectedText' }, window.origin);
            }
            catch (e) {
                telemetry.error(e);
            }
        }, 100);
    }
}
let citaviPickerPdfEvents = new CitaviPickerPdfEvents();
