class ContextMenuEventhandler {
    constructor() {

    }

    async copyTextSelectionToClipboard(info, tab) {
        try {

            if (isNullOrUndefined(info.selectionText)) {

                info.selectionText = await this.getTextSelection();
                info.srcUrl = info.url;
            }
            var url = info.srcUrl;
            if(isNullOrEmpty(url)){
                url = info.pageUrl;
            }

            info.selectionText = info.selectionText.trim();

            var clipboardText = "\"" + info.selectionText + "\"\r\n" + url;

            var bg = chrome.extension.getBackgroundPage();
            var clipboardholder = bg.document.getElementById("citaviPickerClipboardholder");

            clipboardholder.value = clipboardText;
            clipboardholder.style.display = "block";
            clipboardholder.select();
            bg.document.execCommand("Copy");
            clipboardholder.style.display = "none";
        }
        catch (e) {
            telemetry.error(e);
            return false;
        }
        return true;
    }

    download(url, asBase64) {
        return new Promise(resolve => {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'arraybuffer';
            xhr.onerror = (e) => resolve(null);
            xhr.onload = function (e) {
                if (this.status == 200) {
                    var uInt8Array = new Uint8Array(this.response);
                    if (asBase64) {
                        var i = uInt8Array.length;
                        var binaryString = new Array(i);
                        while (i--) {
                            binaryString[i] = String.fromCharCode(uInt8Array[i]);
                        }
                        var data = binaryString.join('');
                        var base64 = window.btoa(data);
                        resolve(base64);
                    }
                    else {
                        resolve(uInt8Array);
                    }
                }
            };
            xhr.send();
        });
    }

    getWebPageInfo(tab) {
        return new Promise(resolve => {
            chrome.tabs.executeScript({ file: "helpers/getPageInfo.js" }, response => {
                var info = {};
                try {
                    if (chrome.runtime.lastError != null) {
                        telemetry.error(chrome.runtime.lastError);
                    }
                    if (response == null || response[0] == null) {
                        info.html = "";
                        info.title = tab.title;
                        info.url = tab.url;
                        resolve(info);
                        return;
                    }
                    info.lastModified = response[0].lastModified;
                    info.title = response[0].title;
                    info.url = response[0].url;
                    info.html = response[0].source;
                    info.body = response[0].body;
                    if (info.title == "") {
                        info.title = info.url;
                    }
                }
                catch (e) {
                    telemetry.error(e);
                }
                resolve(info);
            });
        });
    }

    getTextSelection() {
        return new Promise(resolve => {
            chrome.tabs.executeScript({ code: "window.getSelection().toString();" }, (response) => {
                if (!isNullOrUndefined(chrome.runtime.lastError)) {
                    telemetry.error(chrome.runtime.lastError.message);
                }
                if (response == null || response.length == 0) {
                    resolve("");
                }
                else {
                    resolve(response[0]);
                }
            });
        });
    }

    async downloadPdfAndImport(info, tab, createNewReference) {
        try {
            var result = await pdfLookup.resolveUrl(info.linkUrl);
            if (!result.isPdf) {
                return;
            }
            var pdf = result.url;
            await panel.createIfNotExists(tab);
            if (createNewReference) {
                await this.importPdf({ srcUrl: pdf }, tab, true);
            }
            else {
                await this.sendAttachment(AttachmentType.referenceAttachment, false, { srcUrl: pdf }, tab, true);
            }
        }
        catch (e) {
            telemetry.error(e);
        }
    }

    async importWebPageWithHunterCheck(info, tab, showImportSuccessPanel) {
        chrome.browserAction.getBadgeText({ tabId: tab.id }, async (r) => {
            if (r === "1") {
                panel.show(tab);
            }
            else {
                await this.importWebPage(info, tab, showImportSuccessPanel);
            }
        });
    }

