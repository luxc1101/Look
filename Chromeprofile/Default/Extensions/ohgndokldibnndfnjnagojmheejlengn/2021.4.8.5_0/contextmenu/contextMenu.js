const CONTEXTMENU_ALL_FF = ["page", "frame", "selection", "link", "editable", "image", "video", "audio"];
const CONTEXTMENU_ALL_CHROME = ["all"];

class ContextMenu {

    constructor() {
        this.checked = {};
        this.initalize(null);
        chrome.tabs.onUpdated.addListener((t, i, t2) => this.updateContextMenu(t, i, t2));
        this.tabProgressDic = {};
        this.checkedTabIds = [];
    }

    checkForPdf(tab) {
        try {
            //if (tab.status == "loading") return;

            this.isPdf(tab, (isPdf) => {

                let e = chrome.runtime.lastError;
                if (e != null) {
                    telemetry.warn(e.message);
                    return;
                }
                if (!permissions.hasTabPermisson(tab)) {
                    chrome.contextMenus.removeAll();
                    return;
                }

                if (isPdf) {

                    if (runtimeInfo.isFirefox &&
                        this.checked[tab.url]) {
                        this.disableTab(tab);
                    }

                    chrome.contextMenus.removeAll();

                    var parentId = chrome.contextMenus.create({ id: "CitaviPicker", "title": "Citavi Picker", "contexts": ["all"] }, function () { });
                    this.initializeTextSelectionContextMenu(parentId);
                    //this.initializeImageSelectionContextMenu(parentId);

                    chrome.contextMenus.create(
                        {
                            "id": "asPdf",
                            "title": chrome.i18n.getMessage("AddPDFDocumentAsReference"),
                            "contexts": ["all"],
                            "parentId": parentId,
                            "onclick": (info, tab) => contextMenuEventhandler.importPdf(info, tab, true, true)
                        });

                    chrome.contextMenus.create(
                        {
                            "id": "asPdf2",
                            "title": chrome.i18n.getMessage("AddPdfAsLocalFile"),
                            "contexts": ["all"],
                            "parentId": parentId,
                            "onclick": (info, tab) => contextMenuEventhandler.sendAttachment(AttachmentType.referenceAttachment, false, info, tab, true)
                        });
                    this.initializeOptionsContextMenu(parentId);
                }
                else {
                    
                    this.intializeAllContextMenus();
                }
            });
        }
        catch (e) {
            if (!isNullOrUndefined(chrome.runtime.lastError)) {
                telemetry.error(chrome.runtime.lastError.message);
            }
            else {
                telemetry.error(e);
            }
        }
        return true;
    }

    disableTab(tab) {
        chrome.browserAction.disable(tab.id);
    }

    async isPdf(tab, callback) {
        try {

            var url = tab.url;

            if (url.endsWith(".pdf")) {
                this.checked[url] = true;
                callback(true);
                return;
            }

            if (!permissions.hasTabPermisson(tab)) {
                this.checked[url] = false;
                callback(false);
                return false;
            }

            if (this.checked[url] !== undefined) {
                callback(this.checked[url]);
                return;
            }

            if (url.indexOf("ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=") !== -1) {
                var ieeePdf = await pdfLookup.getPdfLinkFromWebsite(url);
                this.checked[url] = ieeePdf;
                callback(ieeePdf);
                return ieeePdf;
            }
            if (url.indexOf("onlinelibrary.wiley.com/doi/pdf/10.") !== -1 ||
                url.indexOf("onlinelibrary.wiley.com/doi/epdf/10.") !== -1) {
                var wileyPdf = await pdfLookup.getPdfLinkFromWebsite(url);
                this.checked[url] = wileyPdf;
                callback(wileyPdf);
                return wileyPdf;
            }

            var isFirefox = typeof browser != "undefined";
            var code = "";
            if (isFirefox) {
                code = 'var isPdf= false; if(document.getElementsByTagName("base").length > 0) {isPdf = document.getElementsByTagName("base")[0].href == "resource://pdf.js/web/";} isPdf;';
            }
            else {
                code = 'var isPdf = false; if (document.body.childElementCount === 1) { var embed = document.body.firstElementChild; if (embed.getAttribute("type") === "application/pdf") { isPdf = true; }} isPdf;';
            }

            this.checked[url] = false;
            chrome.tabs.executeScript(tab.id, { code: code }, async (isPdf) => {
                if (!isNullOrUndefined(chrome.runtime.lastError)) {
                    if (isFirefox &&
                        chrome.runtime.lastError.message === "Missing host permission for the tab") {
                        if (url.indexOf(".pdf") !== -1) {
                            //In FF dürfen wir kein bei PDF-Viewer kein Script ausführen
                            this.checked[url] = true;
                            callback(true);
                            return;
                        }
                        try {
                            var response = await fetch(url, { method: 'HEAD' });
                            var contentType = response.headers.get("content-type");
                            if (!isNullOrUndefined(contentType)) {
                                if (contentType.indexOf("application/pdf") !== -1) {
                                    this.checked[url] = true;
                                    callback(true);
                                    return;
                                }
                            }
                        }
                        catch (e) {
                            telemetry.error(e);
                        }
                    }
                    telemetry.error(chrome.runtime.lastError.message);
                }
                if (isPdf == undefined ||
                    isPdf.length == 0) {
                    this.checked[url] = false;
                    callback(false);
                }
                else {
                    this.checked[url] = isPdf[0];
                    callback(isPdf[0]);
                }
            });
        }
        catch (e) {
            if (!isNullOrUndefined(chrome.runtime.lastError)) {
                telemetry.error(chrome.runtime.lastError.message);
            }
            else {
                telemetry.error(e);
            }
            callback(false);
        }
    }

