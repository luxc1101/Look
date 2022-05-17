class LocalRepo extends Repo {

    constructor() {
        super(Constants.LocalRepo);
        this.portName = 'com.citavi.picker';
        this.connected = undefined;
        this.version = undefined;
        this._isCitavi62OrNewer = false;
        this._isCitavi64OrNewer = false;
        this._isCitavi65OrNewer = false;
        this._isCitavi68OrNewer = false;
        this.isCitavi5 = false;
        this._lastRunningCheck = 
        {
            isRunning: false,
            time: Date.now()
        };
    }

    get isCitavi62OrNewer() {
        return this._isCitavi62OrNewer;
    }
    get isCitavi64OrNewer() {
        return this._isCitavi64OrNewer;
    }
    get isCitavi65OrNewer() {
        return this._isCitavi65OrNewer;
    }
    get isCitavi68OrNewer() {
        return this._isCitavi68OrNewer;
    }

    async importPdfBase64(source, type) {
        var response = await this.isCitaviRunning(true);
        if (!response) {
            return false;
        }

        //Add zero-terminating char
        source = source + '\0';
        response = await this.send("CreateNewReference", type, source);
        return true;
    }

    getIsbnTransformers() {
        return this.send("GetIsbnTransformers", "", "");
    }

    async getCitaviSettings(settingNames) {
        if (!this._isCitavi64OrNewer) {
            return "";
        }
        console.log(settingNames);
        if (settingNames === "OpenUrl") {
            var response = await this.send("GetCitaviSettings", "SettingNames", "OpenUrlId");
            if (response) {
                var backOfficeResponse = await backoffice.getOpenUrlInfo(response[0]);
                var json = await backOfficeResponse.json();
                var openUrlInfo = json[0];
                if (openUrlInfo.EzProxyUrl != null) {
                    return openUrlInfo;
                }
            }
        }
        else if (settingNames === "EZProxy") {
            var ezproxy = await this.send("GetCitaviSettings", "SettingNames", settingNames);
            return ezproxy;
        }
        else {
            return this.send("GetCitaviSettings", "SettingNames", settingNames);
        }
    }

    async init() {
        try {

            var response = await this.send("Handshake", "", "");
            if (response != null) {
                this.connected = true;
                if (response.value != null) {
                    this.version = response.value;
                }

                response = await this.send("GetSettings", "", "");
                if (response != null) settings.applyLegacySettings(response);

                response = await this.send("GetURLBlacklist", "", "");
                if (response != null) settings.applyLegacyBlacklist(response);
            }
            else {
                this.connected = false;
            }
            if (!isNullOrUndefined(chrome.runtime.lastError)) {
                telemetry.error(chrome.runtime.lastError.message);
                this.connected = false;
            }
        }
        catch (e) {
            this.connected = false;
        }
        if (this.connected) {

            telemetry.log("broker version: " + this.version);

            var major = this.version.split('.')[0];
            if (major > 2015 || major < 6) {
                this.isCitavi5 = true;
            }
            else {
                this.isCitavi5 = false;
            }

            if (this.isCitavi5) {
                this.version_major = 5;
            }
            else {
                this.version_major = parseInt(major);
            }

            if (this.version_major == 5) {
                this._isCitavi62OrNewer = false;
                this._isCitavi64OrNewer = false;
                this._isCitavi65OrNewer = false;
            }
            else {
                this._isCitavi62OrNewer = isNewerOrEqualVersion(this.version, "6.2.0.0");
                this._isCitavi64OrNewer = isNewerOrEqualVersion(this.version, "6.4.0.0");
                this._isCitavi65OrNewer = isNewerOrEqualVersion(this.version, "6.5.1.0");
                this._isCitavi68OrNewer = isNewerOrEqualVersion(this.version, "6.8.0.0");
            }
        }
    }

    async isCitaviRunning(openPanelIfNotRunning) {

        if (this._lastRunningCheck.isRunning && Date.now() - this._lastRunningCheck.time < 5000) {
            this._lastRunningCheck.time = Date.now();
            return true;
        }

        this._lastRunningCheck.time = Date.now();

        if (this._isCitavi65OrNewer) {
            var response = await this.send("GetProjects", "", "");
            if (response === null || response === "") {
                if (openPanelIfNotRunning) {
                    panel.show(null);
                }
                this._lastRunningCheck.isRunning = false;
                return false;
            }
            for (var project of response) {
                telemetry.log(`Project: ${project.Name} (${project.Type})`);
            }
            this._lastRunningCheck.isRunning = response.length > 0;
            return this._lastRunningCheck.isRunning;
        }
        else {
            var response = await this.send("GetCitaviRunningState", "", "");
            if (response == null ||
                response.value != "true") {
                if (openPanelIfNotRunning) {
                    panel.show(null);
                }
                this._lastRunningCheck.isRunning = false;
                return false;
            }
            this._lastRunningCheck.isRunning = response.value == "true";
            return this._lastRunningCheck.isRunning;
        }
    }

    async identifierExists(identifier) {
        if (!this.isCitavi62OrNewer) {
            try {
                for (var id of identifier) {
                    var result = await this.send("IsIdentifierAlreadyInProject", "", id.value);
                    if (isNullOrUndefined(result)) {
                        id.exists = false;
                    }
                    else {
                        id.exists = result.value == "true";
                    }
                    id.id = id.value;
                }
            }
            catch (e) {
                telemetry.error(e);
            }
            return identifier;
        }
        return await this.send("IsIdentifierAlreadyInProjectExtended", "", JSON.stringify(identifier));
    }

    send(msg, field, value, referenceId) {
        return new Promise(resolve => {
            try {

                if (this.connected == false) {
                    resolve(null);
                    return;
                }
                var obj = {
                    msg: msg,
                    field: field,
                    value: value,
                    version: runtimeInfo.pickerVersion,
                    referenceId: referenceId
                };
                chrome.runtime.sendNativeMessage(this.portName, obj,
                    (response) => {

                        if (!isNullOrUndefined(chrome.runtime.lastError)) {
                            if (isNullOrUndefined(chrome.runtime.lastError.message)) {
                                telemetry.warn("SendNativeMessage failed", obj);
                            }
                            else {
                                telemetry.error(chrome.runtime.lastError, obj);
                            }
                            this.connected = false;
                            resolve(null);
                        }
                        else {
                            resolve(response);
                        }
                    }
                );


            }
            catch (e) {
                
                telemetry.warn(e);
                resolve(null);
            }
        });
    }

    async sendAttachment(bag) {
        var response = await this.isCitaviRunning(true);
        if (!response) {
            return false;
        }
        if (bag.attachmenType == AttachmentType.referenceAttachment) {
            return this.sendTitledata({ fld: "FileLink", data: "Base64Pdf:1|" + bag.data, referenceId: bag.referenceId })
        }
        else if (bag.attachmenType == AttachmentType.referenceCover) {
            return this.sendTitledata({ fld: "CoverFilePath", data: bag.data, referenceId: bag.referenceId });
        }
        else if (bag.attachmenType == AttachmentType.knowledgeItemAttachment) {
            return this.sendTitledata({ fld: "QuotationImage", data: bag.data, referenceId: bag.referenceId });
        }
    }

    async sendCreateImportGroup(bag) {
        var response = await this.isCitaviRunning(true);
        if (!response) {
            return false;
        }
        if (!this._isCitavi62OrNewer) {
            return false;
        }
        return await this.send("CreateImportGroup", "", bag.referenceIds);
    }

    async sendImport(records, importFormat) {
        var response = await this.isCitaviRunning(true);
        if (!response) {
            return { success: false, ignoreException: true };
        }
        if (importFormat === SimpleParser.COINS_ID) {
            importFormat = "coins";
        }
        if (this.isCitavi62OrNewer) {
            var result = await this.send("SendImportEx", importFormat, records);
            if (result == null) {
                return {};
            }
            return { referenceId: result.referenceId, success: true };
        }
        else {
            var result = await this.send("SendImport", importFormat, records);
            if (result == null) {
                return {};
            }
            return { success: true };
        }
        
    }

    async sendTitledata(bag) {
        var response = await this.isCitaviRunning(true);
        if (!response) {
            return false;
        }
        return await this.send("SendTitleData", bag.fld, bag.data, bag.referenceId);
    }

    showCitaviEntity(identifier) {
        if (this._isCitavi62OrNewer) {
            return this.send("ShowCitaviEntity", "", JSON.stringify({ type: "identifier", val: identifier }));
        }
        return this.send("ShowCitaviEntity", "", JSON.stringify({ type: "identifier", val: JSON.stringify(identifier) }));
    }

    startCitavi() {
        return this.send("RunCitavi", "", "");
    }
}