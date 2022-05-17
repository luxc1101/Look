const MessageKeys = {
    changeProject: "changeProject",
    changeRepo: "changeRepo",
    checkForDuplicates: "checkForDuplicates",
    closePanel: "closePanel",
    captureVisibleTab: "captureVisibleTab",
    createCoverFromPdfAttachement: "CreateCoverFromPdfAttachement",
    entityId: "EntityId",
    downloadPdf: "downloadPdf",
    fetch: "fetch",
    fetchText: "fetchText",
    fileNames: "FileNames",
    getAnalyserOptions: "getAnalyserOptions",
    getDocumentInfo: "getDocumentInfo",
    getSettings: "getSettings",
    getISBNTransformers: "getISBNTransformers",
    getHunter: "getHunter",
    getHuntersCount: "getHuntersCount",
    hunterImport: "hunterImport",
    hunterDirectImport: "hunterDirectImport",
    hunterScan: "hunterScan",
    huntersRun: "huntersRun",
    isCitaviRunning: "isCitaviRunning",
    invokeContextMenuHnd: "invokeContextMenuHnd",
    importReference: "importReference",
    importReferences: "importReferences",
    isbnImport: "isbnImport",
    jobId: "JobId",
    loaded: "loaded",
    logout: "logout",
    login: "login",
    lookupBibliography: "lookupBibliography",
    onProjectChanged: "onProjectChanged",
    onLoggedIn: "onLoggedIn",
    onLoggedOut: "onLoggedOut",
    onRepoChanged: "onRepoChanged",
    onTextSelectionChanged: "onTextSelectionChanged",
    operationId: "OperationId",
    progressDialogHide: "progressDialogHide",
    progressDialogProgress: "progressDialogProgress",
    proxyCancel: "proxyCancel",
    proxyLogin: "proxyLogin",
    proxyLoggedIn: "proxyLoggedIn",
    refreshPanel: "refreshPanel",
    reportBug: "reportBug",
    referenceId: "referenceId",
    restoreAnnotations: "restoreAnnotations",
    sendScreenshotAsAttachment: "sendScreenshotAsAttachment",
    setProgress: "setProgress",
    setDocumentInfo: "setDocumentInfo",
    setSettings: "setSettings",
    setImportProgress: "setImportProgress",
    showSettingsTab: "showSettingsTab",
    showErrorTab: "showErrorTab",
    showCitaviEntity: "showCitaviEntity",
    showInfoTab: "showInfoTab",
    showPanel: "showPanel",
    showBibliopgraphyImportInfoTab: "showBibliopgraphyImportInfoTab",
    temporaryKey: "TemporaryKey",
    telemetry: "Telemetry",
    transformerId: "TransformerId",
    takeScreenshot: "takeScreenshot",
    hidePanel: "hidePanel",
    togglePanel: "togglePanel",
    updatePanel: "updatePanel",
    updateAccessToken: "updateAccessToken",
    updateAccount: "updateAccount",
    uploadOperationType: "UploadOperationType",
    updateDuplicateState: "updateDuplicateState",
    updateAnnotations: "updateAnnotations"
};

const SettingNames = {
    aiSeverityLevel: "aiSeverityLevel",
    aiSessionId: "aiSessionId",
    autoShowDuplicateReference: "autoShowDuplicateReference",
    blackList: "blackList",
    buildType: "buildType",
    detectReferenceIdentifier: "detectReferenceIdentifier",
    developerMode: "developerMode",
    enableHunter: "enableHunter",
    importPdf: "importPdf",
    lastLogin: "lastLogin",
    lookupBibliography: "lookupBibliography",
    newsPaperHtmlAsPdf: "newsPaperHtmlAsPdf",
    projectKey: "projectKey",
    proxyUrl: "proxyUrl",
    proxyName: "proxyName",
    repo: "repo",
    saveHtmlAnnotations: "saveHtmlAnnotations",
};

const ProgressType = {
    addAttachment: "addAttachment",
    addText: "addText",
    bibliographyReferencesImport: "bibliographyReferencesImport",
    hunter: "hunter",
    import: "import",
    none: "none",
    searchPdf: "searchPdf"
};

const InfoType = {
    identifierExists: "identifierExists",
    importOK: "importOK",
    jstorNotLoggedIn: "jstorNotLoggedIn"
};

const ReferenceIdentifierType = {
    Doi: 1,
    Isbn: 2,
    PubMedId: 4,
    Arxiv: 8,
    Urn: 16,
    PmcId: 32,
    Hunter: 64
};

const ReferenceType = {
    NewspaperArticle:1,
    Dataset:2,
    Webpage:3
}

const ReferencePropertyId = {
    Abstract : "Abstract",
    Keywords : "Keywords",
    QuotationText : "QuotationText",
    TableOfContents : "TableOfContents"
};