    isPdf2(tab) {
        return new Promise(resolve => {
            this.isPdf(tab, resolve);
        });
    }

    initalize(tabId) {
        try {

            if (!permissions.isApiAvailable(PermissonAPINames.contextMenus)) {
                telemetry.warn("chrome.contextMenus api is not available");
                return;
            }
            this.intializeAllContextMenus();

            if (tabId == null) return;

            this.updateContextMenu(tabId);
        }
        catch (e) {
            telemetry.error(e);
        }
    }

    intializeAllContextMenus() {
        chrome.contextMenus.removeAll();
        var contexts = runtimeInfo.isFirefox ? CONTEXTMENU_ALL_FF : CONTEXTMENU_ALL_CHROME;
        var parentId = chrome.contextMenus.create({ id: "CitaviPicker", "title": "Citavi Picker", "contexts": contexts }, function () { });
        this.initializeTextSelectionContextMenu(parentId);
        this.initializeImageSelectionContextMenu(parentId);

        if (settings.developerMode) {
            this.initializeOnLinkClickContextMenu(parentId);
        }

        this.initializeNoSelectionContextMenu(parentId);
        this.initializeOptionsContextMenu(parentId);
    }

    initializeTextSelectionContextMenu(parentId) {

        var textSelectionNewReferenceParent = chrome.contextMenus.create(
            {
                "title": chrome.i18n.getMessage("AddReferenceAndAddSelection"),
                "contexts": ["selection"],
                "parentId": parentId
            });
        //Neuer Titel
        chrome.contextMenus.create(
            {
                "title": chrome.i18n.getMessage("AsQuotation"),
                "contexts": ["selection"],
                "parentId": textSelectionNewReferenceParent,
                "onclick": (info, tab) => contextMenuEventhandler.sendText(ReferencePropertyId.QuotationText, true, info, tab, true)
            });

        chrome.contextMenus.create(
            {
                "title": chrome.i18n.getMessage("AsAbstract"),
                "contexts": ["selection"],
                "parentId": textSelectionNewReferenceParent,
                "onclick": (info, tab) => contextMenuEventhandler.sendText(ReferencePropertyId.Abstract, true, info, tab, true)
            });

        chrome.contextMenus.create(
            {
                "title": chrome.i18n.getMessage("AsTableOfContents"),
                "contexts": ["selection"],
                "parentId": textSelectionNewReferenceParent,
                "onclick": (info, tab) => contextMenuEventhandler.sendText(ReferencePropertyId.TableOfContents, true, info, tab, true)
            });

        chrome.contextMenus.create(
            {
                "title": chrome.i18n.getMessage("AsKeyword"),
                "contexts": ["selection"],
                "parentId": textSelectionNewReferenceParent,
                "onclick": (info, tab) => contextMenuEventhandler.sendText(ReferencePropertyId.Keywords, true, info, tab, true)
            });

        //====================

        chrome.contextMenus.create(
            {
                "type": "separator",
                "contexts": ["selection"],
                "parentId": parentId
            });

        chrome.contextMenus.create(
            {
                "title": chrome.i18n.getMessage("AddSelectionAsQuotation"),
                "contexts": ["selection"],
                "parentId": parentId,
                "onclick": function (info, tab) {
                    contextMenuEventhandler.sendText("QuotationText", false, info, tab, true);
                }
            });

        chrome.contextMenus.create(
            {
                "title": chrome.i18n.getMessage("AsAbstract"),
                "contexts": ["selection"],
                "parentId": parentId,
                "onclick": (info, tab) => contextMenuEventhandler.sendText(ReferencePropertyId.Abstract, false, info, tab, true)
            });

        chrome.contextMenus.create(
            {
                "title": chrome.i18n.getMessage("AsTableOfContents"),
                "contexts": ["selection"],
                "parentId": parentId,
                "onclick": (info, tab) => contextMenuEventhandler.sendText(ReferencePropertyId.TableOfContents, false, info, tab, true)
            });


        chrome.contextMenus.create(
            {
                "title": chrome.i18n.getMessage("AsKeyword"),
                "contexts": ["selection"],
                "parentId": parentId,
                "onclick": (info, tab) => contextMenuEventhandler.sendText(ReferencePropertyId.Keywords, false, info, tab, true)
            });


        chrome.contextMenus.create(
            {
                "type": "separator",
                "contexts": ["selection"],
                "parentId": parentId
            });

        chrome.contextMenus.create(
            {
                "title": chrome.i18n.getMessage("CopySelectionAndURLToClipboard"),
                "contexts": ["selection"],
                "parentId": parentId,
                "onclick": (info, tab) => contextMenuEventhandler.copyTextSelectionToClipboard(info, tab)
            });

        chrome.contextMenus.create(
            {
                "type": "separator",
                "contexts": ["selection"],
                "parentId": parentId
            });

    }

