class PanelHelper {

    constructor() {
        this.origin_fix = "";
        this.visibleWidth = "350px";
        this.hiddenWidth = "-350px";
        this.slideInOutValue = 10;
        this.pdfViewer = new PDFViewerHelper();
    }

    get isCreated() {
        return document.getElementById("citavipickerpanel") != null;
    }

    get isVisible() {
        var panel = document.getElementById("citavipickerpanel");
        if (panel == null) {
            return false;
        }
        if (panel.style.right != this.hiddenWidth) {
            return true;
        }
        return false;
    }

    show(callback) {
        var panel = document.getElementById("citavipickerpanel");
        if (panel == null) {
            this.toggle(callback);
            return;
        }
        if (panel.style.right != this.hiddenWidth) {
            if (callback) callback();
            return;
        }

        this.toggle(callback);
    }

    toggle(callback) {
        var panel = document.getElementById("citavipickerpanel");
        if (panel != null) {
            
            if (panel.style.right == this.hiddenWidth) {
                this.slideIn(panel, callback);
            }
            else {
                this.slideOut(panel, callback);
            }
        }
        else {
            panel = document.createElement('iframe');
            panel.id = "citavipickerpanel";
            panel.style.background = "#FAFAFA";
            panel.style.width = this.visibleWidth;
            panel.style.position = "fixed";
            panel.style.top = "0px";
            panel.style.right = this.hiddenWidth;
            panel.style.height = "100%";
            panel.style.zIndex = "9000000000000000000";
            panel.style.border = "none";
            panel.style.margin = "0px";
            panel.style.display = "block";
            panel.style.minWidth = "0!important";
            panel.frameBorder = "none";
            if (callback) {
                panel.onload = callback;
            }
            var _origin = location.origin;
            if (!isNullOrEmpty(this.origin_fix)) {
                _origin = this.origin_fix;
            }
            panel.src = chrome.runtime.getURL("iframe/iframe.html") + "#" + _origin;

            document.body.appendChild(panel);
        }
    }

    slideIn(elem, finised) {
        this.slide(-350, (c) => c += this.slideInOutValue, (c) => elem.style.right = c + "px", () => elem.style.right == "0px", finised);
    }
    slideOut(elem, finised) {
        this.slide(0, (c) => c -= this.slideInOutValue, (c) => elem.style.right = c + "px", () => elem.style.right == this.hiddenWidth, finised);
    }
    slide(counter, counterFunc, work, until, finised) {
        var time = window.setInterval(function () {
            work(counter);
            if (until()) {
                window.clearInterval(time);
                if (finised != undefined) finised();
            }
            counter = counterFunc(counter);
        }, 1);
    }
    getDocInfos() {
        var docInfo = {};

        if (window.activehunter) {
            docInfo.hunter = window.activehunter;

            if (window.activehunter.references) {
                docInfo.references = window.activehunter.references;
            }
        }

        docInfo.annotations = annotationMarker.annotations;
        docInfo.textSelection = this.getTextSelection();

        return docInfo;
    }

    getTextSelection() {
        try {
            if (this.pdfViewer.isActive) {
                return this.pdfViewer.getTextSelection();
            }
            var selection = window.getSelection().toString();
            if (selection.trim() == "") return null;
            return selection.trim();
        }
        catch (e) {
            return null;
        }
    }

    get environment() {
        if (this.env == null) return false;

        this.env.isPdf = window.isPdf;
        return this.env;
    }
    set environment(env) {
        this.env = env;
    }

    postMessage(action, obj, origin) {
        var element = document.getElementById("citavipickerpanel");
        if (element == null) return;
        var panel = element.contentWindow;
        panel.postMessage({ action: action, obj: obj, environment: this.environment }, origin);
    }

}

class PDFViewerHelper {

    constructor() {
        if (this.isActive) {
            window.addEventListener("message", this._onMessage, false);
            this._textSelectionCallback = null;
        }
        this.injectPdfEventListener = true;
    }

    get isActive() {
        if (runtimeInfo.isFirefox) {
            if (document.getElementsByTagName("base").length > 0) {
                return document.getElementsByTagName("base")[0].href == "resource://pdf.js/web/";
            }
        }
        else {
            var embed = document.body.firstElementChild;
            if (embed == null) return false;
            if (embed.nodeName !== "EMBED") return false;
            return embed.getAttribute("type") === "application/pdf";
        }
        return false;
    }

