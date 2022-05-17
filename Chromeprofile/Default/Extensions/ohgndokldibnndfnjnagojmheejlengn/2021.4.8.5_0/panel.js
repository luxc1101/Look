class Panel {
    constructor() {
        this.created = false;
    }

    broadcast(msg) {
        if (typeof msg === 'string') {
            var action = msg;
            msg = {};
            msg.action = action;
        }
        telemetry.log("Broadcast message: " + msg.action);
        getEnvironment((env) => {
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => chrome.tabs.sendMessageEx(tab.id, msg, false, env));
            });
        }, true);
    }

    clearProgress(tab) {
        contextMenu.showProgress(false, tab);
        panel.sendProgress(tab, { type: ProgressType.none });
    }

    close(tab) {

        if (tab == null || tab.id == -1) {
            this.getActiveTab((t) => {
                if (t == null) return;
                this.close(t);
            });
            return;
        }
        if (!permissions.hasTabPermisson(tab)) return;

        var msg = {};
        msg.action = MessageKeys.closePanel;
        this.sendMessage(tab.id, tab.url, msg);
    }

    async createIfNotExists(tabId) {

        chrome.tabs.sendMessageEx(tabId, msg, localRepo.connected);
        return true;

        //TODO 18.06.2020 Delete after next release if ok
        var promise = new Promise(async resolve => {
            resolve(true);
            return;
            var result = await this.exists(tabId);
            if (result === null) {
                resolve(false);
                return;
            }

            if (!result.r1 && !result.r2) {

                //Firefox u. PDFs. Shared ist da aus welchem Grund auch immer nicht vorhanden!
                //Das ganze funktioniert aber nur mit 2 zusätzlichen Permissions:
                //mozillaAddons (<- nur für Mozilla AddOns!)
                //resource://*/*"
                //chrome.tabs.executeScript(tabId, { file: "shared.js" }, (r) => {
                //    chrome.tabs.executeScript(tabId, { file: "iframe/helper.js" }, (r) => {
                //        msg.origin_fix = "resource://pdf.js";
                //        chrome.tabs.sendMessageEx(tabId, msg, localRepo.connected);
                //    });
                //});
                resolve(false);
            }
            else {
                chrome.tabs.executeScript(tabId, { file: "iframe/helper.js" }, (r) => {
                    resolve(true);
                });
            }
        });
        return promise;
    }

    exists(tabId) {
        return { exists: true };

        //TODO 18.06.2020 Delete after next release if ok
        var code = "var x = {r1: document.getElementById('citavipickerpanel') != null, r2:typeof runtimeInfo !== 'undefined'}; x;";
        return new Promise(resolve => {
            chrome.tabs.executeScript(tabId, { code: code }, (r) => {
                try {
                    if (isNullOrUndefined(r) ||
                        r.length == 0 ||
                        r[0] === null) // Cannot read property 'r1' of null. Tritt nur (?) bei Vivaldi - Browser auf
                    {
                        if (!isNullOrUndefined(chrome.runtime.lastError)) {
                            telemetry.error(chrome.runtime.lastError.message);
                        }
                        resolve({ exists: false, r1: false, r2: false });
                    }
                    else {
                        r[0].exists = r[0].r1;
                        resolve(r[0]);
                    }
                }
                catch (e) {
                    telemetry.error(e);
                    resolve({ exists: false, r1: false, r2: false });
                }
            });
        });
    }

    isVariableDeclared(tabId, variableName) {
        var code = "var x = typeof " + variableName + " !== 'undefined'; x;";
        return new Promise(resolve => {
            chrome.tabs.executeScript(tabId, { code: code }, (r) => {
                try {
                    
                    if (!isNullOrUndefined(chrome.runtime.lastError)) {
                        telemetry.error(chrome.runtime.lastError.message);
                        resolve(false);
                    }
                    if (isNullOrUndefined(r) ||
                        r.length == 0 ||
                        r[0] === null)
                    {
                        resolve(false);
                    }
                    else {
                        resolve(r[0]);
                    }
                }
                catch (e) {
                    telemetry.error(e);
                    resolve(false);
                }
            });
        });
    }

    async sendMessage(tabId, tabUrl, msg) {

        chrome.tabs.sendMessageEx(tabId, msg, localRepo.connected);
        return;
        //TODO 18.06.2020 Delete after next release if ok
        var result = await this.exists(tabId);
        if (result === null) return;
        

        if (result.r1 && result.r2) {
            chrome.tabs.sendMessageEx(tabId, msg, localRepo.connected);
        }
        else {
            if (tabUrl != undefined) {
                msg.isPdf = contextMenu.checked[tabUrl];
            }

            if (!result.r1 && !result.r2) {

                //Firefox u. PDFs. Shared ist da aus welchem Grund auch immer nicht vorhanden!
                //Das ganze funktioniert aber nur mit 2 zusätzlichen Permissions:
                //mozillaAddons (<- nur für Mozilla AddOns!)
                //resource://*/*"
                //chrome.tabs.executeScript(tabId, { file: "shared.js" }, (r) => {
                //    chrome.tabs.executeScript(tabId, { file: "iframe/helper.js" }, (r) => {
                //        msg.origin_fix = "resource://pdf.js";
                //        chrome.tabs.sendMessageEx(tabId, msg, localRepo.connected);
                //    });
                //});
            }
            else {
                chrome.tabs.executeScript(tabId, { file: "iframe/helper.js" }, (r) => {
                    chrome.tabs.sendMessageEx(tabId, msg, localRepo.connected);
                });
            }
        }
    }

    sendFetchReferenceIdentiferProgress(tab, identifier) {

        var text = "";
        if (identifier.type == ReferenceIdentifierType.Arxiv) {
            text = "arXiv-ID:" + identifier.value;
        }
        else if (identifier.type == ReferenceIdentifierType.Doi) {
            text = "DOI: " + identifier.value;
        }
        else if (identifier.type == ReferenceIdentifierType.Isbn) {
            text = "ISBN: " + identifier.value;
        }
        else if (identifier.type == ReferenceIdentifierType.PmcId) {
            text = "PMCID: " + identifier.value;
        }
        else if (identifier.type == ReferenceIdentifierType.PubMedId) {
            text = "PubMed-Id: " + identifier.value;
        }
        
        return this.sendProgress(tab, { type: ProgressType.import, text: text, text2: "" });
    }

    sendProgress(tab, progress) {
        return new Promise((resolve) => {
            if (progress.type != ProgressType.none && progress.type != ProgressType.bibliographyReferencesImport) {
                contextMenu.showProgress(true, tab);
            }
            else {
                contextMenu.showProgress(false, tab);
            }
            if (tab == null || tab.id == -1) {
                chrome.tabs.query({ currentWindow: true, active: true }, tabs => {
                    if (!isNullOrUndefined(chrome.runtime.lastError)) {
                        telemetry.error(chrome.runtime.lastError.message);
                    }
                    chrome.tabs.sendMessageEx(tabs[0].id, { action: MessageKeys.setProgress, progress: progress }, (r) => {
                        if (resolve) {
                            resolve();
                        }
                    });
                });
            }
            else {
                chrome.tabs.sendMessageEx(tab.id, { action: MessageKeys.setProgress, progress: progress }, (r) => {
                    if (!isNullOrUndefined(chrome.runtime.lastError)) {
                        telemetry.error(chrome.runtime.lastError.message);
                    }
                    if (resolve) {
                        resolve();
                    }
                });
            }
        });
    }

    sendImportSuccessProgress(tab, text) {
        contextMenu.showProgress(false, tab);
        var info = {};
        info.text1 = chrome.i18n.getMessage(text);
        info.type = InfoType.importOK;
        info.timeout = 2000;
        this.showInfo(tab.id, info);
    }

    showInfo(tabId, info) {
        if (tabId === null || tabId === -1) {
            this.getActiveTab((t) => {
                this.sendMessage(t.id, null, { action: MessageKeys.showInfoTab, info: info });
            });
        }
        else {
            this.sendMessage(tabId, null, { action: MessageKeys.showInfoTab, info: info });
        }
    }

    showException(tab, exceptionObject, exceptionMessage) {
        if (exceptionObject.ignoreException) {
            return;
        }
        if (exceptionObject.exception == null) {
            exceptionObject = { exception: exceptionObject };
        }
        if (exceptionObject instanceof Error) {
            telemetry.error(exceptionObject);
        }
        else {
            if (isNullOrUndefined(exceptionMessage)) {
                exceptionMessage = "Unknown exception";
            }
            var error = new Error(exceptionMessage);
            telemetry.error(error, exceptionObject);
        }
        exceptionObject.sessionId = telemetry.sessionId;
        this.sendMessage(tab.id, null, { action: MessageKeys.showErrorTab, exception: exceptionObject });
    }

    getActiveTab(callback) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            callback(tabs[0]);
        });
    }

    show(tab, msg) {
        if (tab == null || tab.id == -1) {
            this.getActiveTab((t) => {
                if (t == null) return;
                this.show(t);
            });
            return;
        }
        if (!permissions.hasTabPermisson(tab)) return;

        if (msg == null) {
            msg = {};
            msg.action = MessageKeys.showPanel;
        }
        this.sendMessage(tab.id, tab.url, msg);
    }

    showTab(tab, name) {
        try {
            if (tab == null || tab.id == -1) {
                this.getActiveTab((t) => {
                    if (t == null) return;
                    this.showTab(t, name);
                });
                return;
            }
            if (!permissions.hasTabPermisson(tab)) {
                return;
            }

            var msg = {};
            msg.action = name;
            this.sendMessage(tab.id, tab.url, msg);
        }
        catch (e) {
            telemetry.error(e);
        }
    }

    toggle(tab) {
        
        if (!permissions.hasTabPermisson(tab))
        {
            if (tab.url.indexOf("file:///") != -1) {
                panel.sendImportSuccessProgress(tab, "ImportLocalFilesNotSupported");
                //msgBox.confirm("Keine Berechtigung? Ja? Nein?", (r) => {
                //    chrome.permissions.contains(
                //        { origins: ["file://*"] },
                //        function (granted) {
                //            if (chrome.runtime.lastError) {
                //                // The flag is not set
                //                // You need to explain it to the user and then show the page
                //                // You can open the page scrolled where you need it with the following:
                //                chrome.tabs.create({ url: "chrome://extensions?id=" + chrome.runtime.id });
                //                // Note that just a link won't work
                //            } else if (!granted) {
                //                // The flag is set, but the permissions are not yet granted
                //                // You need to call the next snippet FROM A USER GESTURE (e.g. click)
                //            } else {
                //                // Everything is peachy, you have the permissions
                //            }
                //        }
                //    );
                //    if (r) {
                //        chrome.permissions.request({
                //            origins: ["file://*"],
                //        }, function (granted) {
                //            if (granted) {
                //                alert("OK");
                //                chrome.permissions.remove({
                //                    origins: ["file://*"],
                //                }, function (removed) {
                //                    if (removed) {
                //                        alert("Removed");
                //                    }
                //                });
                //            } else {
                //                alert("Not OK");
                //            }
                //        });
                //    }
                //});
            }
            return;
        }
        var msg = {};
        msg.action = MessageKeys.togglePanel;
        this.sendMessage(tab.id, tab.url, msg);
    }
}