    async importWebPage(info, tab, showImportSuccessPanel) {
        try {
            if (!citaviPicker.validate(true)) {
                return null;
            }
            panel.sendProgress(tab, { type: ProgressType.import, text: chrome.i18n.getMessage("ImportKindleReference")});

            if (contextMenu.checked[info.srcUrl] == null) {
                await contextMenu.isPdf2(tab);
            }

            if (contextMenu.checked[info.srcUrl]) {
                return await this.importPdf(info, tab, showImportSuccessPanel, false);
            }

            var ris = "";
            var parser = new SimpleParser();

            var pageInfo = await this.getWebPageInfo(tab);

            if (pageInfo.url.indexOf("youtube.com") != -1) {
                var youtubeParser = new YoutubeParser();
                ris = await youtubeParser.scanAsync(pageInfo.url, pageInfo.body);
            }
            if (ris == "") {
                ris = parser.parse("htmlToRis", pageInfo);
            }

            var result = await citaviPicker.sendImport(ris, SimpleParser.RIS_ID, null, tab.url);
            if (!result.success) {
                result.ris = ris;
                panel.showException(tab, result, "sendImport failed");
                return null;
            }
            var referenceId = result.referenceId;
            if (referenceId !== undefined) {
                await citaviPicker.sendCreateImportGroup({ referenceIds: referenceId });
            }
            var reference = parser.parseRIS([ris])[0];
            var result = {};
            if (reference !== undefined && !isNullOrEmpty(reference.cover)) {
                result = await citaviPicker.download(tab.id, reference.cover, citaviPicker.activeRepo.isLocal, DownloadFileType.Cover);
                if (result != null &&
                    result.data != null &&
                    result.data.length > 0) {
                    var bag = {
                        referenceId: referenceId,
                        data: citaviPicker.activeRepo.isLocal ? result.data : Uint8Array.from(result.data),
                        url: reference.cover,
                        attachmenType: AttachmentType.referenceCover,
                        contentType: "image/png"
                    };
                    result.success = await citaviPicker.sendAttachment(bag);
                }
                else {
                    telemetry.log("Download Cover failed", { cover: reference.cover, reference: reference });
                }
            }

            if (showImportSuccessPanel) {
                panel.sendImportSuccessProgress(tab, "ReferenceSentToCitavi");
            }
            if (result.success) {
                result.reference = reference;
            }
            return result;
        }
        catch (e) {
            telemetry.error(e);
            return null;
        }
    }

    async importPdf(info, tab, showImportSuccessPanel) {
        var result = { success: false };
        try {

            if (!citaviPicker.validate(true)) {
                return result;
            }

            var pdfUrl = info.srcUrl;
            if (isNullOrUndefined(pdfUrl)) {
                pdfUrl = tab.url;
            }

            if (pdfUrl.indexOf("chrome-extension") != -1) {
                tab = await this.getActiveTab();
                pdfUrl = tab.url;
            }

            if (!isNullOrUndefined(_pdfLookupCache[pdfUrl])) {
                pdfUrl = _pdfLookupCache[pdfUrl];
            }
            else if (!isNullOrUndefined(_pdfLookupCache[tab.url])){
                pdfUrl = _pdfLookupCache[tab.url];
            }

            telemetry.log(`download pdf: ${pdfUrl}`);

            panel.sendProgress(tab, { type: ProgressType.import, text: chrome.i18n.getMessage("ImportKindleReference") });
            var response = await this.download(pdfUrl, citaviPicker.activeRepo.isLocal);
            if (citaviPicker.activeRepo.isLocal) {
                result.success = await citaviPicker.activeRepo.importPdfBase64(response, "pdfBase64\r\nName:" + tab.title);
            }
            else {
                result = await citaviPicker.sendImport(response, "FACF60BD-23C4-4d82-9B33-D635011B0BC1", tab.title, pdfUrl);
                if (!result.success) {
                    result.pdfUrl = pdfUrl;
                    panel.showException(tab, result, "sendImport failed");
                    return result;
                }
            }

            if (pdfUrl.indexOf("X-Amz-Expires") === -1) {
                //#1712
                await citaviPicker.sendTitledata({ fld: "OnlineAddress", data: pdfUrl, url: pdfUrl });
            }
            if (showImportSuccessPanel) {
                panel.sendImportSuccessProgress(tab, "ReferenceSentToCitavi");
            }
            
            return result;
        }
        catch (e) {
            telemetry.error(e);
            return result;
        }
    }

