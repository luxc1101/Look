class FrameEngine {
    constructor() {
        this._docInfo = {};
    }

    initialize() {

        this.timeout_close_1 = null;
        this.timeout_close_2 = null;

        this._parentOrigin = window.location.hash.substr(1);
        this._environment = {};
        this.currentProgress = { type: ProgressType.none };
        this._devClickCounter = 0;

        this.localize();
        this.importedReferences = [];

        window.addEventListener("message", (event) => {
            if (event.origin != engine.parentOrigin) {
                return;
            }
            this.onReceiveMessage(event);
        }, false);

        document.querySelectorAll(".textSelectionImport").forEach(g => {
            g.addEventListener("click", e => {
                var element = e.srcElement;
                var action = element.getAttribute("newReference") ? "textSelectionNewReference" : "textSelectionReference";
                var fld = element.getAttribute("fld");
                this.invokeContextMenu(action, fld);
            });
        });

        document.getElementById("textSelectionClipboardBtn").addEventListener("click", () => this.copyToClipboard());

        document.getElementById("startCitaviBtn").addEventListener("click", () => this.startCitavi());

        document.getElementById("headerBtnSettingsDiv").addEventListener("click", () => this.sendMessage({ action: MessageKeys.getSettings }, (s) => this.showSettings(s)));
        document.getElementById("headerBackBtn").addEventListener("click", () => this.showTab());

        document.getElementById("citaviWebLoginBtn").addEventListener("click", () => this.sendMessage(MessageKeys.login));
        document.getElementById("citaviWebLoginBtn2").addEventListener("click", () => this.sendMessage(MessageKeys.login));
        document.getElementById("projectSelectionBtnAccountLoginBtn").addEventListener("click", () => this.sendMessage(MessageKeys.login));
        document.getElementById("headerBtnHelpDiv").addEventListener("click", () => this.showHelp());

        document.getElementById("importHunterReferencesBtn").addEventListener("click", () => this.importHunterReferences(true));

        document.getElementById("headerAvatarDiv").addEventListener("click", () => ui.showAvatar());
        document.getElementById("noAccountImg").addEventListener("click", () => ui.showAvatar());

        document.getElementById("headerBtnProxyCancel").addEventListener("click", () => this.cancelProxy());

        document.getElementById("headerProjectsDiv").childNodes.forEach(e => e.addEventListener("click", () => {
            if (ui.activeTab == "projectSelectionTab") {
                this.showTab();
            }
            else {
                ui.showTab("projectSelectionTab");
            }
        }));

        document.getElementById("headerAvatarClosePanelDiv").addEventListener("click", () => this.postMessage(MessageKeys.hidePanel));

        document.getElementById("logout").addEventListener("click", () => this.sendMessage(MessageKeys.logout));

        document.getElementById("settingsTitle").addEventListener("click", (e) => {
            this._devClickCounter++;
            if (this._devClickCounter > 7) {
                this._devClickCounter = 0;
                this.sendMessage({ action: MessageKeys.setSettings, type: SettingNames.developerMode, value: !this.settings[SettingNames.developerMode] }, (r) => {
                    this.sendMessage({ action: MessageKeys.getSettings }, (s) => {
                        this.settings = s;
                        ui.showTab("settingsTab", this.settings);
                    });
                });
            }
        });

        document.getElementById("hunterSelectAllReferences").addEventListener("click", (e) => {
            var selectAll = e.srcElement.checked;
            document.querySelectorAll(".hunterreference").forEach(c => {
                if (c.classList.contains("is-selected") && !selectAll) {
                    return;
                }
                else if (!c.classList.contains("is-selected") && selectAll){
                    return;
                }
                c.click();
            });
        });

        document.getElementById("bibliographyImport_ImportSelectedReference").addEventListener("click", () => this.importHunterReferences(false));
        document.getElementById("bibliographyImport_ImportSelectedReferenceAndCitedReferences").addEventListener("click", () => this.lookupBibliography(true));
        document.getElementById("bibliographyImport_ImportSelectedReferenceAndCitedReferences2").addEventListener("click", () => this.lookupBibliography(false));

        document.getElementById("infoOkBtn").addEventListener("click", (e) => this.onInfoBtnClick(e));
        document.getElementById("infoLink").addEventListener("click", (e) => this.onInfoBtnClick(e));

        document.getElementById("sendTraceBtn").addEventListener("click", (e) => this.reportBug());
        document.getElementById("error_trace_Btn").addEventListener("click", (e) => this.showTraceTab());

        document.getElementById("headerBtnProxyDiv").addEventListener("click", (e) => this.proxyLogin());

        document.getElementById("takescreenshot").addEventListener("click", (e) => this.takeScreenshot());

        var CheckBoxElements = document.querySelectorAll(".ms-CheckBox");
        for (var i = 0; i < CheckBoxElements.length; i++) {
            new CheckBox(CheckBoxElements[i]);
        }

        this.initSettingsTab();

        this.initializeCustomButtons();
    }

    get parentOrigin() {
        return this._parentOrigin;
    }

    get docInfo() {
        if (this._docInfo == null) this._docInfo = {};
        return this._docInfo;
    }
    set docInfo(docInfo) {
        this._docInfo = docInfo;
    }

    get environment() {
        return this._environment;
    }
    set environment(env) {
        this._environment = env;
    }

    clearCloseTimeouts() {

        if (this.timeout_close_1 != null) {
            clearTimeout(this.timeout_close_1);
            this.timeout_close_1 = null;
        }
        if (this.timeout_close_2 != null) {
            clearTimeout(this.timeout_close_2);
            this.timeout_close_2 = null;
        }
    }

    clearProgress() {
        this.currentProgress = { type: ProgressType.none };
        this.showTab();
    }

    copyToClipboard() {

        var element = document.getElementById("textSelectionClipboardSuccess");
        element.className = "";
        var obj = { action: "textSelectionClipboard", fld: null, data: this.docInfo.textSelection };
        this.sendMessage({ action: MessageKeys.invokeContextMenuHnd, obj: obj }, () => {
            element.style.visibility = "visible";
            element.classList.add("fadeout-div");
            element.classList.add("fadeout-opacity");
        }
        );
    }

    cancelProxy() {
        engine.environment.proxyUrl = null;
        engine.environment.proxy = null;

        this.showTab();

        this.sendMessage({ action: MessageKeys.proxyCancel });
    }

    proxyLogin() {
        var url = this.environment.proxyUrl;
        if (isNullOrEmpty(url)) {
            return;
        }
        if (!isNullOrUndefined(engine.environment.proxy)) {
            return;
        }
        this.sendMessage({ action: MessageKeys.proxyLogin, url: url });
    }

    localize() {
        var elements = document.querySelectorAll('[i18n]');
        if (this.environment.isPdf) {
            for (var element of elements) {
                if (element.getAttribute("i18n-pdf") != null) {
                    element.innerHTML = chrome.i18n.getMessage(element.getAttribute("i18n-pdf"));
                }
                else {
                    element.innerHTML = chrome.i18n.getMessage(element.getAttribute("i18n"));
                }
            }
        }
        else {
            elements.forEach((element) => element.innerHTML = chrome.i18n.getMessage(element.getAttribute("i18n")));
        }

        document.getElementById("versionLabel").innerHTML = chrome.i18n.getMessage("VersionLabel") + runtimeInfo.pickerVersion;

        elements = document.querySelectorAll('[placeholderI18n]');
        elements.forEach((element) => element.placeholder = chrome.i18n.getMessage(element.getAttribute("placeholderI18n")));

        document.querySelectorAll(".pdfOnly").forEach((tab) => tab.style.display = this.environment.isPdf ? "block" : "none");
        document.querySelectorAll(".webpageOnly").forEach((tab) => tab.style.display = this.environment.isPdf ? "none" : "block");

        var isDev = runtimeInfo.id === "fneidadefimoalbgjnfgkcjpclpkbadf";
        var isAlpha = runtimeInfo.id === "ndahmgeoecpnplkdnejnidmbbahoamkc";

        document.querySelectorAll("[build=dev]").forEach((tab) => tab.style.display = isDev ? "block" : "none");
        document.querySelectorAll("[build=alpha]").forEach((tab) => tab.style.display = isDev || isAlpha ? "block" : "none");
    }

    lookupBibliography(directImport) {
        var reference = this.docInfo.references.filter(r => r.checked)[0];

        var jobId = MessageKeys.lookupBibliography + reference.id;
        document.getElementById("cancelImportLink").addEventListener("click", (e) => {
            this.sendMessage({ jobId: jobId, action: "cancel" });
            this.clearProgress();
            this.showTab();
        });

        this.sendMessage({ action: MessageKeys.lookupBibliography, obj: { jobId: jobId, reference: reference } }, (resp) => {
            if (resp.success) {
                reference.bibliography = resp.reference.bibliography;
                if (directImport) {
                    for (var bib_reference of reference.bibliography) {
                        bib_reference.checked = true;
                    }
                    this.importHunterReferences(false);

                }
                else {
                    this.clearProgress();
                    this.showTab();
                }
            }
            else {
                this.clearProgress();
                this.showTab();
            }
        });
    }

    invokeContextMenu(action, field) {
        var obj = { action: action, fld: field, data: this.docInfo.textSelection };
        if (action == "textSelectionNewReference") {
            return this.importWebPage(obj);
        }
        this.sendMessage({ action: MessageKeys.invokeContextMenuHnd, obj: obj });
    }

    importWebPage(obj) {
        if (obj == null) {
            obj = {
                action: "webPageAsNewReference",
                
            };
        }
        obj.isPdf = this.environment.isPdf;
        if (document.getElementById("htmlToPdfCustomWebsite") != null) {
            obj.importHtmlAsPdf = document.getElementById("htmlToPdfCustomWebsite").classList.contains("is-selected");
        }
        this.sendMessage({ action: MessageKeys.invokeContextMenuHnd, obj: obj });
    }

    importWebPageAsLocation(obj) {
        if (obj == null) {
            obj = { action: "webPageAsLocation" };
        }
        this.sendMessage({ action: MessageKeys.invokeContextMenuHnd, obj: obj });
    }

    importHunterReferences(withBibReferenceCheck) {
        var references = this.docInfo.references.filter(r => r.checked);
        if (this.docInfo.references.length === 1 &&
            this.docInfo.references[0].bibliography.length > 0) {
            var bib_references = this.docInfo.references[0].bibliography.filter(r => r.checked);
            references.push(...bib_references);
        }

        if (references == null ||
            references.length == 0) {
            return;
        }

        if (withBibReferenceCheck && references.length === 1 && references[0].bibliographyReferencesCount > 0 && this.docInfo.references[0].bibliography.length === 0) {
            this.showBibliopgraphyImportInfoTab(references[0]);
            return;
        }

        this.importedReferences = [];
        for (var r of references) {
            this.importedReferences.push(r.id);
        }

        this.currentProgress = {
            type: ProgressType.import
        };
        this.showProgress();
        this.sendMessage({ action: MessageKeys.importReferences, value: references, importFormat: references[0].importFormat }, (result) => {
            //this.clearProgress();
        });

    }

    initializeCustomButtons() {
        document.getElementById("webPageAsNewReferenceBtn").addEventListener("click", () => this.importWebPage());
        document.getElementById("addPdfAsLocalFileBtn").addEventListener("click", () => this.sendMessage({ action: MessageKeys.invokeContextMenuHnd, obj: { action: "addPdfAsLocalFile" } }));
        document.getElementById("webPageAsLocation").addEventListener("click", () => this.importWebPageAsLocation());
    };

    initSettingsTab() {
        var updateSettings = (name, val) => this.sendMessage({ action: MessageKeys.setSettings, type: name, value: val });
        document.getElementById("settingsReferenceIdentifierChkbox").addEventListener("change", (e) => { updateSettings(SettingNames.detectReferenceIdentifier, e.target.checked); });
        document.getElementById("settingsHunterChkbox").addEventListener("change", (e) => { updateSettings(SettingNames.enableHunter, e.target.checked); });
        document.getElementById("settingsImportPdfChkbox").addEventListener("change", (e) => { updateSettings(SettingNames.importPdf, e.target.checked); });
        document.getElementById("settingsLookupBibliographyChkbox").addEventListener("change", (e) => { updateSettings(SettingNames.lookupBibliography, e.target.checked); });
        document.getElementById("settingsAutoShowDuplicateReferenceChkbox").addEventListener("change", (e) => { updateSettings(SettingNames.autoShowDuplicateReference, e.target.checked); });

        document.getElementById("settingsEnableTraceChkbox").addEventListener("change", (e) => {
            var severityLevel = e.target.checked ? SeverityLevel.Verbose : SeverityLevel.None;
            if (e.target.checked) {
                updateSettings(SettingNames.aiSeverityLevel, severityLevel);
            }
            else {
                this.showTraceTab();
                updateSettings(SettingNames.aiSeverityLevel, severityLevel);
            }
        });

        document.getElementById("alreadyInProject_AutoShowReferenceChkbox").addEventListener("change", (e) => { updateSettings(SettingNames.autoShowDuplicateReference, e.target.checked); });
    }

    openAccount() {
        var win = window.open(this.environment.authority, '_blank');
        win.focus();
    }

    postMessage(msg, obj) {
        window.parent.postMessage({ action: msg, obj: obj }, this._parentOrigin);

    }

    reportBug() {
        try {
            var payload = {};
            payload["Email"] = document.getElementById("traceEmailTxtBx").value;
            payload["Name"] = document.getElementById("traceNameTxtBx").value;
            payload["Comment"] = document.getElementById("traceCommentTxtBx").value.replace("\n", "<br>");
            payload["SessionId"] = document.getElementById("sendTraceBtn").getAttribute("sessionId");

            if (isNullOrEmpty(payload["Email"])) return;
            if (isNullOrEmpty(payload["Name"])) return;

            document.getElementById("sendTraceBtn").disabled = true;

            this.sendMessage({ action: MessageKeys.reportBug, params: payload }, (success) => {
                document.getElementById("sendTraceInfoLbl").style.display = "block";
            });
        }
        catch (e) {
            telemetry.error(e);
        }
    }

    sendMessage(msg, callback) {
        try {
            if (callback == undefined) callback = () => { };
            chrome.runtime.sendMessage(msg, callback);
        }
        catch (e) {
            telemetry.error(e, msg.action);
        }
    }

    showBibliopgraphyImportInfoTab(reference) {

        var count = reference.bibliographyReferencesCount;
        var title = chrome.i18n.getMessage("Panel_BibliographyImportInfo_Title");
        title = title.replace("{0}", count);
        document.getElementById("bibliographyImportInfo_Title").textContent = title;
        ui.showTab("bibliographyImportInfoTab");
    }

    showTab() {

        this.clearCloseTimeouts();

        try {
            if (window.exception != undefined) {
                delete window.exception;
            }

            if (this.currentProgress.type != ProgressType.none) {
                this.showProgress();
                return;
            }

            if ((this.environment.account == null || this.environment.account.user == null)) {
                if (this.environment.localAvailable &&
                    this.environment.currentProject == null) {
                    if (!this.environment.citaviIsRunning) {
                        ui.showTab("citaviIsNotRunningTab");
                        return;
                    }
                }
            }

            if (!this.environment.citaviIsRunning &&
                this.environment.repo == Constants.LocalRepo &&
                this.environment.account !== null) {
                ui.showTab("projectSelectionTab");
                return;
            }

            if ((this.environment.account == null ||
                 this.environment.account.user == null) &&
                this.environment.repo == Constants.WebRepo) {
                ui.showTab("citaviWebLoginTab");
                return;
            }
            if (this.environment.currentProject == null &&
                this.environment.repo == Constants.WebRepo) {
                ui.showTab("projectSelectionTab");
                return;
            }

            if (this._docInfo != null &&
                this._docInfo.textSelection != null) {
                ui.showTab("textSelectionTab");

            }
            else if (this._docInfo != null &&
                     this._docInfo.hunter != null) {

                if (engine.docInfo.references == null) {
                    this.currentProgress = {
                        type: ProgressType.hunter
                    };
                    this.showProgress();
                }
                else {
                    ui.showTab("hunterTab");
                }
            }
            else {
                ui.showTab("noSelectionTab");
            }
        }
        catch (e) {

            telemetry.error(e);
            ui.showTab("citaviIsNotRunningTab");
        }
    }

    showTraceTab() {

        var sessionId = this.environment.sessionId;
        if (this.environment.account.user == null) {
            var lng = window.navigator.userLanguage || window.navigator.language;
            var url = "";
            switch (lng) {
                case "de-DE":
                    {
                        url = "https://www.citavi.com/sub/machform/view.php?id=132352&element_6=" + sessionId;
                    }
                    break;
                default:
                    {
                        url = "https://www.citavi.com/sub/machform/view.php?id=139375&element_6=" + sessionId;
                    }
                    break;
            }
            
            var win = window.open(url, '_blank');
            win.focus();
        }
        else {
            
            ui.showTab("traceTab", sessionId);
        }
    }

    showInfoTab(info) {

        if (info.timeout) {
            this.timeout_close_1 = setTimeout(() => {
                this.postMessage(MessageKeys.hidePanel);
            }, info.timeout);

            this.timeout_close_2 = setTimeout(() => {
                ui.activeTab == "";
                this.showTab();
            }, info.timeout + 500);
        }

       

        var lbl1 = document.getElementById("infoLbl");
        var btnImg = document.getElementById("infoOkBtn");
        lbl1.info = info;
        switch (info.type) {

            case InfoType.identifierExists:
                {
                    lbl1.innerText = info.text1;
                    btnImg.style.backgroundImage = "url(/images/process_failed.svg)";
                    ui.showElement(document.getElementById("infoLinkDiv"), true);
                    ui.showElement(document.getElementById("alreadyInProject_AutoShowReferenceDiv"), true);
                    ui.showElement(document.getElementById("loginInfo_Div"), false);
                }
                break;

            case InfoType.importOK:
                {
                    lbl1.innerText = info.text1;
                    btnImg.style.backgroundImage = "url(/images/okay_o.svg)";
                    ui.showElement(document.getElementById("infoLinkDiv"), false);
                    ui.showElement(document.getElementById("alreadyInProject_AutoShowReferenceDiv"), false);
                    ui.showElement(document.getElementById("loginInfo_Div"), false);
                }
                break;

            case InfoType.jstorNotLoggedIn:
                {
                    lbl1.innerText = chrome.i18n.getMessage("JSTORLoginInfo");
                    btnImg.style.backgroundImage = "url(/images/info_o.svg)";
                    ui.showElement(document.getElementById("infoLinkDiv"), false);
                    ui.showElement(document.getElementById("alreadyInProject_AutoShowReferenceDiv"), false);
                    ui.showElement(document.getElementById("loginInfo_Div"), true);
                    var lbl = document.getElementById("loginInfo_Div_link1");
                    lbl.innerText = chrome.i18n.getMessage("ImportWithoutPdfs");
                    lbl.addEventListener("click", (r) => {
                        this.showTab();
                    });

                    lbl = document.getElementById("loginInfo_Div_link2");
                    lbl.innerText = chrome.i18n.getMessage("Cancel");
                    lbl.addEventListener("click", (r) => {
                        this.postMessage(MessageKeys.hidePanel);
                    });
                }
                break;
        }


        this.currentProgress = { type: ProgressType.none };
        ui.showTab("infoTab");
    }

    showHelp() {
        window.open("https://www.citavi.com/picker", "_blank");
    }

    showSettings(settings) {
        this.settings = settings;
        if (ui.activeTab == "settingsTab") {
            this.showTab();
        }
        else {
            ui.showTab("settingsTab", settings);
        }
    }

    showProgress() {

        switch (this.currentProgress.type) {

            case ProgressType.addAttachment:
                {
                    ui.showProgress("");
                }
                break;

            case ProgressType.addText:
                {
                    ui.showProgress("");
                }
                break;

            case ProgressType.searchPdf:
                {
                    
                }
                break;

            case ProgressType.hunter:
                {
                    var title = chrome.i18n.getMessage("CitaviFoundReferencesToImportDirectly");
                    if (this.docInfo.hunter.referencesCount == 1) {
                        title = chrome.i18n.getMessage("CitaviFoundReferencesToImportDirectly");
                    }
                    title = title.replace("{0}", engine.docInfo.hunter.referencesCount);
                    ui.showProgress(title);
                }
                break;

            case ProgressType.import:
            case ProgressType.bibliographyReferencesImport:
                {
                    var text = this.currentProgress.text == null ? chrome.i18n.getMessage("ImportKindleReference") : this.currentProgress.text;
                    
                    if (this.environment.currentProject === null) {
                        text = text.replace("{0}", chrome.i18n.getMessage("TargetProject_Desktop"));
                    }
                    else {
                        text = text.replace("{0}", this.environment.currentProject.ProjectName);
                    }

                    ui.showProgress(text, this.currentProgress.text2);
                    if (this.currentProgress.type === ProgressType.bibliographyReferencesImport) {
                        document.getElementById("cancelImportDiv").style.display = "block";
                    }
                    else {
                        document.getElementById("cancelImportDiv").style.display = "none";
                    }
                }
                break;

            case ProgressType.none:
                {
                    this.showTab();
                }
                break;
        }

    }

    startCitavi() {
        var obj = { action: "startCitavi" };
        this.sendMessage({ action: MessageKeys.invokeContextMenuHnd, obj });

        this.startCitaviTimeout = window.setTimeout(() => {
            chrome.runtime.sendMessage(MessageKeys.isCitaviRunning, (isRunning) => {
                telemetry.log("start citavi - (isRunning): " + isRunning);
                var project = { ProjectKey: "desktop" };
                this.environment.currentProject = project;
                this.environment.citaviIsRunning = isRunning;
                this.showTab();
            });
        }, 2500);
    }

    takeScreenshot() {
        try {
            this.sendMessage({ action: MessageKeys.takeScreenshot }, (r) => {
               
            });
        }
        catch (e) {
            console.error(e);
        }
    }

    onReceiveMessage(event) {
        try {
            if (event.data.environment) {
                var localizePending = false;
                if (this.environment.isPdf == undefined &&
                    event.data.environment.isPdf) {
                    localizePending = true;
                }
                this.environment = event.data.environment;
                if (localizePending) {
                    this.localize();
                    this.initializeCustomButtons();
                }
            }

            if (window.exception !== undefined) {
                return;
            }

            switch (event.data.action) {

                case MessageKeys.showInfoTab:
                    {
                        this.showInfoTab(event.data.obj.info);
                    }
                    break;

                case MessageKeys.onLoggedIn:
                case MessageKeys.onLoggedOut:
                case MessageKeys.togglePanel:
                case MessageKeys.updatePanel:
                    {
                        this.showTab();
                    }
                    break;

                case MessageKeys.setProgress:
                    {
                        this.currentProgress = event.data.obj.progress;
                        if (this.currentProgress == ProgressType.none) {
                            ui.progress.isAnimating = false;
                        }
                        if (ui.activeTab == "infoTab") {
                            return;
                        }
                        this.showTab();
                    }
                    break;

                case MessageKeys.onProjectChanged:
                    {
                        ui.updateProjectsHeader();
                        if (ui.activeTab == "settingsTab") {
                            ui.updateAccount();
                        }
                        else {
                            this.showTab();
                        }
                    }
                    break;

                case MessageKeys.onTextSelectionChanged:
                    {
                       
                        if (this.docInfo.textSelection == event.data.obj) {
                            return;
                        }
                        this.docInfo.textSelection = event.data.obj;
                        if (ui.activeTab == "settingsTab") return;
                        if (ui.activeTab == "infoTab") return;
                        this.showTab();
                    }
                    break;

                case MessageKeys.setDocumentInfo:
                    {
                        this.docInfo.annotations = event.data.obj.annotations;
                        this.docInfo.textSelection = event.data.obj.textSelection;
                        this.docInfo.hunter = event.data.obj.hunter;
                        this.docInfo.references = event.data.obj.references;
                        if (ui.activeTab == "settingsTab") return;
                        if (ui.activeTab == "infoTab") return;
                        
                        if (this.currentProgress != null && this.currentProgress.type == ProgressType.import) {
                            return;
                        }

                        this.showTab();
                    }
                    break;

                case MessageKeys.showSettingsTab:
                    {
                        this.sendMessage({ action: MessageKeys.getSettings }, (s) => this.showSettings(s));
                    }
                    break;

                case MessageKeys.showErrorTab:
                    {
                        this.clearProgress();
                        ui.showTab("errorTab");

                        window.exception = event.data.obj.exception;
                        var btn = document.getElementById("sendTraceBtn");
                        btn.setAttribute("sessionId", window.exception.sessionId);
                    }
                    break;

                case MessageKeys.showBibliopgraphyImportInfoTab:
                    {
                        this.docInfo.references = event.data.obj.references;
                        this.docInfo.hunter = event.data.obj.hunter;
                        this.docInfo.references[0].checked = true;
                        this.showBibliopgraphyImportInfoTab(this.docInfo.references[0]);
                    }
                    break;

                case MessageKeys.updateAnnotations:
                    {
                        this.docInfo.annotations = event.data.obj;
                    }
                    break;

                case MessageKeys.hunterImport:
                    {
                        this.docInfo.references = event.data.obj.references;

                        this.docInfo.hunter = event.data.obj.hunter;

                        if (this.docInfo.references == null ||
                            this.docInfo.references.length == 0) {

                            this.docInfo.hunter = null;
                            this.docInfo.references = null;
                        }
                       
                        if (this.currentProgress != null &&
                            this.currentProgress.type == ProgressType.import) {
                            return;
                        }

                        if (ui.activeTab == "infoTab") {
                            return;
                        }
                        if (ui.activeTab == "bibliographyImportInfoTab") {
                            return;
                        }

                        if (event.data.obj.info !== undefined &&
                            event.data.obj.info.type !== undefined) {
                            this.showInfoTab(event.data.obj.info);
                            return;
                        }

                        this.currentProgress.type = ProgressType.none;

                        if (this.currentProgress == ProgressType.none) {
                            ui.progress.isAnimating = false;
                        }
                        this.showTab();
                    }
                    break;

                case MessageKeys.isbnImport:
                    {
                        this.docInfo.references = event.data.obj;
                        if (this.docInfo.references == null ||
                            this.docInfo.references.length == 0) {

                            this.docInfo.references = null;
                        }
                        this.currentProgress.type = ProgressType.none;
                        if (this.currentProgress == ProgressType.none) {
                            ui.progress.isAnimating = false;
                        }
                        ui.showTab("hunterTab");
                    }
                    break;

                case MessageKeys.onRepoChanged:
                    {

                    }
                    break;

                case MessageKeys.proxyLoggedIn:
                    {
                        //var proxy = event.data.obj.value;
                        engine.environment.proxyUrl = null;
                        engine.environment.proxy = null;
                        this.showTab();
                        if (!isNullOrUndefined(this.docInfo.references)) {
                            for (var r of this.docInfo.references) {
                                r.upwChecked = false;
                                r.retryUpwChecked = true;
                            }
                        }
                    }
                    break;
            }
        }
        catch (e) {
            console.error(e);
        }
    }

    onInfoBtnClick(event) {
        this.clearCloseTimeouts();
        this.postMessage(MessageKeys.hidePanel);
        setTimeout(() => {
            ui.activeTab = "";
            this.showTab();
        }, 500);

        var info = document.getElementById("infoLbl").info;
        if (info.type == InfoType.identifierExists) {
            this.sendMessage({ action: MessageKeys.showCitaviEntity, id: info.identifier }, null);
        }
    }
}

