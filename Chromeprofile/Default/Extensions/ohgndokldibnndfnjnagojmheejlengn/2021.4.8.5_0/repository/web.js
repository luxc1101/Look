class WebRepo extends Repo {

    constructor() {
        super(Constants.WebRepo);
       
    }

    get connected() {
        return account.isLoggedIn;
    }

    get isCitavi62OrNewer() {
        return true;
    }

    async init() {
        
    }

    async identifierExists(identifier) {
        return [{ exists: false }];
    }

    buildBlobFileName(filename, contentType) {
        if (filename == null) filename = guid();

        filename = filename.normalize("NFKD");
        var combining = /[\u0300-\u036F]/g;
        filename = filename.normalize("NFKD").replace(combining, '');
        filename = filename.replace(/[^A-Za-z0-9\s-]/g, "");
        if (filename.length > 61) {
            filename = filename.substring(0, 56);
        }
        filename = filename.replace(/\s+/, " ");
        filename = filename.trim();

        telemetry.log(`filename: ${filename}`);
        telemetry.log(`content-type: ${contentType}`);

        switch (contentType) {
            case "application/pdf":
                filename += ".pdf";
                break;
            case "image/png":
                filename += ".png";
                break;
        }

        return filename;
    }

    async getLastReference() {
        try {
            var referenceId = await this.getLastReferenceId();
            var reference = (await account.get("CitaviEntities?subset=ReferenceTitle&id=" + referenceId)).entity;
            return reference;
        }
        catch (e) {
            telemetry.error(e);
        }
        return null;
    }

    async getLastReferenceId() {
        try {
            var response = await account.getProjectUserSettings("LastReferenceId");
            var referenceId = response.value[0].Value;
            telemetry.log(`Last referenceId: ${referenceId}`);
            return referenceId;
        }
        catch (e) {
            telemetry.error(e);
        }
        return null;
    }

    async getIsbnTransformers() {
        try {
            var response = await account.getUserSettings("DataExchangeSettings", "DataExchangeSettings_OnlineTransformerIsbnFavorites_1");
            if (isNullOrUndefined(response.value[0])) {
                telemetry.warn("getIsbnTransformers failed", response);
                return [];
            }
            var transformers = JSON.parse(response.value[0].Value);
            transformers.forEach((t) => t.DisplayName = t.Name);
            return transformers;
        }
        catch (e) {
            telemetry.error(e);
        }
        return [];
    }

    async getCitaviSettings(settingNames) {
        var result = "";
        try {

            if (!isNullOrUndefined(account.oauth.accessToken)) {
                for (var settingName of settingNames.split(';')) {
                    var val, response;

                    switch (settingName) {
                        case "EZProxy":
                            {
                                response = await account.getUserSettings("DataExchangeSettings", "DataExchangeSettings_EZProxyUrl_1");
                            }
                            break;

                        case "DateTimeFormat":
                            {
                                response = await account.getUserSettings("GeneralSettings", "GeneralSettings_DateTimeFormat_1");
                            }
                            break;

                        case "UICulture":
                            {
                                response = await account.getUserSettings("GeneralSettings", "GeneralSettings_UICulture_1");
                            }
                            break;

                        case "OpenUrl":
                            try {
                                var openUrlResponse = await account.getUserSettings("DataExchangeSettings", "DataExchangeSettings_OpenUrl_1");
                                var openUrl = JSON.parse(openUrlResponse.value[0].Value);
                                var backOfficeResponse = await backoffice.getOpenUrlInfo(openUrl.Id);
                                var openUrlInfo = (await backOfficeResponse.json())[0];
                                if (openUrlInfo.EzProxyUrl != null) {
                                    return openUrlInfo;
                                }
                            }
                            catch (e) {
                                console.error(e);
                            }
                            return null;
                    }

                    if (response.value == null ||
                        isNullOrUndefined(response.value[0]) ||
                        isNullOrUndefined(response.value[0].Value)) {
                        val = "";
                    }
                    else {
                        val = response.value[0].Value;
                    }

                    result += val + "|";
                }
            }
        }
        catch (e) {
            telemetry.error(e);
        }
        return { value: result };
    }

    async sendImport(content, importFormat, fileName, url, info) {
        var ok = await this.validate();
        if (!ok) {
            return { success: false, ignoreException: true };
        }
        return new Promise(async resolve => {
            var blobName = "";
            var temporaryKey = "";

            telemetry.log(content);

            var access = await account.getTemoraryContainer();
            blobName = guid();
            temporaryKey = access.ContainerName;
            var contentType = "text/plain";
            if (importFormat == "FACF60BD-23C4-4d82-9B33-D635011B0BC1") {
                contentType = "application/pdf";
            }
            else if (importFormat == "json" && content[0] == "{") {
                content = "[" + content + "]";
            }

            await account.put(access, blobName, content, contentType, this.buildBlobFileName(fileName, contentType));

            var fileNames = [];
            fileNames.push(blobName);
            var jobId = guid();
            var callback = account.hub.registerEvent(jobId, async (event, ticket) => {
                account.hub.unregisterEvent(jobId, callback);
                if (ticket.TaskStatus != "RanToCompletion") {
                    telemetry.error("Import failed", {
                        "TaskStatus": ticket.TaskStatus,
                        "JobId": jobId,
                        "Operation name": "Import",
                        "ImportFormat": importFormat,
                        "Url": url
                    });
                    resolve({ exception: ticket.TaskStatus, jobId: jobId });
                    return;
                }
                telemetry.log("Reference imported successfully", { ticket: ticket });
                try {
                    await this.setLastReferenceId(ticket.ReferenceId);
                }
                catch (e) {
                    //16.7.2020 Bug wg. StorageRedirector
                    telemetry.trackException(e);
                }
                resolve({ referenceId: ticket.ReferenceId, success: true });
            });

            var payload = {};
            payload[MessageKeys.jobId] = jobId;
            payload[account.hub.connectionIdMessageKey] = account.hub.id;
            if (importFormat != "xml" &&
                importFormat != "json") {
                payload[MessageKeys.transformerId] = importFormat;
            }
            payload[MessageKeys.temporaryKey] = temporaryKey;
            payload[MessageKeys.fileNames] = JSON.stringify(fileNames);
            payload[MessageKeys.operationId] = settings.aiSessionId;
            payload["ImportGroupType"] = "Picker";

            if (info && info.completeTitledataAfterImport) {
                payload["CompleteTitledataAfterImport"] = true;
            }

            telemetry.log("ImportReferences", { payload: payload });

            try {
                await account.post("importReferences?keyedEntityConflictHandling=Handle", payload, {});
            }
            catch (e) {
                resolve( { success: false, exception: e });
            }
        });
    }

    async sendAttachment(bag) {
        var ok = await this.validate();
        if (!ok) {
            return false;
        }
        return new Promise(async resolve => {
            try {

                var blobName = "";
                var temporaryKey = "";
                if (bag.blobName === undefined) {
                    var fileName = bag.title;
                    var access = await account.getTemoraryContainer();
                    blobName = guid();
                    var contentType = bag.contentType;
                    temporaryKey = access.ContainerName;
                    await account.put(access, blobName, bag.data, contentType, this.buildBlobFileName(fileName, contentType));
                }
                else {
                    blobName = bag.blobName;
                    temporaryKey = bag.temporaryKey;
                }

                var fileNames = [];
                fileNames.push(blobName);
                var jobId = guid();
                var callback = account.hub.registerEvent(jobId, async (event, ticket) => {
                    account.hub.unregisterEvent(jobId, callback);
                    if (ticket.TaskStatus != "RanToCompletion") {
                        telemetry.error("SendAttachment failed", { ticket: ticket });
                        resolve(false);
                        return;
                    }
                    telemetry.table(ticket);
                    resolve(true);
                });

                var referenceId = bag.referenceId;
                if (referenceId === undefined) {
                    referenceId = await this.getLastReferenceId();
                }

                var payload = {};
                payload[MessageKeys.jobId] = jobId;
                payload[account.hub.connectionIdMessageKey] = account.hub.id;
                payload[MessageKeys.temporaryKey] = temporaryKey;
                payload[MessageKeys.fileNames] = JSON.stringify(fileNames);
                payload[MessageKeys.uploadOperationType] = bag.attachmenType;

                if (bag.attachmenType === AttachmentType.knowledgeItemAttachment) {
                    payload[MessageKeys.referenceId] = referenceId;

                    var kn = await this.sendTitledata({
                        referenceId: referenceId,
                        fld: "quotationfile",
                        data: bag.title
                    });

                    payload[MessageKeys.entityId] = kn.value;
                }
                else {
                    payload[MessageKeys.entityId] = referenceId;
                    payload[MessageKeys.createCoverFromPdfAttachement] = 1;
                }

                telemetry.log("SendAttachment", { payload: payload });
                try {
                    await account.post("upload", payload, {});
                }
                catch (e) {
                    telemetry.error(e);
                    return false;
                }
            }
            catch (e) {
                telemetry.error(e);
                resolve(false);
            }
        });
    }

    async sendCreateImportGroup(bag) {
        var obj = {};
        obj.groupId = guid();
        obj.referenceIds = bag.referenceIds;
        var result = await account.saveChanges(null, "importgroups", obj);
        telemetry.log("Save changes", { result: result });
        return result;
    }

    async sendTitledata(bag) {
        var ok = await this.validate();
        if (!ok) {
            return { success: false, ignoreException: true };
        }
        var referenceId = bag.referenceId;
        if (isNullOrUndefined(referenceId)) {
            referenceId = await this.getLastReferenceId();
        }
        var result = await account.saveChanges(referenceId, bag.fld, bag.data);
        telemetry.log("Save changes", { result: result });
        return result;
    }

    async setLastReferenceId(referenceId) {
        telemetry.log("SetLastReferenceId", { referenceId: referenceId });
        return await account.setProjectUserSettings("LastReferenceId", referenceId);
    }

    showCitaviEntity(referenceId) {
        var win = window.open("https://www.citavi.com", '_blank');
        win.focus();
    }

    async uploadAttachmentInTempContainer(bag) {
        var fileName = bag.title;
        var access = await account.getTemoraryContainer();
        var blobName = guid();
        var contentType = bag.contentType;

        await account.put(access, blobName, bag.data, contentType, this.buildBlobFileName(fileName, contentType));

        bag.blobName = blobName;
        bag.temporaryKey = access.ContainerName;
    }

    async validate() {
        if (settings.projectKey === undefined ||
            isNullOrEmpty(settings.projectKey)) {
            try {
                telemetry.warn("projectKey is undefined. fetch user details");
                await account.getUserLookup();
                if (settings.projectKey === undefined ||
                    isNullOrEmpty(settings.projectKey)) {
                    telemetry.warn("projectKey is undefined");
                    return false;
                }
                telemetry.log("fetch user details ok. projectKey: " + settings.projectKey);
            }
            catch (e) {
                telemetry.error(e);
            }
        }
        await account.hub.validate();
        return true;
    }
}