const QuotationType = {
    directQuotation: "DirectQuotation",
    indirectQuotation: "IndirectQuotation",
    summary: "Summary",
    comment: "Comment",
    highlight: "Highlight",
    quickReference: "QuickReference",
};

const StorageKeys = {
    annotation: "an_"
};

const Rgx = {
    ScienceDirect: /linkinghub\.elsevier\.com\/retrieve\/pii\/(S[\dX]+)/,
    ScienceDirectPDFRedirect: /article\/pii\/S([\dX]+)\/pdfft\?/,
    WhileyPdf: /onlinelibrary.wiley.com\/doi\/pdf\//,
}

const AttachmentType = {
    referenceAttachment: "ReferenceAttachment",
    referenceCover: "ReferenceCover",
    knowledgeItemAttachment: "KnowledgeItemAttachment",
};

const BuildTypes =
{
        Alpha: "alpha",
        Beta: "beta",
        Release: "release"
}

const Constants =
{
    LocalRepo: "local",
    WebRepo: "web",
};

const ProxyType =
{
    EZProxy: "ezproxy",
    HAN: "han"
}

const SeverityLevel =
{
    None: 100,
    Verbose: 0,
    Information: 1,
    Warning: 2,
    Error: 3,
    Critical: 4
};

const DownloadFileType = {
    Cover: 0,
    Pdf: 1
};

class RuntimeInfo {

    constructor() {
        this.chromePDFPluginId = "chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai";

        this.isFirefox = typeof browser !== "undefined";
        this.isChrome = !this.isFirefox;

        this.browserName = this.isChrome ? "Chrome" : "Firefox";

        if (navigator.userAgent.indexOf("Edg") !== -1) {
            this.browserName = "Edge";
            this.isEdge = true;
        }

        this.origin = this.isFirefox ? chrome.extension.getURL("").slice(0, -1) : 'chrome-extension://' + chrome.runtime.id;
        this.id = chrome.runtime.id;
        this.pickerVersion = "";

        var manifestData = chrome.runtime.getManifest();
        this.pickerVersion = manifestData.version;
    }
}
let runtimeInfo = new RuntimeInfo();

var hunterScan = async function (jobId, tabId, repo) {
    var info = { repo: repo };
    var records = [];
    try {
        records = await hunter.scanAsync(info);
        if (records == null) records = [];
    }
    catch (e) {
        console.error(e);
    }
    chrome.runtime.sendMessage({ records: records, jobId: jobId, tabId: tabId, action: MessageKeys.hunterImport, hunterId: hunter.id });
};

class TextSelection {
    constructor(text) {
        this.title = document.title;
        this.url = document.location.url ? document.location.url : window.location.toString();
        this.text = text;
        if (this.text != null) {
            this.text = this.text.trim();
        }
        if (this.text == "") this.text = null;
    }
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

function usebtoa(data) {
    return btoa(String.fromCharCode.apply(data.length, data));
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isNewerOrEqualVersion(toCheck, minVersion) {
    try {
        if (toCheck === minVersion) return true;
        var a_components = toCheck.split(".");
        var b_components = minVersion.split(".");
        var len = Math.min(a_components.length, b_components.length);
        for (var i = 0; i < len; i++) {
            if (parseInt(a_components[i]) > parseInt(b_components[i])) {
                return true;
            }
            if (parseInt(a_components[i]) < parseInt(b_components[i])) {
                return false;
            }
        }
        if (a_components.length > b_components.length) {
            return true;
        }
        if (a_components.length < b_components.length) {
            return false;
        }
    }
    catch (e) {
        telemetry.error(e);
    }
    return true;
}

function isNullOrEmpty(text) {
    return (!text || text.length === 0);
}

function isNullOrUndefined(obj) {
    return obj === null || obj === undefined || typeof obj === "undefined";
}

function isNullOrUndefinedOrEmpty(obj) {
    return obj === null || obj === undefined || typeof obj === "undefined" || isNullOrEmpty(obj);
}

function isString(obj) {
    return (Object.prototype.toString.call(obj) === '[object String]');
}

function toHtml(text) {
    return text.replace(/&/g, '&amp;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&#39;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/(?:\r\n|\r|\n)/g, '<br>');
    
}
function htmlToText(html) {
    return html.replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, '\'')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/<br>/g, '\r\n');
}


function toTitleCase(str) {
    try {
        return str.replace(
            /\w\S*/g,
            function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }
        );
    }
    catch (e) {
        console.error(e);
    }
    return str;
}

function dateToCitaviString(input) {
    try {
        try {

            var date;
            if (input !== "") {
                date = new Date(input);
            }
            else {
                date = new Date();
            }

            if (citaviPicker.activeRepo.isLocal && citaviPicker.activeRepo.isCitavi5) {
                return date.toLocaleDateString();
            }
        }
        catch (e) {
            telemetry.error(e);
        }
        return date.toISOString();
    }
    catch (e) {
        return null;
    }
}