class Ui {
    constructor() {
        this.activeTab = "";
        this.progress = new ProgressCanvas(true);
    }

    check(id) {
        var element = document.getElementById(id);
        element.checked = "checked";
        element = document.getElementById(id.replace("Chkbox", ""));
        element.setAttribute("aria-checked", "true");
        element.classList.add("is-checked");
        
    }
    uncheck(id) {
        var element = document.getElementById(id);
        element.setAttribute("aria-checked", "false");
        element = document.getElementById(id.replace("Chkbox", ""));
        element.classList.remove("is-checked");
        element.checked = "";
    }

    clearTxtBox(id) {
        document.getElementById(id).value = "";
    }

    changeLocalRepo(e) {
        engine.environment.repo = Constants.LocalRepo;
        engine.sendMessage({ action: MessageKeys.changeRepo, value: Constants.LocalRepo });
        engine.sendMessage({ action: MessageKeys.changeProject, obj: { sender: "panel" } });
        engine.showTab();
    }

    showElement(element, visible) {
        if (element == null) return;

        element.style.display = visible ?
            element.style.display = "block" :
            element.style.display = "none";
    }

    showAvatar() {
        if (engine.environment.account.user == null) {
            engine.sendMessage(MessageKeys.login);
            return;
        }
        
        this.showTab("accountTab");
    }