    getTextSelection(callback) {
        if (runtimeInfo.isFirefox) {
            var selection = window.getSelection().toString();
            if (selection == "") selection = null;

            if (callback == null) return selection;
            callback(selection);
        }
        else if(runtimeInfo.isChrome) {
            this._textSelectionCallback = callback;

            if (!this.injectPdfEventListener) {
                return;
            }
            this.injectPdfEventListener = false;

            let script = document.createElement('script');
            script.src = chrome.runtime.getURL("iframe/pdfEvents.js");
            document.documentElement.appendChild(script);
        }
    }

    _onMessage(event) {
        if (event.origin == runtimeInfo.chromePDFPluginId) {
            if (event.data.type == "getSelectedTextReply") {
                var selectedText = event.data.selectedText;
                if (selectedText != null && selectedText.trim() == "") selectedText = null;

                if (this._textSelectionCallback != null) {
                    this._textSelectionCallback(selectedText);
                }
                else {
                    var panel = document.getElementById("citavipickerpanel").contentWindow;
                    panel.postMessage({ action: MessageKeys.onTextSelectionChanged, obj: selectedText }, runtimeInfo.origin);
                }
            }
        }
    }
}

//Chrome Messages
chrome.runtime.onMessage.addListener(function (msg, sender) {

    if (msg.action == MessageKeys.downloadPdf) {
        return false;
    }
    if (msg.environment) {
        citaviPickerPanelHelper.environment = msg.environment;
    }

    if (!citaviPickerPanelHelper.isCreated) {
        window.isPdf = citaviPickerPanelHelper.pdfViewer.isActive;
        if ((window.isPdf && runtimeInfo.isFirefox) || !window.isPdf) {

            document.addEventListener("selectionchange", function () {
                try {
                    if (document.getElementById("citavipickerpanel") !== null) {
                        var panel = document.getElementById("citavipickerpanel").contentWindow;
                        panel.postMessage({ action: MessageKeys.onTextSelectionChanged, obj: citaviPickerPanelHelper.getTextSelection() }, runtimeInfo.origin);
                    }
                }
                catch (e) {
                    console.error(e);
                }
            });

        }
        else if (window.isPdf && runtimeInfo.isChrome) {
            citaviPickerPanelHelper.getTextSelection();
        }
    }

    try {
        switch (msg.action) {
            
            case MessageKeys.closePanel:
                {
                    if (!citaviPickerPanelHelper.isCreated) return;
                    if (!citaviPickerPanelHelper.isVisible) return;
                    citaviPickerPanelHelper.toggle();
                }
                break;

            case MessageKeys.isbnImport:
                {
                    window.activehunter = null;
                    citaviPickerPanelHelper.show(() => citaviPickerPanelHelper.postMessage(MessageKeys.isbnImport, msg.references, runtimeInfo.origin));
                }
                break;

            case MessageKeys.hunterImport:
                {
                    var bag = {
                        hunter: window.activehunter,
                        info: msg.info,
                        references: msg.references,
                    };

                    window.activehunter.references = msg.references;
                    citaviPickerPanelHelper.postMessage(MessageKeys.hunterImport, bag, runtimeInfo.origin);
                }
                break;

            case MessageKeys.showSettingsTab:
                {
                    citaviPickerPanelHelper.show(() => citaviPickerPanelHelper.postMessage(msg.action, msg, runtimeInfo.origin));
                }
                break;

            case MessageKeys.togglePanel:
                {
                    var func = null;
                    citaviPickerPanelHelper.origin_fix = msg.origin_fix;

                    if (!citaviPickerPanelHelper.isVisible && citaviPickerPanelHelper.isCreated) {
                        if (window.activehunter != null && window.activehunter.references == null) {
                            func = function () {
                                chrome.runtime.sendMessage({ action: MessageKeys.hunterScan, id: window.activehunter.id });
                            };
                        }
                        if (citaviPickerPanelHelper.pdfViewer.isActive && runtimeInfo.isChrome) {
                            citaviPickerPanelHelper.pdfViewer.getTextSelection();
                        }
                    }

                    citaviPickerPanelHelper.toggle(func);
                }
                break;

            case MessageKeys.progressDialogHide:
                {
                    var element = document.getElementById('citaviPickerProgressDialog');
                    if (element == null) return;
                    element.style.display = "none";
                }
                break;

            case MessageKeys.refreshPanel:
                {
                    citaviPickerPanelHelper.postMessage(MessageKeys.setDocumentInfo, citaviPickerPanelHelper.getDocInfos(), runtimeInfo.origin);
                }
                break;

            case MessageKeys.progressDialogProgress:
                {
                    var element = document.getElementById("citaviPickerProgressDescription");
                    if (element == null) return;
                    element.innerText = msg.val;
                }
                break;

            case MessageKeys.proxyLoggedIn:
                {
                    citaviPickerPanelHelper.postMessage(msg.action, msg, runtimeInfo.origin);
                }
                break;

            case MessageKeys.showErrorTab:
                {
                    citaviPickerPanelHelper.show(() => citaviPickerPanelHelper.postMessage(msg.action, msg, runtimeInfo.origin));
                }
                break;

            case MessageKeys.showPanel:
                {
                    if (citaviPickerPanelHelper.isVisible) {
                        return true;
                    }
                    citaviPickerPanelHelper.show();
                }
                break;

            case MessageKeys.setProgress:
            case MessageKeys.showInfoTab:
                {
                    if (!citaviPickerPanelHelper.isVisible) {
                        citaviPickerPanelHelper.show(() => citaviPickerPanelHelper.postMessage(msg.action, msg, runtimeInfo.origin));
                    }
                    else {
                        citaviPickerPanelHelper.postMessage(msg.action, msg, runtimeInfo.origin);
                    }
                }
                break;

            case MessageKeys.showBibliopgraphyImportInfoTab:
                {
                    msg.hunter = { id: "dummy" };
                    citaviPickerPanelHelper.postMessage(msg.action, msg, runtimeInfo.origin);
                }
                break;

            default:
                {
                    citaviPickerPanelHelper.postMessage(msg.action, msg, runtimeInfo.origin);
                }
                break;
        }
    }
    catch (e) {
        console.error(e);
    }
    return true;
});

