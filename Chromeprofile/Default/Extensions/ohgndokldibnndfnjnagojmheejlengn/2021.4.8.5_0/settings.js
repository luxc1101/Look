class Settings {

    constructor() {

        this._aiSeverityLevel = SeverityLevel.Error;
        this._aiSessionId = "";
        this._detectReferenceIdentifier = true;
        this._developerMode = false;
        this._aiInstrumentationKey = "96b182b2-9852-41fa-858f-26d5e0b50757";

        switch (runtimeInfo.id) {

            case "{7D762B66-0F0B-496E-B858-C21C8BD61AC8}":
            case "ndahmgeoecpnplkdnejnidmbbahoamkc":
            case "ebknlgmfnfjagpagnhhfecefabfdlolk":
            case "fneidadefimoalbgjnfgkcjpclpkbadf":
            case "iodenooodmoenkmdaobjmjanhcgdagln":
                {
                    this._buildType = BuildTypes.Alpha;
                }
                break;
            
            case "{F62CEE52-3D4B-495A-96F3-3E0B388C1793}":
            case "eaandldnbchhjimdfnaagaaidgebplgj":
            case "oojiepblieajfgppbooofighlmmabmjo":
                {
                    this._buildType = BuildTypes.Beta;
                }
                break;

            default:
            case "76eb1632-d2e9-4fff-8726-fdedaa0a745e":
            case "ohgndokldibnndfnjnagojmheejlengn":
            case "mielbhbkcliienpdicphhecpodcaeefg":
                {
                    this._buildType = BuildTypes.Release;
                }
                break;
        }

        this._autoShowDuplicateReference = false;
        this._enableHunter = true;
        this._enableTrace = false;
        this._importPdf = true;
        this._repo = "";
        this._projectKey = "";
        this._loaded = false;
        this._blacklist = [];
        this._blacklist_internal = [];
        this._blacklist_failed_rgx = [];
        this._lastLogin = "";

        this._citaviUICulture = null;
        this._proxyUrl = null;
        this._proxyName = null;
        this._citaviSettingsRepoType;
        this._newsPaperHtmlAsPdf = true;
        this._lookupBibliography = true;

        this._saveHtmlAnnotations = false;

        this._showProxyInfo = true;
    }

    get AIInstrumentationKey() {
        return this._aiInstrumentationKey;
    }

    get Authority() {
        switch (this._buildType) {
            case BuildTypes.Alpha:
                return "https://alphacitaviweb.citavi.com/";

            case BuildTypes.Beta:
                return "https://beta.citaviweb.citavi.com/";

            case BuildTypes.Release:
                return "https://citaviweb.citavi.com/";
        }
    }

    get autoShowDuplicateReference() {
        return this._autoShowDuplicateReference;
    }
    set autoShowDuplicateReference(val) {
        this._autoShowDuplicateReference = val;
        this.save(SettingNames.autoShowDuplicateReference, val);
    }

    get buildType() {
        return this._buildType;
    }
    set buildType(val) {
        this._buildType = val;
        this.save(SettingNames.buildType, val);
    }

    get citaviSettingsRepoType() {
        return this._citaviSettingsRepoType;
    }
    set citaviSettingsRepoType(val) {
        this._citaviSettingsRepoType = val;
    }

    get detectReferenceIdentifier() {
        return this._detectReferenceIdentifier;
    }
    set detectReferenceIdentifier(val) {
        this._detectReferenceIdentifier = val;
        this.save("detectReferenceIdentifier", val);
    }

    get developerMode() {
        return this._developerMode;
    }
    set developerMode(val) {
        this._developerMode = val;
        this.save(SettingNames.developerMode, val);
    }

    get citaviUICulture() {
        return this._citaviUICulture;
    }
    set citaviUICulture(val) {
        this._citaviUICulture = val;
    }

    get enableHunter() {
        return this._enableHunter;
    }
    set enableHunter(val) {
        this._enableHunter = val;
        this.save(SettingNames.enableHunter, val);
    }

    get newsPaperHtmlAsPdf() {
        return this._newsPaperHtmlAsPdf;
    }
    set newsPaperHtmlAsPdf(val) {
        this._newsPaperHtmlAsPdf = val;
        this.save(SettingNames.newsPaperHtmlAsPdf, val);
    }

    get lookupBibliography() {
        return this._lookupBibliography;
    }
    set lookupBibliography(val) {
        this._lookupBibliography = val;
        this.save(SettingNames.lookupBibliography, val);
    }

    get loaded() {
        return this._loaded;
    }

    get projectKey() {
        return this._projectKey;
    }
    set projectKey(val) {
        this._projectKey = val;
        this.save(SettingNames.projectKey, val);
    }

    get lastLogin() {
        return this._lastLogin;
    }
    set lastLogin(val) {
        this._lastLogin = val;
        this.save(SettingNames.lastLogin, val);
    }

    get repo() {
        return this._repo;
    }
    set repo(val) {
        this._repo = val;
        this.save(SettingNames.repo, val);
    }

    get saveHtmlAnnotations() {
        return this._saveHtmlAnnotations || this.developerMode;
    }
    set saveHtmlAnnotations(val) {
        this._saveHtmlAnnotations = val;
        this.save(SettingNames.saveHtmlAnnotations, val);
    }

    get showProxyInfo() {
        return this._showProxyInfo;
    }
    set showProxyInfo(value) {
        this._showProxyInfo = value;
    }

    get importPdf() {
        return this._importPdf;
    }
    set importPdf(val) {
        this._importPdf = val;
        this.save(SettingNames.importPdf, val);
    }

    get proxyName() {
        return this._proxyName;
    }
    set proxyName(val) {
        telemetry.log("ProxyName: " + val);
        this._proxyName = val;
        this.save(SettingNames.proxyName, val);
    }

    get proxyUrl() {
        return this._proxyUrl;
    }
    set proxyUrl(val) {
        telemetry.log("ProxyUrl: " + val);
        this._proxyUrl = val;
        this.save(SettingNames.proxyUrl, val);
    }

    get aiSeverityLevel() {
        if (isNullOrUndefined(this._aiSeverityLevel)) {
            this._aiSeverityLevel = SeverityLevel.None;
            this.save(SettingNames.aiSeverityLevel, SeverityLevel.None);
        }
        return this._aiSeverityLevel;
    }
    set aiSeverityLevel(val) {
        this._aiSeverityLevel = val;
        this.save(SettingNames.aiSeverityLevel, val);
        if (isNullOrEmpty(this.aiSessionId)) {
            this.aiSessionId = guid();
        }
    }

    get aiSessionId() {
        return this._aiSessionId;
    }
    set aiSessionId(sessionId){
        this._aiSessionId = sessionId;
        this.save(SettingNames.aiSessionId, sessionId);
        telemetry.sessionId = sessionId;
    }


    applyLegacySettings(settings) {
        if (this._loaded) return;
        if (settings == undefined) return;

        this.detectReferenceIdentifier = settings.DetectIsbnDoi;
        this.enableHunter = settings.EnableHunter;
    }

    applyLegacyBlacklist(urls) {
        if (urls == undefined) return;

        var self = this;
        urls.forEach((url) => self._blacklist.push(url));
    }

    clear() {
        chrome.storage.sync.clear();
    }

    isURLBlacklisted(url) {

        if (url === undefined) {
            return false;
        }
        if (url === null) {
            return false;
        }
        if (url === "") {
            return false;
        }

        for (var pattern of this._blacklist) {
            try {
                if (pattern === "") {
                    continue;
                }
                if (pattern === "*") {
                    continue;
                }
                if (isNullOrUndefined(pattern)) {
                    continue;
                }
                if (this._blacklist_failed_rgx.indexOf(pattern) !== -1) {
                    continue;
                }

                var rgx = new RegExp(pattern);
                if (rgx.test(url)) {
                    return true;
                }
            }
            catch (e) {
                this._blacklist_failed_rgx.push(pattern);
                telemetry.error(e, { pattern: pattern});
            }
        }
        for (var pattern of this._blacklist_internal) {
            try {
                var rgx = new RegExp(pattern);
                if (rgx.test(url)) {
                    return true;
                }
            }
            catch (e) {
                telemetry.error(e, { pattern: pattern });
            }
        }
        return false;
    }

    async load() {

        telemetry.log(`BuildType: ${this._buildType}, ExtensionId: ${runtimeInfo.id}`);

        return new Promise(resolve => {
            var props = [];
            for (var p in SettingNames) {
                props.push(p);
            }

            var self = this;
            chrome.storage.sync.get(props, (r) => {
                if (!isNullOrUndefined(chrome.runtime.lastError)) {
                    telemetry.error(chrome.runtime.lastError.message);
                }
                if (r != undefined) {
                    for (var key in r) {
                        self["_" + key] = r[key];
                    }
                    self._loaded = true;
                    if (self._aiSeverityLevel === SeverityLevel.Error && this._buildType === BuildTypes.Release) {
                        self._aiSeverityLevel = SeverityLevel.None;
                    }
                    telemetry.severityLevel = self._aiSeverityLevel;
                    if (telemetry.severityLevel !== SeverityLevel.Verbose) {
                        self._aiSessionId = guid();
                    }
                    telemetry.sessionId = self._aiSessionId;
                }

                resolve();
            });

            chrome.storage.onChanged.addListener((changes, areaName) => {
                for (var key in changes) {
                    telemetry.table(changes);
                    telemetry.log(`settings changed: ${key}`);
                    for (var key in changes) {
                        self["_" + key] = changes[key].newValue;
                    }
                }
            });

            this.loadInternalBlacklist();
        });
    }

    loadInternalBlacklist() {
        this._blacklist_internal.push("zfl2.hbz-nrw.de");
        this._blacklist_internal.push("siegen.de/cms/");
        this._blacklist_internal.push("email.uni-rostock.de");
        this._blacklist_internal.push("mail\\.");
        this._blacklist_internal.push("semesterbooks.de");
        this._blacklist_internal.push("banking.");
        this._blacklist_internal.push("typo3");
        this._blacklist_internal.push("docs.google");
        this._blacklist_internal.push("lss.sub.uni-hamburg.de");
        this._blacklist_internal.push("lss2.sub.uni-hamburg.de");
        this._blacklist_internal.push("academic-linkshare.de");
        this._blacklist_internal.push("imvr.uni-koeln.de");
        this._blacklist_internal.push("infodeskpro.");
        this._blacklist_internal.push("studip");
        this._blacklist_internal.push("milibib.de");
        this._blacklist_internal.push("facebook.com");
        this._blacklist_internal.push("twitter.com");
        this._blacklist_internal.push("imperia.");
        this._blacklist_internal.push("allsecur.de");
        this._blacklist_internal.push("mangospring.com");
        this._blacklist_internal.push("mangoapps.com");
        this._blacklist_internal.push("youtube.com");
        this._blacklist_internal.push("zimbra");
        this._blacklist_internal.push("wordpress.com");
        this._blacklist_internal.push("citavibackoffice");
        this._blacklist_internal.push("tfs");
        this._blacklist_internal.push("ebay");
        this._blacklist_internal.push("prtr.ec.europa.eu");
        this._blacklist_internal.push("olb.de");
        this._blacklist_internal.push("gmx");
        this._blacklist_internal.push("gmail");
        this._blacklist_internal.push("asana.com");
        this._blacklist_internal.push("postfinance");
        this._blacklist_internal.push("communicator.strato.de");
        this._blacklist_internal.push("garmin.com");
        this._blacklist_internal.push("bib-info.de");
        this._blacklist_internal.push("moodle.jade-hs.de");
        this._blacklist_internal.push("citaviweb");
        this._blacklist_internal.push("useresponse");
        this._blacklist_internal.push("help.citavi.com");
        this._blacklist_internal.push("support.citavi.com");
        this._blacklist_internal.push("azure.com");
        this._blacklist_internal.push("applicationinsights.io");
        this._blacklist_internal.push("dynamics.com");
        //this._blacklist_internal.push("localhost");
        this._blacklist_internal.push("wiki.k10plus");
        this._blacklist_internal.push("github.com");
        this._blacklist_internal.push("codebeautify.org");
    }

    save(propertyName, propertyValue) {
        telemetry.log(`save '${propertyName}': '${propertyValue}'`);
        var prop = {};
        prop[propertyName] = propertyValue;
        chrome.storage.sync.set(prop, () => {
            if (!isNullOrUndefined(chrome.runtime.lastError)) {
                telemetry.error(chrome.runtime.lastError.message);
            }
        });
    }
}