    showHunterImport() {
        var existsFeatureAvailable = false;
        if (engine.docInfo.references != null) {

            var trimmTitle = true;
            document.getElementById("hunterReferences").style.display = "block";
            var list = document.getElementById("hunterReferencesList");
            while (list.firstChild) {
                list.removeChild(list.firstChild);
            }

            engine.docInfo.references.forEach(r => r.checked = true);
            var importBtnDisbaled = true;

            var addImportReferenceItem = function (reference, item, list) {
                item.reference = reference;
                item.addEventListener("click", (e) => {
                    var element = e.target.reference == null ? e.target.parentNode : e.target;
                    element.reference.checked = !element.reference.checked;
                    if (element.classList.contains("is-selected")) {
                        element.classList.remove("is-selected");
                    }
                    else {
                        element.classList.add("is-selected");
                    }
                });

                var title = document.createElement("span");
                if (trimmTitle) {
                    title.className = "ms-ListItem-primaryText singleline";
                }
                else {
                    title.className = "ms-ListItem-primaryText";
                }

                title.innerText = reference.title;
                title.title = reference.title;
                item.appendChild(title);

                var source = document.createElement("span");
                source.className = "ms-ListItem-secondaryText";
                source.innerText = reference.source;
                item.appendChild(source);

                if (existsFeatureAvailable &&
                    reference.projectInfo.exists) {
                    item.className = "ms-ListItem";
                    reference.checked = false;
                    var projectInfo = document.createElement("span");
                    projectInfo.className = "ms-ListItem-italic";
                    projectInfo.innerText = chrome.i18n.getMessage("ExistsInProject").replace("{0}", reference.projectInfo.projectname);
                    item.appendChild(projectInfo);
                }
                else {
                    importBtnDisbaled = false;
                }

                list.appendChild(item);

                if (reference.htmlToPdfUrl) {
                    var htmlToPdfElement = document.createElement("li");
                    if (reference.importHtmlAsPdf) {
                        htmlToPdfElement.className = "ms-ListItem is-selected htmlToPdf";
                    }
                    else {
                        htmlToPdfElement.className = "ms-ListItem is-selectable htmlToPdf";
                    }
                    htmlToPdfElement.innerText = chrome.i18n.getMessage("NewsPaperHtmlToPdf");
                    htmlToPdfElement.addEventListener("click", (e) => {
                        if (e.target.classList.contains("is-selected")) {
                            e.target.classList.remove("is-selected");
                            reference.importHtmlAsPdf = false;
                        }
                        else {
                            e.target.classList.add("is-selected");
                            reference.importHtmlAsPdf = true;
                        }
                    });
                    list.appendChild(htmlToPdfElement);
                }
            };

            for (var reference of engine.docInfo.references) {
                var item = document.createElement("li");

                if (engine.importedReferences.length > 0) {
                    if (engine.importedReferences.indexOf(reference.id) == -1) {
                        item.className = "ms-ListItem is-selectable hunterreference";
                        reference.checked = false;
                    }
                    else {
                        item.className = "ms-ListItem is-selectable is-selected hunterreference";
                    }
                }
                else {
                    item.className = "ms-ListItem is-selectable is-selected hunterreference";
                }

                addImportReferenceItem(reference, item, list);

                if (engine.docInfo.references.length === 1 &&
                    reference.bibliography.length > 0) {

                    var titleDiv = document.createElement("div");
                    titleDiv.id = "hunterBibliographyReferencesTitleDiv";
                    var title = document.createElement("span");
                    title.innerText = chrome.i18n.getMessage("BibliographyReferencesTitle");
                    title.id = "hunterBibliographyReferencesTitle";
                    title.classList.add("ms-Label");
                    title.classList.add("bold");
                    titleDiv.appendChild(title);
                    list.appendChild(titleDiv);

                    for (var bibReference of reference.bibliography) {
                        item = document.createElement("li");
                        item.className = "ms-ListItem is-selectable is-selected hunterreference hunterbibreference";
                        bibReference.checked = true;
                        addImportReferenceItem(bibReference, item, list);
                    }
                }
            }
            if (!importBtnDisbaled) {
                document.getElementById("importHunterReferencesBtn").removeAttribute("disabled");
            }
            else {
                document.getElementById("importHunterReferencesBtn").setAttribute("disabled", "disabled");
            }
        }
    }