    async sendAttachment(attachmentType, createNewReference, info, tab, clearProgressAfterImport) {
        try {
            panel.sendProgress(tab, { type: ProgressType.addAttachment });

            var url = info.srcUrl;
            if (url === undefined) {
                url = tab.url;
            }
            if (url.indexOf("chrome-extension") != -1) {
                tab = await this.getActiveTab();
                url = tab.url;
            }

            if (!isNullOrUndefined(_pdfLookupCache[url])) {
                url = _pdfLookupCache[url];
            }
            var response = await this.download(url, citaviPicker.activeRepo.isLocal);

            var bag = { data: response, url: url, title: tab.title, attachmenType: attachmentType };

            if (attachmentType == AttachmentType.referenceAttachment) {
                bag.contentType = "application/pdf";
            }
            else if (attachmentType == AttachmentType.referenceCover ||
                     attachmentType == AttachmentType.knowledgeItemAttachment) {
                bag.contentType = "image/png";
            }

            if (createNewReference) {
                var result = await this.importWebPage(info, tab, false, clearProgressAfterImport);
                if (result && result.success) {
                    telemetry.log("importWebPage result", result);
                    bag.referenceId = result.referenceId;
                    await citaviPicker.sendAttachment(bag);
                    panel.sendImportSuccessProgress(tab, "ReferenceSentToCitavi");
                }
            }
            else {
                await citaviPicker.sendAttachment(bag);
                panel.sendImportSuccessProgress(tab, "ReferenceDataSentToCitavi");
            }
            return true;
        }
        catch (e) {
            telemetry.error(e);
            return false;
        }
    }

    async sendText(fldName, createNewReference, info, tab, clearProgressAfterImport) {
        try {
            if (!citaviPicker.validate(true)) {
                return false;
            }

            panel.sendProgress(tab, { type: ProgressType.addText });
            var createTitleDataResult = null;
            var text = null;
            if (createNewReference) {
                var result = await this.importWebPage(info, tab, false, false);
                if (result == null || !result.success) {
                    telemetry.warn("import webpage failed");
                    return false;
                }

                text = await this.getTextSelection();
                if (text === "" || text === undefined) {
                    text = info.selectionText;
                }
                if (text === undefined) {
                    return false;
                }
                var bag = {
                    fld: fldName,
                    data: text,
                    url: info.srcUrl,
                    referenceId: result.referenceId
                };

                telemetry.log("send titledata", bag);

                createTitleDataResult = await citaviPicker.sendTitledata(bag);
                panel.sendImportSuccessProgress(tab, "ReferenceSentToCitavi");
            }
            else {
                text = await this.getTextSelection();
                if (text == "" || text === undefined) {
                    text = info.selectionText;
                }
                if (text === undefined) {
                    return false;
                }
                createTitleDataResult = await citaviPicker.sendTitledata({ fld: fldName, data: text, url: info.srcUrl });
                panel.sendImportSuccessProgress(tab, "ReferenceDataSentToCitavi");
            }

            console.log(createTitleDataResult);

            if (createTitleDataResult &&
                !isNullOrUndefined(createTitleDataResult.value) &&
                createTitleDataResult.value !== "" &&
                fldName === ReferencePropertyId.QuotationText &&
                settings.saveHtmlAnnotations) {

                await annotationService.createAnnotation(fldName, text, createTitleDataResult.value, tab);
            }

            return true;
        }
        catch (e) {
            panel.showException(tab, e);
            return false;
        }
    }

    async sendWebPageAsLocation(info, tab) {
        try {
            if (!citaviPicker.validate(true)) {
                return false;
            }
            panel.sendProgress(tab, { type: ProgressType.addText });
            if (info === null) {
                info = await this.getWebPageInfo(tab);
            }
            await citaviPicker.sendTitledata({ fld: "LocationElectronic", data: info.srcUrl });
            panel.sendImportSuccessProgress(tab, "ReferenceDataSentToCitavi");
            return true;
        }
        catch (e) {
            telemetry.error(e);
            return false;
        }
    }

    async screenshot(tab) {
        return new Promise(resolve => {
            try {
                chrome.tabs.captureVisibleTab({ format: "png" }, (dataUrl) => {
                    if (!isNullOrUndefined(chrome.runtime.lastError)) {
                        telemetry.error(chrome.runtime.lastError.message);
                        resolve(null);
                    }
                    else {
                        resolve(dataUrl);
                    }
                });
            }
            catch (e) {
                telemetry.error(e);
                resolve(null);
            }
        });
    }

    async screenshotAsCover(tab) {
        try {
            panel.sendProgress(tab, { type: ProgressType.addAttachment });
            var screenshot = await this.screenshot(tab);
            screenshot = screenshot.replace("data:image/png;base64,", "");
            if (screenshot != null) {
                var bag = {
                    data: citaviPicker.activeRepo.isLocal ? screenshot : Base64.toArrayBuffer(screenshot),
                    attachmenType: AttachmentType.referenceCover,
                    contentType: "image/png"
                };
                await citaviPicker.sendAttachment(bag);
            }
        }
        catch (e) {
            telemetry.error(e);
            return false;
        }
        return true;
    }

    getActiveTab() {
        return new Promise(resolve => {
            var self = this;
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                var activeTab = tabs[0];
                resolve(activeTab);
            });
        });
    }
}




