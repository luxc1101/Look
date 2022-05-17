class CitaviPicker {

    constructor() {
        this.sessionId = guid();
    }

    addRepo(repo) {
        if (repo.isLocal) this._localRepo = repo;
        else if (repo.isWeb) this._webRepo = repo;
        else throw "Unknown repository " + repo.type;
    }

    set activeRepo(repo) {
        this._activeRepo = repo;
    }

    get activeRepo() {
        if (this._activeRepo != null) return this._activeRepo;
        if (this._webRepo != null && this._webRepo.connected) return this._webRepo;
        if (this._localRepo != null && this._localRepo.connected) return this._localRepo;

        return this._webRepo;
    }

    get isLocal() {
        return this.activeRepo.isLocal;
    }

    async changeRepo(type) {

        if (isNullOrUndefined(type)) {
            telemetry.warn("Change repo called with undefined type");
            return;
        }

        if (type == Constants.LocalRepo) {
            this._activeRepo = this._localRepo;
        }
        else {
            this._activeRepo = this._webRepo;
        }

        await this.loadCitaviSettings();

        if (settings.repo == type) {
            return;
        }

        settings.repo = type;
        panel.broadcast(MessageKeys.onRepoChanged);
    }

    async citaviIsRunning(showMsgBox, callback) {
        if (this.activeRepo.isWeb) {
            if (callback) callback(true);
            return true;
        }
        if (callback) {
            var response = await this._localRepo.isCitaviRunning(showMsgBox);
            if (callback) callback(response);
        }
        else {
            return this._localRepo.isCitaviRunning(showMsgBox);
        }
    }

    async download(tabId, url, asBase64, downloadFileType) {
        if (downloadFileType == DownloadFileType.Pdf) {
            var result = await pdfLookup.resolveUrl(url);
            url = result.url;
        }
        else if (downloadFileType == DownloadFileType.Cover) {
            url = await coverLookup.resolveUrl(url);
        }
        var resp = await fetch2(url);
        if (!resp.ok) {
            return new Promise(resolve => {
                chrome.tabs.sendMessage(tabId, { action: MessageKeys.downloadPdf, url: url, asBase64: asBase64 }, async r => {
                    if (r.action === "redirect") {
                        resp = await fetch2(r.url);
                        if (resp.ok) {
                            var d = new Analyser();
                            d.downloadPdf(r.url, asBase64, resolve);
                        }
                        else {
                            resolve({ data: null, fileType: "unknown" });
                        }
                    }
                    else {
                        resolve(r);
                    }
                });
            });
        }
        else {
            return new Promise(resolve => {
                var d = new Analyser();
                d.downloadPdf(url, asBase64, async r => {
                    if (r.action === "redirect") {
                        resp = await fetch2(r.url);
                        if (resp.ok) {
                            d.downloadPdf(r.url, asBase64, resolve);
                        }
                        else {
                            resolve({ data: null, fileType: "unknown" });
                        }
                    }
                    else {
                        resolve(r);
                    }
                });
            });
        }
    }

    async download2(tabId, url, asBase64) {
        if (url.indexOf("http:") != -1) {
            var resp = await fetch2(url);
            if (!resp.ok) {
                return new Promise(resolve => {
                    chrome.tabs.sendMessage(tabId, { action: MessageKeys.downloadPdf, url: url, asBase64: asBase64 }, r => {
                        resolve(r);
                    });
                });
            }
            else {
                return new Promise(resolve => {
                    var d = new Analyser();
                    d.downloadPdf(url, asBase64, resolve);
                });
            }
        }
        else {
            telemetry.log("Download via contentscript: " + url);
            return new Promise(resolve => {
                chrome.tabs.sendMessage(tabId, { action: MessageKeys.downloadPdf, url: url, asBase64: asBase64 }, r => {
                    resolve(r);
                });
            });
        }
    }

    async getCitaviSettings(settingNames) {
        try {
            if (isNullOrUndefined(settingNames)) return null;

            var settings = await this.activeRepo.getCitaviSettings(settingNames);
            if (settingNames === "OpenUrl") {
                return settings;
            }
            if (settings == null) return null;
            if (settings.value == null) return null;

            return settings.value.split("|");
        }
        catch (e) {
            telemetry.error(e);
            return null;
        }
    }

    async getIsbnTransformers() {
        var list = [];
        try {
            var transformers = await this.activeRepo.getIsbnTransformers();

            if (isNullOrUndefined(transformers) ||
                transformers.value == 0) {
                telemetry.warn("getIsbnTransformers failed - use default transformers");
                if (settings.citaviUICulture === "de") {
                    list = [
                        {
                            "Id": "b7978129-4fcd-4112-a462-26bfed698a9f", "DisplayName": "GBV Gemeinsamer Bibliotheksverbund", "Username": "", "Password": "", "Group": ""
                        },
                        {
                            "Id": "5fb9465a-e25b-4941-a8fb-1a97bf142413", "DisplayName": "Library of Congress", "Username": "", "Password": "", "Group": ""
                        }
                    ];
                }
                else {
                    list = [
                        {
                            "Id": "5fb9465a-e25b-4941-a8fb-1a97bf142413", "DisplayName": "Library of Congress", "Username": "", "Password": "", "Group": ""
                        }
                    ];
                }
                return list;
            }
            
            for (var transformer of transformers) {
                if (transformer === null) {
                    telemetry.warn("getIsbnTransformers: transformer is null");
                    continue;
                }

                if (list.find((t) => t.Id == transformer.Id) != undefined) continue;
                list.push(transformer);
            }
        }
        catch (e) {
            telemetry.error(e, transformers);
        }
        return list;
    }

    async html2Pdf(tab, reference) {
        try {
            if (!reference.importHtmlAsPdf) {
                return null;
            }
            var html2Pdf = new Html2Pdf();
            return await html2Pdf.saveWebPageAsPdf(tab, citaviPicker.activeRepo.isLocal, reference);
        }
        catch (e) {
            telemetry.error(e);
        }
        return null;
    }

    async identifierExists(identifier, showMsgBox, tab) {
        if (!this.validate()) return null;
        try {
            var response = await this.activeRepo.identifierExists([identifier]);
            if (response == null) {
                return false;
            }
            if (response[0] == null) {
                return false;
            }
            if (response[0].exists) {
                if (settings.autoShowDuplicateReference) {
                    telemetry.log("reference identifier exists, show reference in citavi. skip info panel");
                    this.showCitaviEntity(identifier);
                }
                else if (showMsgBox) {
                    var alertMsg = "";
                    if (identifier.type == ReferenceIdentifierType.Isbn) {
                        alertMsg = "AlreadyInProject_ISBN";
                    }
                    else if (identifier.type == ReferenceIdentifierType.PmcId ||
                        identifier.type == ReferenceIdentifierType.PubMedId) {
                        alertMsg = "AlreadyInProject_PMID";
                    }
                    else {
                        alertMsg = "AlreadyInProject_DOI";
                    }
                    var info = {};
                    info.type = InfoType.identifierExists;
                    info.identifier = identifier;
                    info.text1 = chrome.i18n.getMessage(alertMsg);
                    panel.showInfo(tab.id, info);
                }

            }
            return response[0];
        }
        catch (e) {
            telemetry.error(e);
            return false;
        }
    }
    async identifiersExists(identifiers) {
        if (!this.validate()) return null;
        try {
            var response = await this.activeRepo.identifierExists(identifiers);
            return response;
        }
        catch (e) {
            telemetry.error(e);
            return null;
        }
    }

    async loadCitaviSettings() {
        try {
            if (settings.citaviSettingsRepoType === settings.repo) {
                return;
            }
            if (this._activeRepo === undefined) {
                return;
            }
            if (!this._activeRepo.connected) {
                return;
            }
            settings.citaviSettingsRepoType = settings.repo;

            var proxy = await this.getCitaviSettings("EZProxy");
            if (proxy == null || proxy.length == 0) {
                settings.proxyUrl = "";
                settings.proxyName = "";
            }
            else {
                if (settings.proxyUrl !== proxy[0]) {
                    settings.proxyUrl = proxy[0];
                    var openUrl = await this.getCitaviSettings("OpenUrl");
                    if (openUrl != null) {
                        settings.proxyName = openUrl.Name;
                    }
                }

                if (isNullOrEmpty(settings.proxyName) &&
                    settings.repo.isLocal &&
                    !settings.repo.isCitavi68OrNewer) {
                    var openUrl = await this.getCitaviSettings("OpenUrl");
                    if (openUrl != null) {
                        settings.proxyName = openUrl.Name;
                    }
                }

                if (settings.proxyName === "0") {
                    //7097
                    settings.proxyUrl = "";
                    settings.proxyName = "";
                }
            }

            var uiCulture = await this.getCitaviSettings("UICulture");
            if (uiCulture == null || uiCulture.length == 0 || uiCulture[0] === "0") {
                settings.citaviUICulture = "";
            }
            else {
                settings.citaviUICulture = uiCulture[0];
            }
        }
        catch (e) {
            telemetry.error(e);
        }
    }

    sendAttachment(bag) {
        if (!this.validate()) return null;
        try {
            telemetry.operationName = "SendAttachment";
            var result = this.activeRepo.sendAttachment(bag);
            if (!result) {
                telemetry.error("SendAttachment failed", { url: bag.url });
            }
            return result;
        }
        finally {
            telemetry.operationName = "";
        }
    }

    async sendCreateImportGroup(bag) {
        if (!this.validate()) return null;
        try {
            telemetry.operationName = "CreateImportGroup";
            return await this.activeRepo.sendCreateImportGroup(bag);
        }
        finally {
            telemetry.operationName = "";
        }
    }

    async sendImport(records, importFormat, filename, url, info) {
        //info enthält zusätzlich infos wie "completetitledateafterimport"
        if (!this.validate()) {
            return {
                success: false, msg2: "activeRepo.connected === false" };
        }
        try {
            telemetry.operationName = "ImportReferences";

            if (importFormat == null) {
                importFormat = "xml";
            }
            return await this.activeRepo.sendImport(records, importFormat, filename, url, info);
        }
        finally {
            telemetry.operationName = "";
        }
    }

    async sendTitledata(bag) {
        
        if (!this.validate()) return null;
        try {
            telemetry.operationName = "ImportTitledata";
            //bag: { fld: "QuotationText", data: text, referenceId: referenceId, projectKey: projectKey, url: tab.url }

            return await this.activeRepo.sendTitledata(bag);
        }
        catch (e) {
            telemetry.error(e);
        }
        finally {
            telemetry.operationName = "";
        }
    }

    showCitaviEntity(identifier) {
        if (!this.validate()) return null;

        return this.activeRepo.showCitaviEntity(identifier);
    }

    startCitavi() {
        return this.activeRepo.startCitavi();
    }

    validate(openPanelIfNotRunning) {
        if (!this.activeRepo.connected) {
            if (openPanelIfNotRunning) {
                panel.show(null);
            }
            return false;
        }
        return true;
    }
}