    showProjectSelection() {

        
        var accountLoginBtn = document.getElementById("projectSelectionBtnAccountLoginDiv");
        var projectList_Desktop = document.getElementById("projectList_Desktop");

        var selectedProjectKey = "";
        if (engine.environment.localAvailable) {
            selectedProjectKey = "desktop";
            document.getElementById("activeDestkopProject").removeEventListener("click", this.changeLocalRepo);
            document.getElementById("activeDestkopProject").addEventListener("click", this.changeLocalRepo);
        }
        if (engine.environment.currentProject != null) {
            selectedProjectKey = engine.environment.currentProject.ProjectKey;
        }
        
        var webList = document.getElementById("projectSelection-web");
        webList.innerText = null;

        if (engine.environment.account.user != null) {

            for (var project of engine.environment.account.user.ProjectRoles) {

                let p = JSON.parse(JSON.stringify(project));
                var li = document.createElement("li");
                li.className = "projectlistitem singleline";
                li.innerText = project.ProjectName;
                li.setAttribute("id", project.ProjectKey);
                li.tag = project;
                li.title = project.ProjectName;
                li.addEventListener("click", e => {
                    engine.environment.repo = Constants.WebRepo;
                    engine.sendMessage({ action: MessageKeys.changeRepo, value: Constants.WebRepo });
                    engine.sendMessage({ action: MessageKeys.changeProject, obj: p });
                    
                    engine.showTab();
                });
                webList.appendChild(li);
            }

            ui.showElement(accountLoginBtn, false);
        }
        else {
            ui.showElement(accountLoginBtn, true);
        }
        projectList_Desktop.style.display = engine.environment.localAvailable ? "block" : "none";
    }