function isNodeVisible(node) {
    return (!node.style || node.style.display != "none")
        && !node.hasAttribute("hidden")
        && (!node.hasAttribute("aria-hidden") || node.getAttribute("aria-hidden") != "true" || (node.className && node.className.indexOf && node.className.indexOf("fallback-image") !== -1));
}

var Isbn = new function () {
    this.isISBN = function (isbn) {

        if (isbn.length < 10) return false;

        if (this.isISBN10(isbn) == true) return true;

        if (this.isISBN13(isbn) == true) return true;

        return false;
    }

    this.scanISBN10 = function (S, f) {
        var t = 0, j, c;
        for (j = 0; j < S.length; j++) {
            c = S.charCodeAt(j);
            if ((c == 88 && f == 1) ||
                (c == 120 && f == 1)) {
                t += 10;
                f--;
            }
            if (c > 47 && c < 58) {
                t += (c - 48) * f--;
            }
        }

        return { F: f, T: t };
    }

    this.isISBN10 = function (isbn) {

        with (this.scanISBN10(isbn, 10)) {
            return F == 0 && T % 11 == 0;
        }
    }

    this.scanISBN13 = function (S) {
        var f = 13, t = 0, j, c, k = 1;
        for (j = 0; j < S.length; j++) {
            c = S.charCodeAt(j);
            if (c > 47 && c < 58) {
                f--;
                t += (c - 48) * (2 + (k = -k));
            }
        }
        return { F: f, T: t };
    }

    this.isISBN13 = function (isbn) {
        with (this.scanISBN13(isbn)) {
            return F == 0 ? T % 10 == 0 : "size?";
        }
    }
};

var Base64 = {
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    encode: function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = Base64._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
                this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }

        return output;
    },

    decode: function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

        }

        output = Base64._utf8_decode(output);

        return output;

    },

    toArrayBuffer: function (base64) {
        var binary_string = window.atob(base64);
        var len = binary_string.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    },

    _utf8_encode: function (string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    _utf8_decode: function (utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while (i < utftext.length) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    }
};

class ProgressCanvas{
    constructor(){
        this.id = null;
        this.isAnimating = false;
    }

    stop() {
        this.isAnimating = false;
        window.clearInterval(this.id);
    }

    draw2(canvas, report, end){
        window.clearInterval(this.id);
        if (canvas != null) {
            var parent = canvas.parentNode;
            var context = canvas.getContext('2d');
            var start = new Date();
            var lines = 16;
            var cW = context.canvas.width;
            var cH = context.canvas.height;
            var drawProgressInterval = () => {
                var rotation = parseInt(((new Date() - start) / 1000) * lines) / lines;
                context.save();
                context.clearRect(0, 0, cW, cH);
                context.translate(cW / 2, cH / 2);
                context.rotate(Math.PI * 2 * rotation);
                for (var i = 0; i < lines; i++) {

                    context.beginPath();
                    context.rotate(Math.PI * 2 / lines);
                    context.moveTo(cW / 10, 0);
                    context.lineTo(cW / 4, 0);
                    context.lineWidth = cW / 30;
                    context.strokeStyle = "rgba(0, 84, 159," + i / lines + ")";
                    context.stroke();
                }

                if (report != null) report(context);
                context.restore();
                if (end()) {
                    window.clearInterval(this.id);
                }
            };
            this.id = window.setInterval(drawProgressInterval, 100);
        }
    }

    draw(canvas, report, end) {
        this.isAnimating = true;
        window.clearInterval(this.id);

        if (canvas != null) {
            var context = canvas.getContext('2d');
            var al = 0;
            var start = 4.72;
            var cw = context.canvas.width;
            var ch = context.canvas.height;
            var diff;
            var colorDifFix = 0;
            var color1 = '#FFFFFF';
            var color2 = '#0068CC';

            var drawProgressInterval = () => {
                diff = (al / 100) * Math.PI * 2;
                var lw = cw / 10;
                
                context.clearRect(0, 0, cw, ch);
                context.beginPath();
                context.lineWidth = lw;
                context.arc(cw / 2, ch / 2, cw / 2 - lw, 0, 2 * Math.PI, false);
                context.strokeStyle = color1;
                context.stroke();

                context.strokeStyle = color2;
                context.lineWidth = lw + colorDifFix;
                context.beginPath();
                context.arc(cw / 2, ch / 2, cw / 2 - lw, start, diff + start, false);
                context.stroke();

                if (al >= 100) {
                    var t = color1;
                    color1 = color2;
                    color2 = t;
                    if (color2 == '#FFFFFF') {
                        colorDifFix = 1.6;
                    }
                    else {
                        colorDifFix = 0;
                    }
                    al = 0;
                }
                al += 3;
                if (report != null) report(context);
                context.restore();
                if (end()) {
                    this.isAnimating = false;
                    window.clearInterval(this.id);
                }
            }
            this.id = window.setInterval(drawProgressInterval, 30);
        }
    }
}