//Window Eventlisteners
window.addEventListener("message", (event) => {
    try {

        if (event.origin != runtimeInfo.origin) {
            return;
        }

        switch (event.data.action)
        {
            case MessageKeys.loaded:
                {
                    annotationMarker.onAdded((a) => {
                        console.log("Annotation added");
                        citaviPickerPanelHelper.postMessage(MessageKeys.updateAnnotations, annotationMarker.annotations, event.origin);
                    });
                    annotationMarker.onRemoved((a) => {
                        console.log("Annotation removed");
                        citaviPickerPanelHelper.postMessage(MessageKeys.updateAnnotations, annotationMarker.annotations, event.origin);
                    });

                    citaviPickerPanelHelper.postMessage(MessageKeys.setDocumentInfo, citaviPickerPanelHelper.getDocInfos(), event.origin);
                    var func = null;
                    if (window.activehunter != null && window.activehunter.references == null) {
                        func = function () {
                            chrome.runtime.sendMessage({ action: MessageKeys.hunterScan, id: window.activehunter.id });
                        };
                    }
                    citaviPickerPanelHelper.toggle(func);
                }
                break;
            case MessageKeys.getDocumentInfo:
                {
                    citaviPickerPanelHelper.postMessage(MessageKeys.setDocumentInfo, citaviPickerPanelHelper.getDocInfos(), event.origin);
                }
                break;

            case MessageKeys.hidePanel:
                {
                    if (!citaviPickerPanelHelper.isVisible) {
                        return;   
                    }
                    citaviPickerPanelHelper.toggle(null);
                }
                break;

            case MessageKeys.updatePanel:
                {
                    chrome.runtime.sendMessage({ action: MessageKeys.updatePanel });
                }
                break;
        }
    }
    catch (e) {
        console.error(e);
    }
}, false);

function updateCitaviPickerStateOnCitaviWebsite() {
    try {
        if (document.location.origin) {
            switch (document.location.hostname) {
                case "alphacitaviweb.citavi.com":
                case "alphacitaviweb-dev.citavi.com":
                case "alphacitaviweb-staging.citavi.com":
                case "citaviweb-staging.citavi.com":
                case "citaviweb2.citavi.com":
                case "citaviweb.citavi.com":
                    {
                        if (document.location.pathname === "/start") {
                            document.addEventListener('citaviPickerInstalledCheck', e => {
                                const customEvent = new CustomEvent('citaviPickerInstalledCheckResponse', {
                                    detail: true
                                });
                                document.dispatchEvent(customEvent);
                            });
                        }
                    }
                    break;
            }
        }
    }
    catch (e) { }
}

var citaviPickerPanelHelper = new PanelHelper();
updateCitaviPickerStateOnCitaviWebsite();