    showProgress(text, text2) {
        document.getElementById("progressText").innerText = text;
        document.getElementById("progressText2").innerText = text2 == null ? "" : text2;
        this.showTab("progressTab");
    }

    showTab(tabName, obj) {

        try {
            if(tabName == "progressTab" && this.progress.isAnimating){
                return;
            }

            this.activeTab = tabName;
            document.querySelectorAll(".tab").forEach((tab) => tab.style.display = "none");

            switch (tabName) {
                case "noSelectionTab":
                    {
                        if (!engine.environment.isPdf) {
                            if (document.getElementById("htmlToPdfCustomWebsite") == null) {
                                //var htmlToPdfElement = document.createElement("li");
                                //htmlToPdfElement.id = "htmlToPdfCustomWebsite";
                                //htmlToPdfElement.className = "ms-ListItem is-selectable htmlToPdf";
                                //htmlToPdfElement.innerText = chrome.i18n.getMessage("NewsPaperHtmlToPdf");
                                //htmlToPdfElement.addEventListener("click", (e) => {
                                //    if (e.target.classList.contains("is-selected")) {
                                //        e.target.classList.remove("is-selected");
                                //    }
                                //    else {
                                //        e.target.classList.add("is-selected");
                                //    }
                                //});
                                //document.getElementById("AddWebPageAsReference").appendChild(htmlToPdfElement);
                            }
                        }
                    }
                    break;
                case "hunterTab":
                    {
                        this.showHunterImport();
                    }
                    break;
                case "settingsTab":
                    {
                        if (obj[SettingNames.detectReferenceIdentifier]) {
                            this.check("settingsReferenceIdentifierChkbox");
                        }
                        else {
                            this.uncheck("settingsReferenceIdentifierChkbox");
                        }

                        if (obj[SettingNames.enableHunter]) {
                            this.check("settingsHunterChkbox");
                        }
                        else {
                            this.uncheck("settingsHunterChkbox");
                        }

                        if (obj[SettingNames.importPdf]) {
                            this.check("settingsImportPdfChkbox");
                        }
                        else {
                            this.uncheck("settingsImportPdfChkbox");
                        }

                        if (obj[SettingNames.aiSeverityLevel] == SeverityLevel.Verbose) {
                            this.check("settingsEnableTraceChkbox");
                        }
                        else {
                            this.uncheck("settingsEnableTraceChkbox");
                        }

                        if (obj[SettingNames.autoShowDuplicateReference]) {
                            this.check("settingsAutoShowDuplicateReferenceChkbox");
                        }
                        else {
                            this.uncheck("settingsAutoShowDuplicateReferenceChkbox");
                        }

                        if (obj[SettingNames.lookupBibliography]) {
                            this.check("settingsLookupBibliographyChkbox");
                        }
                        else {
                            this.uncheck("settingsLookupBibliographyChkbox");
                        }

                        if (obj[SettingNames.developerMode]) {
                            document.getElementById('developerSettingsBox').style.display = "block";
                        }
                        else {
                            document.getElementById('developerSettingsBox').style.display = "none";
                        }

                    }
                    break;
                case "traceTab":
                    {
                        document.getElementById("sendTraceInfoLbl").style.display = "none";
                        this.clearTxtBox("traceEmailTxtBx");
                        this.clearTxtBox("traceNameTxtBx");
                        this.clearTxtBox("traceCommentTxtBx");
                        document.getElementById("sendTraceBtn").disabled = false;

                        if (engine.environment.account != null &&
                            engine.environment.account.user != null) {
                            try {
                                document.getElementById("traceNameTxtBx").value = engine.environment.account.user.Contact.FullName;
                                document.getElementById("traceEmailTxtBx").value = engine.environment.account.user.Contact.EMailAddress1;
                            }
                            catch (e) { }
                        }

                        var btn = document.getElementById("sendTraceBtn");
                        btn.setAttribute("sessionId", obj);
                    }
                    break;
                case "projectSelectionTab":
                    {
                        this.showProjectSelection();
                    }
                    break;
                case "citaviIsNotRunningTab":
                    {
                        if (!engine.environment.localAvailable) {
                            document.querySelectorAll(".citavilocal").forEach(c => this.showElement(c, false));
                        }
                        else if (engine.environment.account == null &&
                                 engine.environment.currentProject == null) {
                            document.querySelectorAll(".citavilocal").forEach(c => this.showElement(c, true));
                        }
                    }
                    break;
                case "progressTab":
                    {
                        if(this.progress.isAnimating){
                            return;
                        }
                        document.getElementById(tabName).style.display = "block";
                    }
                    break;

            }

            document.getElementById(tabName).style.display = "block";

            var showHeaderWithBackBtn = tabName === "settingsTab" || tabName === "errorTab" || tabName === "traceTab" || tabName === "accountTab";

            if (showHeaderWithBackBtn) {
                this.showElement(document.getElementById("headerBackBtn"), true);
                this.showElement(document.getElementById("headerAvatarClosePanelDiv"), false);
                this.showElement(document.getElementById("headerProjectsDiv"), false);
            }
            else {
                this.showElement(document.getElementById("headerAvatarClosePanelDiv"), true);
                this.showElement(document.getElementById("headerBackBtn"), false);

                if (tabName == "progressTab" || tabName == "infoTab") {
                    document.getElementById("headerProjectsDiv").style.display = "none";
                }
                else {
                    this.updateProjectsHeader(tabName == "projectSelectionTab");
                }
                this.updateAccount();
                
                if (tabName != "projectSelectionTab" &&
                    engine.environment.currentProject == null && !engine.environment.citaviIsRunning &&
                    engine.environment.account != null &&
                    engine.environment.account.user != null) {
                    //User angemeldet an Account. Kein projekt ausgewählt und C-Deskop läuft auch nicht.
                    //this.showTab("projectSelectionTab");
                }
                if (tabName == "citaviIsNotRunningTab") {
                    this.showElement(document.getElementById("headerProjectsDiv"), false);
                }
            }

            this.updateProxy();
            
        }
        catch (e) {
            telemetry.error(e);
        }
    }

