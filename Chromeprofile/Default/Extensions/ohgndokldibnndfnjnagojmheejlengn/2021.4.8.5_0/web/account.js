class CitaviAccount {

    constructor() {

        this.host = settings.Authority;
        telemetry.log("Authority: " + this.host);
        this.language = "";
        this.silentRenewUrl = chrome.runtime.getURL("web/_sr.html");
        this.oauth = new OAuth(this.host);
        this.userSettingsAccess = {};
        this.hub = new AblyHub();
        this.webAppInfo = {
            ok: false,
            featureVersion: "0",
            version: "0.0.0.0"
        };
    }

    get isLoggedIn() {
        return this.oauth.accessToken != undefined;
    }

    async get(name, projectKey, responseFormat = "json") {

        var headers = {};
        if (projectKey != undefined) {
            headers.projectKey = projectKey;
        }
        else if (settings.projectKey != undefined) {
            headers.projectKey = settings.projectKey;
        }

        this.updateHeaders(headers);

        let response = await fetch(this.host + "api/" + name, {
            method: 'get',
            headers: headers,
        });
        if (response.ok) {
            if (responseFormat == "json") {
                let data = await response.json();
                return data;
            }
            else {
                let text = await response.text();
                return text;
            }
        }
        else {
            var error = new Error(response.statusText);
            error.params = {
                name: name,
                projectKey: projectKey,
                status: response.status
            };
            if (response.status === 401) {
                this.oauth.onLoggedOut();
            }
            throw error;
        }
    }

    async put(access, blobName, content, contentType, fileName) {
        if (contentType == null) contentType = "text/plain";

        var headers_ = {
            'Content-Length': content.length,
            'x-ms-blob-type': 'BlockBlob',
            "Content-Type": contentType,
            "x-ms-blob-content-disposition": "attachment; filename=" + fileName
        };

        telemetry.log("Blob put", {blobName: blobName, headers: headers_ });

        let response = await fetch(access.Uri + "/" + blobName + access.SharedAccessSignature, {
            method: 'PUT',
            headers: headers_,
            body: content
        });

        if (!response.ok) {
            var error = new Error(response.status);
            error.params = { url: response.url, headers: JSON.stringify(headers_) };
            throw error;
        }
        return true;
    }

    async post(name, payload, headers) {

        var headers_ = {
            'content-type': 'application/json',
        };

        for (var header in headers) {
            headers_[header] = headers[header];
        }
        if (settings.projectKey != undefined) {
            headers_.projectKey = settings.projectKey;
        }

        this.updateHeaders(headers_);

        let response = await fetch(this.host + "api/" + name, {
            method: 'POST',
            headers: headers_,
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            var error = new Error(response.statusText);
            error.params = {
                code: response.status,
                api: response.url,
                payload: JSON.stringify(payload)
            };
            if (response.status === 401) {
                this.oauth.onLoggedOut();
            }
            throw error;
        }
        return response.ok;
    }

    async initialize() {
        try {
            await this.getWebAppInfo();

            telemetry.log("WebApp", this.webAppInfo);
            // this.webAppInfo.featureVersion === "0": SignalR
            // this.webAppInfo.featureVersion === "1": Ably
            // this.webAppInfo.featureVersion === "2": Ably neue Channels

            await this.getUserLookup();

            if (this.user == null) {
                return null;
            }

            await this.hub.initialize();
        }
        catch (e) {
            telemetry.error(e);
            this.oauth.logout();
            this.user = null;
        }
        return this.user;
    }

    async getProjectAccessTokens() {
        var projectKey = settings.projectKey;
        var projectRole = this.user.ProjectRoles.find((e) => e.ProjectKey == projectKey);
        if (projectRole.accessToken != null && projectRole.accessToken.expiry > Date.now()) {
            return projectRole.accessToken;
        }

        var response = await this.get("projectAccessTokens", projectKey);
        projectRole.accessToken = response;
        var expiry = new Date();
        expiry.setHours(expiry.getHours() + 23);
        projectRole.accessToken.expiry = expiry;
        return projectRole.accessToken;
    }

    async getProjectUserSettings(rowKey) {
        var access = await this.getProjectAccessTokens(settings.projectKey);
        return await this.getTableStorage(access.ProjectUserSettings, "ProjectUserSettings", `ProjectUserSettings_${rowKey}_1`);
    }

    async getUserLookup() {
        try {
            this.user = await this.get("getProfile");
            switch (this.user.Contact.Language) {
                case "German":
                    this.language = "de";
                    break;
                case "English":
                    this.language = "en";
                    break;
                case "French":
                    this.language = "fr";
                    break;
                case "Italian":
                    this.language = "it";
                    break;
                case "Polish":
                    this.language = "pl";
                    break;
                case "Portuguese":
                    this.language = "pt";
                    break;
                case "Spanish":
                    this.language = "es";
                    break;
            }

            await this.getProjects();

            try {
                this.user.image = await this.get("getCurrentUserImageAsBase64", null, "text");
                if (isNullOrEmpty(this.user.image)) {
                    delete this.user.image;
                }
                else {
                    this.user.image = this.user.image.replace(/^"|"$/g, '');
                }
            }
            catch (e)
            {
                telemetry.error(e);
            }

            var projectExists = false;
            if (settings.projectKey != undefined &&
                settings.projectKey != "") {

                for (var role of this.user.ProjectRoles) {
                    if (role.ProjectKey == settings.projectKey) {
                        projectExists = true;
                        break;
                    }
                }
                if (!projectExists) {
                    if (this.user.ProjectRoles.length > 0 && !localRepo.connected) {
                        settings.projectKey = this.user.ProjectRoles[0].ProjectKey;
                    }
                    else {
                        settings.projectKey = "";
                    }
                }
            }
            else if (this.user.ProjectRoles.length > 0 && !localRepo.connected) {
                settings.projectKey = this.user.ProjectRoles[0].ProjectKey;
            }
        }
        catch (e) {
            telemetry.error(e);
            this.user = null;
        }
        return this.user;
    }

    async getProjects() {
        var result = await this.get("GetProjectRoles");
        var projectRoles = [];
        for (var projectRole of result) {
            if (projectRole.ProjectRoleType === "Author") {
                continue;
            }
            projectRoles.push(projectRole);
        }
        projectRoles = projectRoles.sort((a, b) => a.ProjectName.localeCompare(b.ProjectName));
        this.user.ProjectRoles = projectRoles;
    }

    async getUserSettings(rowKey) {
        var access = await this.getProjectAccessTokens(settings.projectKey);
        return await this.getTableStorage(access.UserSettings, "UserSettings", `UserSettings_${rowKey}_1`);
    }

    async getUserSettingsAccess() {
        if (this.userSettingsAccess.expiry > Date.now()) {
            return this.userSettingsAccess;
        }
        var response = await this.get("accountLookups");
        this.userSettingsAccess = response.UserSettingsAccessData;
        var expiry = new Date();
        expiry.setHours(expiry.getHours() + 23);
        this.userSettingsAccess.expiry = expiry;
        return this.userSettingsAccess;
    }

    async getUserSettings(partitionKey, rowKey) {
        var access = await this.getUserSettingsAccess();
        return await this.getTableStorage(access, partitionKey, rowKey);
    }

    async getTemoraryContainer() {
        return await this.get("GetTemporaryContainer", settings.projectKey);
    }

    async getTableStorage(access, partitionKey, rowKey) {
        var url = access.Uri + access.SharedAccessSignature;
        url += "&$filter=(RowKey eq '" + rowKey + "')&$select=RowKey,Value";
        var headers = {
            'Accept': 'application/json;odata=nometadata'
        };
        var response = await fetch(url, {
            method: "GET",
            headers: headers
        });

        return await response.json();
    }

    async getWebAppInfo() {
        try {

            if (this.webAppInfo.ok) {
                return true;
            }

            var response = await fetch(this.host + "serviceAvailable.ashx");
            var json = await response.json();
            if (json.result === "ok") {
                this.webAppInfo.ok = true;
                if (json.f) {
                    this.webAppInfo.featureVersion = json.f;
                }
                if (json.v) {
                    this.webAppInfo.version = json.v;
                }
                telemetry.log("webapp featureVersion: " + this.webAppInfo.featureVersion);
                telemetry.log("webapp version: " + this.webAppInfo.version);
            }
        }
        catch (e) {
            telemetry.error(e);
            return "0.0.0.0";
        }
        return this.webAppInfo.ok;
    }

    async saveChanges(referenceId, fld, value) {
        telemetry.log("save changes", { field: fld, val: value, reference: referenceId });

        var reference;
        if (referenceId !== null) {
            reference = (await this.get(`CitaviEntities?subset=ReferenceContent&id=${referenceId}`)).entity;
            value = value.trim();
        }

        var bundle = {};
        bundle.entities = [];
        var id = null;
        switch (fld.toLowerCase()) {
            case "abstract":
                {
                    var existing = reference.Abstract == undefined ? "" : reference.Abstract;
                    var referenceBdl = {
                        Id: referenceId,
                        Abstract: existing + "<div>" + toHtml(value) + "</div>",
                        AbstractSourceTextFormat: "html",
                        entityAspect: {
                            entityState: "Modified",
                            entityTypeName: "Reference:#SwissAcademic.Citavi",
                            defaultResourceName: "References",
                            originalValuesMap: {
                                Abstract: existing,
                                AbstractSourceTextFormat: reference.AbstractSourceTextFormat == undefined ? "" : reference.AbstractSourceTextFormat,
                            },
                        },
                    };
                    bundle.entities.push(referenceBdl);
                }
                break;

            case "keywords":
                {
                    id = guid();
                    if (reference.KeywordsIds == undefined) reference.KeywordsIds = "";

                    var referenceBdl = {
                        Id: referenceId,
                        KeywordsIds: reference.KeywordsIds == "" ? id : reference.KeywordsIds  + ";" + id,
                        entityAspect: {
                            entityState: "Modified",
                            entityTypeName: "Reference:#SwissAcademic.Citavi",
                            defaultResourceName: "References",
                            originalValuesMap: {
                                KeywordsIds: reference.KeywordsIds
                            },
                        },
                    };
                    var keywordBdl = {
                        Id: id,
                        CloudProjectSubset: "KeywordFull",
                        CreatedBy: this.user.Contact.Key,
                        CreatedByUser: true,
                        entityAspect: {
                            entityState: "Added",
                            entityTypeName: "Keyword:#SwissAcademic.Citavi",
                            defaultResourceName: "Keywords",
                            originalValuesMap: {
                                
                            },
                        },
                        EntityState: "Added",
                        Name: value
                    };
                    
                    bundle.entities.push(referenceBdl);
                    bundle.entities.push(keywordBdl);
                }
                break;

            case "importgroups":
                {
                    var groupBdl = {
                        Id: value.groupId,
                        CloudProjectSubset: "ImportGroupFull",
                        ReferenceIds: value.referenceIds,
                        CreatedBy: this.user.Contact.Key,
                        CreatedByUser: true,
                        entityAspect: {
                            entityState: "Added",
                            entityTypeName: "ImportGroup:#SwissAcademic.Citavi",
                            defaultResourceName: "ImportGroups",
                            originalValuesMap: {

                            },
                        },
                        EntityState: "Added",
                        ImportGroupType: "Picker"
                    };
                    bundle.entities.push(groupBdl);
                }
                break;

            case "quotationtext":
                {
                    id = guid();
                    var coreStatement = value;
                    var words = value.split(' ').map(m => m.replace(/\r?\n|\r/g, " ").replace(/\s+/g, " "));
                    if (words.length > 8) {
                        words.length = 8;
                        coreStatement = words.join(" ").trim() + "…";
                    }
                    var quotationBdl = {
                        Id: id,
                        Address: {
                            LinkedResourceType: "Empty"
                        },
                        CoreStatement: coreStatement,
                        CoreStatementUpdateType: "Manual",
                        CloudProjectSubset: "KnowledgeItemEdit",
                        CreatedBy: this.user.Contact.Key,
                        CreatedByUser: true,
                        entityAspect: {
                            entityState: "Added",
                            entityTypeName: "KnowledgeItem:#SwissAcademic.Citavi",
                            defaultResourceName: "KnowledgeItems",
                            originalValuesMap: {

                            },
                        },
                        EntityState: "Added",
                        KnowledgeItemType: "Text",
                        QuotationIndex: 0,
                        QuotationType: "DirectQuotation",
                        ReferenceId: referenceId,
                        TextComplexity: 0,
                        TextSourceTextFormat: "Text",
                        PageRangeNumeralSystem: "Arabic",
                        Text: value
                    };

                    bundle.entities.push(quotationBdl);
                }
                break;

            case "quotationfile":
                {
                    id = guid();
                    var coreStatement = value;
                    var words = value.split(' ').map(m => m.replace(/\r?\n|\r/g, " ").replace(/\s+/g, " "));
                    if (words.length > 8) {
                        words.length = 8;
                        coreStatement = words.join(" ").trim() + "…";
                    }
                    var quotationBdl = {
                        Id: id,
                        Address: {
                            LinkedResourceType: "Empty"
                        },
                        CoreStatement: coreStatement,
                        CoreStatementUpdateType: "Manual",
                        CloudProjectSubset: "KnowledgeItemEdit",
                        CreatedBy: this.user.Contact.Key,
                        CreatedByUser: true,
                        entityAspect: {
                            entityState: "Added",
                            entityTypeName: "KnowledgeItem:#SwissAcademic.Citavi",
                            defaultResourceName: "KnowledgeItems",
                            originalValuesMap: {

                            },
                        },
                        EntityState: "Added",
                        KnowledgeItemType: "File",
                        QuotationIndex: 0,
                        QuotationType: "None",
                        ReferenceId: referenceId,
                        TextComplexity: 0,
                        TextSourceTextFormat: "Text",
                        PageRangeNumeralSystem: "Arabic",
                        Text: value
                    };

                    bundle.entities.push(quotationBdl);
                }
                break;

            case "onlineaddress":
                {
                    id = guid();
                    var referenceBdl = {
                        Id: referenceId,
                        OnlineAddress: value,
                        entityAspect: {
                            entityState: "Modified",
                            entityTypeName: "Reference:#SwissAcademic.Citavi",
                            defaultResourceName: "References",
                            originalValuesMap: {
                                OnlineAddress: null
                            },
                        },
                    };

                    var linkedResourceBdl = {
                        Address: {
                            LinkedResourceType: "RemoteUri",
                            OriginalString: "",
                            UriString: value
                        },
                        AddressInfo: null,
                        CallNumber: null,
                        EntityState: "Added",
                        entityAspect: {
                            entityState: "Added",
                            entityTypeName: "Location:#SwissAcademic.Citavi",
                            defaultResourceName: "Locations",
                        },
                        originalValuesMap: {},
                        Id: id,
                        LibraryId: null,
                        LibraryName: null,
                        LocationType: "ElectronicAddress",
                        MirrorsReferencePropertyId: "OnlineAddress",
                        Notes: null,
                        ReferenceId: referenceId
                    };
                    
                    bundle.entities.push(referenceBdl);
                    bundle.entities.push(linkedResourceBdl);
                }
                break;

            case "tableofcontents":
                {
                    var existing = reference.TableOfContents == undefined ? "" : reference.TableOfContents;
                    var referenceBdl = {
                        Id: referenceId,
                        TableOfContents: existing + "<div>" + toHtml(value) + "</div>",
                        TableOfContentsSourceTextFormat: "html",
                        entityAspect: {
                            entityState: "Modified",
                            entityTypeName: "Reference:#SwissAcademic.Citavi",
                            defaultResourceName: "References",
                            originalValuesMap: {
                                TableOfContents: existing,
                                TableOfContentsSourceTextFormat: reference.TableOfContentsSourceTextFormat == undefined ? null : reference.TableOfContentsSourceTextFormat,
                            },
                        },
                    };

                    bundle.entities.push(referenceBdl);
                }
                break;
        }

        if (bundle.entities.length == 0) {
            telemetry.warn(`bundle.entities.length == 0: ${fld}`);
            return { result: false, value: null };
        }

        bundle.entities.forEach(entity => entity.entityAspect.autoGeneratedKey = {
                propertyName: "Id",
                autoGeneratedKeyType: "Identity"
        });

        bundle.saveOptions = {
            tag: {
                keyedEntityConflictHandling: "Handle",
                ignoreChangesetMismatch: "true"
            }
        };

        var ok = await this.post("saveChanges", bundle);
        return { result: ok, value: id };
    }

    async setProjectUserSettings(rowKey, value) {
        var access = await this.getProjectAccessTokens(settings.projectKey);
         return await this.setTableStorage(access.ProjectUserSettings, this.user.Contact.Key, "ProjectUserSettings", `${rowKey}`, value);
    }

    async setTableStorage(access, partitionKey, settingsClassName, settingName, value) {
        var url = access.Uri;
        url += `(PartitionKey='${partitionKey}',RowKey='${settingsClassName}_${settingName}_1')` + access.SharedAccessSignature;
        var headers = {
            'content-type': 'application/json',
        };
        var payload = {
            SettingsName: settingName,
            Value: value,
            Version: 1
        };
        var response = await fetch(url, {
            method: "PUT",
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(response.statusText);
        }
        return true;
    }

    updateHeaders(headers) {
        headers.Authorization = 'Bearer ' + this.oauth.accessToken;
        headers.SessionId = settings.aiSessionId;
        headers.TelemetryScope = settings.aiSeverityLevel.toString();
        headers.ClientVersion = runtimeInfo.pickerVersion;
        headers.Client = runtimeInfo.id;
        headers.ClientType = runtimeInfo.browserName + " Picker";

        try {
            if (this.language === "") {
                headers.Language = window.navigator.languages[0];
            }
            else {
                headers.Language = this.language;
            }
        }
        catch (e) {
            console.error(e);
        }
    }

    onRenewAccessToken() {
        this.hub.updateAccessToken(this.oauth.accessToken);
    }
}