    initializeOptionsContextMenu(parentId) {

        chrome.contextMenus.create(
            {
                "type": "separator",
                "contexts": ["all"],
                "parentId": parentId
            });

        chrome.contextMenus.create(
            {
                "title": chrome.i18n.getMessage("Settings"),
                "contexts": ["all"],
                "parentId": parentId,
                "onclick": (info, tab) => panel.showTab(tab, MessageKeys.showSettingsTab)
            });

        if (typeof localRepo !== 'undefined' &&
            localRepo.connected) {
            chrome.contextMenus.create(
                {
                    "title": chrome.i18n.getMessage("RunCitavi"),
                    "contexts": ["all"],
                    "parentId": parentId,
                    "onclick": (info, tab) => citaviPicker.startCitavi()
                });
        }
    }

    initializeImageSelectionContextMenu(parentId) {
        var imageSelectionNewReference = chrome.contextMenus.create(
            {
                "title": chrome.i18n.getMessage("AddReferenceAndAddSelection"),
                "contexts": ["image"],
                "parentId": parentId,
            });
        chrome.contextMenus.create(
            {
                "title": chrome.i18n.getMessage("AsImageQuotation"),
                "contexts": ["image"],
                "parentId": imageSelectionNewReference,
                "onclick": (info, tab) => contextMenuEventhandler.sendAttachment(AttachmentType.knowledgeItemAttachment, true, info, tab, true)
            });

        chrome.contextMenus.create(
            {
                "title": chrome.i18n.getMessage("AsCoverArt"),
                "contexts": ["image"],
                "parentId": imageSelectionNewReference,
                "onclick": (info, tab) => contextMenuEventhandler.sendAttachment(AttachmentType.referenceCover, true, info, tab, true)
            });

        chrome.contextMenus.create(
            {
                "type": "separator",
                "contexts": ["image"],
                "parentId": parentId
            });

        chrome.contextMenus.create(
            {
                "title": chrome.i18n.getMessage("AddSelectionAsImageQuotation"),
                "contexts": ["image"],
                "parentId": parentId,
                "onclick": (info, tab) => contextMenuEventhandler.sendAttachment(AttachmentType.knowledgeItemAttachment, false, info, tab, true)
            });

        chrome.contextMenus.create(
            {
                "title": chrome.i18n.getMessage("AsCoverArt"),
                "contexts": ["image"],
                "parentId": parentId,
                "onclick": (info, tab) => contextMenuEventhandler.sendAttachment(AttachmentType.referenceCover, false, info, tab, true)
            });

    }