    updateAccount() {
        document.getElementById("headerAvatarNoImgDiv").style.display = "none";

        if (engine.environment.account != null &&
            engine.environment.account.user != null) {
            document.getElementById("noAccountImg").style.display = "none";

            if (engine.environment.account.user.image == null) {
                document.getElementById("headerAvatarNoImgDiv").style.display = "block";
                document.getElementById("headerAvatarImg").style.display = "none";
                document.getElementById("accountImg").style.display = "none"; 
                document.getElementById("avatarNoImgDiv").innerText = engine.environment.account.user.Contact.FullName[0];
                document.getElementById("headerAvatarNoImgDiv").innerText = engine.environment.account.user.Contact.FullName[0];
                //document.getElementById("logout").style.marginLeft = "0px";
            }
            else {
                document.getElementById("accountImg").style.display = "block";
                document.getElementById("headerAvatarImg").style.display = "block";
                document.getElementById("avatarNoImgDiv").style.display = "none";
                document.getElementById("headerAvatarImg").src = "data:image/png;base64," + engine.environment.account.user.image;
                document.getElementById("accountImg").src = "data:image/png;base64," + engine.environment.account.user.image;
                //document.getElementById("logout").style.marginLeft = "52px";
            }
            document.getElementById("headerAvatarDiv").style.display = "block";
            document.getElementById("accountName").innerText = engine.environment.account.user.Contact.FullName;
            document.getElementById("accountEmail").innerText = engine.environment.account.user.Contact.EMailAddress1;
        }
        else {
            document.getElementById("headerAvatarDiv").style.display = "none";
            document.getElementById("noAccountImg").style.display = "block";
        }
    }

    updateProjectsHeader(isProjectSelectionTabVisible) {
        try {

            document.getElementById("headerProjectsDiv").style.display = "none";

            document.getElementById("headerTargetProject1Div").innerText = chrome.i18n.getMessage("ProjectSelection");
            if (engine.environment.currentProject != null) {
                //document.getElementById("headerTargetProject2Div").setAttribute("colorScheme", this.environment.currentProject.ColorSchemeIdentifier);
                document.getElementById("headerTargetProject2Div").innerText = engine.environment.currentProject.ProjectName;
                document.getElementById("headerProjectsDiv").style.display = "flex";
            }
            else {
                if (engine.environment.localAvailable) {
                    //document.getElementById("headerTargetProject2Div").setAttribute("colorScheme", "Blue");
                    document.getElementById("headerTargetProject2Div").innerText = chrome.i18n.getMessage("TargetProject_Desktop");
                    document.getElementById("headerProjectsDiv").style.display = "flex";
                }
                else if (engine.environment.account != null &&
                         engine.environment.account.user != null) {
                    document.getElementById("headerProjectsDiv").style.display = "flex";
                }
            }

            document.getElementById("headerTargetProjectImg1").style.display = isProjectSelectionTabVisible ? "none" : "inline-block";
            document.getElementById("headerTargetProjectImg2").style.display = !isProjectSelectionTabVisible ? "none" : "inline-block";
        }
        catch (e) {
            telemetry.error(e);
        }
    }