    initializeNoSelectionContextMenu(parentId) {

        chrome.contextMenus.create(
            {
                "id": "addWebPageAsReference",
                "title": chrome.i18n.getMessage("AddWebPageAsReference"),
                "contexts": ["page", "frame", "selection", "editable", "image", "video", "audio"],
                "parentId": parentId,
                "onclick": (info, tab) => contextMenuEventhandler.importWebPageWithHunterCheck(info, tab, true, true)
            });

    }

    initializeOnLinkClickContextMenu(parentId) {

        chrome.contextMenus.create(
            {
                "id": "addPDFDocumentAsReference",
                "title": chrome.i18n.getMessage("AddPDFDocumentAsReference"),
                "contexts": ["link"],
                "targetUrlPatterns": ["*://*/*.pdf"],
                "parentId": parentId,
                "onclick": (info, tab) => contextMenuEventhandler.downloadPdfAndImport(info, tab, true)
            });

        chrome.contextMenus.create(
            {
                "id": "adPdfAsLocalFile",
                "title": chrome.i18n.getMessage("AddPdfAsLocalFile"),
                "contexts": ["link"],
                "targetUrlPatterns": ["*://*/*.pdf"],
                "parentId": parentId,
                "onclick": (info, tab) => contextMenuEventhandler.downloadPdfAndImport(info, tab, false)
            });

    }

    updateContextMenu(tabId, info, tab) {

        if (tab != null) {
            if (this.checkedTabIds.indexOf(tab.id) != -1) {
                //18.03.2019
                //ST wirft alle 2 Sekunden ein Update
                //Das führt dazu, dass "onclick" bei ContextMenu nicht mehr korrekt funktioniert.
                //Wir brauchen das eigentlich nur für den Active-Tab-Changed Event...
                if (runtimeInfo.isFirefox &&
                    this.checked[tab.url]) {
                    this.disableTab(tab);
                }
                if (runtimeInfo.isFirefox &&
                    tab.url.indexOf("file:///") != -1) {
                    this.disableTab(tab);
                } 
                if (!runtimeInfo.isFirefox) {
                    return;
                }
            }
            if (tab.status == "complete") {
                if (permissions.hasTabPermisson(tab)) {
                    this.checkedTabIds.push(tab.id);
                }
            }

        }
        if (tab == null) {
            chrome.tabs.get(tabId, (t) => this.checkForPdf(t));
        }
        else {
            if (!tab.active) return;
            this.checkForPdf(tab);
        }
        return true;
    }

    showBadgeText(text, tab) {
        if (text == null) return;

        chrome.browserAction.setBadgeText({ text: text, tabId: tab.id });
    }
    
    showProgress(visible, tab) {
        try {
            var progress;
            var tabId = tab.id;
            if (this.tabProgressDic[tabId] != null) {
                progress = this.tabProgressDic[tabId];
            }
            else {
                progress = new ProgressCanvas();
                this.tabProgressDic[tabId] = progress;
            }

            if (panel.visible) {
                if (progress != null) {
                    progress.stop();
                }
                return;
            }

            if (visible) {
                var canvas = document.getElementById('canvas');
                chrome.browserAction.getBadgeText({ tabId: tab.id }, (r) => {
                    this.showBadgeText("", tab);
                    progress.param = r;
                });
                progress.draw(canvas, (c) => {
                    try {
                        var r = c.getImageData(0, 0, 32, 32);
                        chrome.browserAction.setIcon({
                            tabId: tabId,
                            imageData: {
                                "32": r
                            }
                        }, () => {
                            if (chrome.runtime.lastError != null) {
                                progress.stop();
                                this.tabProgressDic[tabId] = null;
                                console.warn(chrome.runtime.lastError.message);
                            }
                        });
                    }
                    catch (e) {
                        progress.stop();
                        this.tabProgressDic[tabId] = null;
                    }
                }, () => false);
            }
            else {
                progress.stop();
                this.tabProgressDic[tabId] = null;
                chrome.browserAction.setIcon({
                    tabId: tabId,
                    path: {
                        "16": "images/CitaviProgramIcon16.png",
                        "24": "images/CitaviProgramIcon24.png",
                        "32": "images/CitaviProgramIcon32.png",
                        "48": "images/CitaviProgramIcon48.png"
                    }
                });
                this.showBadgeText(progress.param, tab);
            }
        }
        catch (e) {
            if (progress != null) {
                progress.stop();
                this.tabProgressDic[tabId] = null;
            }
            telemetry.error(e);
        }
    }

    resetBadgeText(tab) {
        if (tab === undefined) return;

        chrome.browserAction.setBadgeText({ text: "", tabId: tab.id });
    }

}