    updateProxy() {
        try {
            
            if (!isNullOrEmpty(engine.environment.proxyUrl)) {
                if (isNullOrUndefined(engine.environment.proxy)) {
                    
                    if (isNullOrEmpty(engine.environment.proxyName)) {
                        document.getElementById("proxyInfo").innerText = chrome.i18n.getMessage("ProxyInfo").replace("{0}", engine.environment.proxyUrl);
                        document.getElementById("headerBtnProxyDiv").innerText = chrome.i18n.getMessage("EZProxyLogin").replace("{0}", engine.environment.proxyUrl);
                    }
                    else {
                        document.getElementById("proxyInfo").innerText = chrome.i18n.getMessage("ProxyInfo").replace("{0}", engine.environment.proxyName);
                        document.getElementById("headerBtnProxyDiv").innerText = chrome.i18n.getMessage("EZProxyLogin").replace("{0}", engine.environment.proxyName);
                    }
                }

                document.getElementById("proxyTab").style.display = "flex";

            }
            else {
                document.getElementById("proxyTab").style.display = "none";
            }
        }
        catch (e) {
            console.error(e);
        }
    }

    showNoProjectsTab() {
        if (engine.environment.currentProject == null &&
            engine.environment.repo == Constants.LocalRepo &&
            !engine.environment.citaviIsRunning) {
            this.showTab("citaviIsNotRunningTab");

        }
    }
}

var CheckBox = (function () {
    function CheckBox(container) {
        this._container = container;
        this._choiceField = this._container.querySelector(".ms-CheckBox-field");
        this._choiceInput = this._container.querySelector(".ms-CheckBox-input");
        if (this._choiceInput.checked) {
            this._choiceField.setAttribute("aria-checked", "true");
        }
        if (this._choiceField.getAttribute("aria-checked") === "true") {
            this._choiceField.classList.add("is-checked");
        }
        this._addListeners();
    }
    CheckBox.prototype.getValue = function () {
        return this._choiceField.getAttribute("aria-checked") === "true" ? true : false;
    };
    CheckBox.prototype.toggle = function () {
        if (this.getValue()) {
            this.unCheck();
        }
        else {
            this.check();
        }
        this._choiceInput.click();
    };
    CheckBox.prototype.check = function () {
        this._choiceField.setAttribute("aria-checked", "true");
        this._choiceField.classList.add("is-checked");
    };
    CheckBox.prototype.unCheck = function () {
        this._choiceField.setAttribute("aria-checked", "false");
        this._choiceField.classList.remove("is-checked");
    };
    CheckBox.prototype.removeListeners = function () {
        this._choiceField.removeEventListener("focus", this._FocusHandler.bind(this));
        this._choiceField.removeEventListener("blur", this._BlurHandler.bind(this));
        this._choiceField.removeEventListener("click", this._ClickHandler.bind(this));
        this._choiceField.removeEventListener("keydown", this._KeydownHandler.bind(this));
    };
    CheckBox.prototype._addListeners = function (events) {
        var ignore = events && events.ignore;
        if (!ignore || !(ignore.indexOf("focus") > -1)) {
            this._choiceField.addEventListener("focus", this._FocusHandler.bind(this), false);
        }
        if (!ignore || !(ignore.indexOf("blur") > -1)) {
            this._choiceField.addEventListener("blur", this._BlurHandler.bind(this), false);
        }
        if (!ignore || !(ignore.indexOf("click") > -1)) {
            this._choiceField.addEventListener("click", this._ClickHandler.bind(this), false);
        }
        if (!ignore || !(ignore.indexOf("keydown") > -1)) {
            this._choiceField.addEventListener("keydown", this._KeydownHandler.bind(this), false);
        }
    };
    CheckBox.prototype._FocusHandler = function () {
        this._choiceField.classList.add("in-focus");
    };
    CheckBox.prototype._BlurHandler = function () {
        this._choiceField.classList.remove("in-focus");
    };
    CheckBox.prototype._ClickHandler = function (event) {
        event.stopPropagation();
        event.preventDefault();
        if (!this._choiceField.classList.contains("is-disabled")) {
            this.toggle();
        }
    };
    CheckBox.prototype._KeydownHandler = function (event) {
        if (event.keyCode === 32) {
            event.stopPropagation();
            event.preventDefault();
            if (!this._choiceField.classList.contains("is-disabled")) {
                this.toggle();
            }
        }
    };
    return CheckBox;
}());

let engine = new FrameEngine();
let ui = new Ui();

document.addEventListener('DOMContentLoaded', () => {
    
    engine.initialize();
    engine.postMessage(MessageKeys.loaded);
}, false);



