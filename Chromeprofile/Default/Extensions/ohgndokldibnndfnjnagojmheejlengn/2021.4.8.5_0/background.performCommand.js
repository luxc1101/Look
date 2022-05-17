function performCommand(msg, sender, sendResponse) {
    try {
        if (sendResponse !== null) {
            performCommand_(msg, sender, sendResponse);
            return true;
        }
        window.setTimeout(() => performCommand_(msg, sender), 10);
        return false;
    }
    catch (e) {
        return true;
    }
}

async function performCommand_(msg, sender, sendResponse) {

    try {
        if (typeof msg === 'string') {
            var action = msg;
            msg = {};
            msg.action = action;
        }

        await initalizeTask;

        var senderUrl = "";
        if (sender != null &&
            sender.tab != null) {
            senderUrl = sender.tab.url;
        }

        if (msg.action !== MessageKeys.getHunter) {
            if (settings.buildType === BuildTypes.Alpha) {
                telemetry.log(`performCommand: ${msg.action}`);
            }
        }

        switch (msg.action) {

            case MessageKeys.changeProject:
                {
                    if (msg.obj.ProjectKey == undefined) {
                        msg.obj.ProjectKey = "";
                    }

                    if (settings.projectKey == msg.obj.ProjectKey) {
                        if (msg.obj.sender === "panel" && msg.obj.ProjectKey === "" && localRepo.connected) {
                            if (citaviPicker.citaviIsRunning(false, (e) => {
                                if (!e) {
                                    citaviPicker.startCitavi();
                                }
                                else {
                                    panel.broadcast({ action: MessageKeys.onProjectChanged });
                                }
                            }));
                        }
                        return;
                    } 

                    settings.projectKey = msg.obj.ProjectKey;

                    telemetry.log("Change project: " + msg.obj.ProjectKey + " (" + msg.obj.ProjectName + ")");
                    panel.broadcast({ action: MessageKeys.onProjectChanged });
                    
                }
                break;

            case MessageKeys.onLoggedOut:
                {
                    account.user = null;
                    account.hub.stop();
                    panel.broadcast({ action: MessageKeys.onLoggedOut });
                }
                break;

            case MessageKeys.login:
                {
                    account.oauth.login(async (success) => {
                        if (success) {
                            await account.initialize();
                            panel.broadcast({ action: MessageKeys.onLoggedIn });
                        }
                    });
                }
                break;

            case MessageKeys.logout:
                {
                    account.oauth.logout();
                }
                break;

            case MessageKeys.updateAccessToken:
                {
                    telemetry.log("Update AccessToken");
                    var loggedIn = account.isLoggedIn;
                    var ok = account.oauth.update(msg.obj);
                    if (ok && !loggedIn) {
                        account.initialize().then(() => {
                            panel.broadcast({ action: MessageKeys.onLoggedIn });
                        });
                    }
                }
                break;

            case MessageKeys.updateAccount:
                {
                    await account.getUserLookup();
                    panel.broadcast({ action: MessageKeys.onLoggedIn });
                }
                break;

            case MessageKeys.invokeContextMenuHnd:
                {
                    var fld = msg.obj.fld;
                    var data = msg.obj.data;
                    chrome.tabs.query({ currentWindow: true, active: true }, async function (tabs) {
                        var tab = tabs[0];
                        var info = { srcUrl: tab.url, selectionText: data };
                        var result = { success: true };
                        telemetry.log("PerformCommand: " + msg.obj.action, { data: msg.obj});
                        try {
                            switch (msg.obj.action) {
                                case "startCitavi":
                                    {
                                        await citaviPicker.startCitavi();
                                    }
                                    break;

                                case "addPdfAsLocalFile":
                                    {
                                        result.success = await contextMenuEventhandler.sendAttachment(AttachmentType.referenceAttachment, false, info, tab, true);
                                    }
                                    break;

                                case "importPDFAsReference":
                                    {
                                        result.success = await contextMenuEventhandler.importPdf(info, tab, true);
                                    }
                                    break;

                                case "webPageAsNewReference":
                                    {
                                        if (msg.obj.isPdf) {
                                            result.success = await contextMenuEventhandler.importPdf(info, tab, true, true);
                                        }
                                        else {
                                            result = await contextMenuEventhandler.importWebPage(info, tab, true, true);
                                            if (result.success && msg.obj.importHtmlAsPdf) {
                                                result.reference.importHtmlAsPdf = true;

                                                var bytes = await citaviPicker.html2Pdf(tab, result.reference);
                                                if (bytes !== null) {
                                                    var bag = {
                                                        referenceId: result.referenceId,
                                                        data: Uint8Array.from(bytes),
                                                        attachmenType: AttachmentType.referenceAttachment,
                                                        contentType: "application/pdf",
                                                        title: result.reference.title
                                                    };
                                                    result.success = await citaviPicker.sendAttachment(bag);
                                                }
                                            }
                                        }
                                    }
                                    break;

                                case "webPageAsLocation":
                                    {
                                        result.success = await contextMenuEventhandler.sendWebPageAsLocation(info, tab, true);
                                    }
                                    break;

                                case "screenshotAsCover":
                                    {
                                        result.success = await contextMenuEventhandler.screenshotAsCover(tab);
                                    }
                                    break;

                                case "textSelectionClipboard":
                                    {
                                        result.success = await contextMenuEventhandler.copyTextSelectionToClipboard(tab);
                                    }
                                    break;

                                case "textSelectionReference": {
                                    switch (fld) {
                                        case "abstract":
                                            result.success = await contextMenuEventhandler.sendText(ReferencePropertyId.Abstract, false, info, tab, true);
                                            break;
                                        case "keywords":
                                            result.success = await contextMenuEventhandler.sendText(ReferencePropertyId.Keywords, false, info, tab, true);
                                            break;
                                        case "quotation":
                                            result.success = await contextMenuEventhandler.sendText(ReferencePropertyId.QuotationText, false, info, tab, true);
                                            break;
                                        case "toc":
                                            result.success = await contextMenuEventhandler.sendText(ReferencePropertyId.TableOfContents, false, info, tab, true);
                                            break;
                                    }
                                }
                                    break;

                                case "textSelectionNewReference": {
                                    switch (fld) {
                                        case "abstract":
                                            result.success = await contextMenuEventhandler.sendText(ReferencePropertyId.Abstract, true, info, tab, true);
                                            break;
                                        case "keywords":
                                            result.success = await contextMenuEventhandler.sendText(ReferencePropertyId.Keywords, true, info, tab, true);
                                            break;
                                        case "quotation":
                                            result.success = await contextMenuEventhandler.sendText(ReferencePropertyId.QuotationText, true, info, tab, true);
                                            break;
                                        case "toc":
                                            result.success = await contextMenuEventhandler.sendText(ReferencePropertyId.TableOfContents, true, info, tab, true);
                                            break;
                                    }

                                }
                                    break;
                            }
                            
                            sendResponse(result);
                        }
                        catch (e) {
                            result.success = false;
                            result.exception = e;
                            telemetry.error(e);
                            panel.showException(sender.tab, result, msg.obj.action + " failed");
                            sendResponse(result);
                        }
                        finally {
                            panel.clearProgress(sender.tab);
                        }
                    });
                }
                return true;

            case MessageKeys.changeRepo:
                {
                    citaviPicker.changeRepo(msg.value);
                }
                break;

            case MessageKeys.checkForDuplicates:
                {
                    var result = [];
                    try {
                        while (msg.identifier.length > 0) {
                            var arr = msg.identifier.splice(0, 50);
                            var response = await citaviPicker.identifiersExists(arr);
                            for (var item of response) {
                                result.push(item);
                            }
                        }
                        sendResponse(result);
                    }
                    catch (e) {
                        sendResponse(null);
                    }
                }
                break;

            case MessageKeys.captureVisibleTab:
                {
                    //https://developer.chrome.com/extensions/tabs#method-captureVisibleTab
                    chrome.tabs.captureVisibleTab(null, {
                        format: "png"
                    }, function (image) {
                        sendResponse(image);
                    });
                }
                break;

            case MessageKeys.isCitaviRunning:
                {
                    sendResponse(await citaviPicker.citaviIsRunning(true));
                }
                break;

            case MessageKeys.fetch:
                {
                    if (!citaviPicker.validate(true)) {
                        return;
                    }

                    if (!await citaviPicker.citaviIsRunning(true)) {
                        return;
                    }

                    var result = await citaviPicker.identifierExists(msg.id, true, sender.tab);
                    if (result.exists) {
                        return;
                    }

                    if (msg.hunterId) {
                        var hunter = hunters.getById(msg.hunterId);
                        var source = hunter.source + ` hunter.get("${msg.id}");`;
                        chrome.tabs.executeScript(tabId, { code: source }, async (response) => {

                            await performCommand_({ action: MessageKeys.importReference, value: response[0], importFormat: hunter.importFormat }, sender, sendResponse);
                            chrome.tabs.sendMessage(sender.tab.id, { action: MessageKeys.updateDuplicateState });
                        });
                        return;
                    }

                    panel.sendFetchReferenceIdentiferProgress(sender.tab, msg.id);

                    var tabId = sender.tab.id;

                    var format = citaviPicker.activeRepo.isWeb ? "json" : "xml";

                    var response = await backoffice.search(msg.id);
                    if (response == null) {

                        if (msg.id.type == ReferenceIdentifierType.Doi) {
                            var temp_reference = new Reference("", "");
                            temp_reference.doi = msg.id.value;
                            var reference = await referenceLookup.lookup(temp_reference);
                            if (reference !== null) {
                                performCommand_({ action: MessageKeys.importReference, value: reference.raw, importFormat: SimpleParser.RIS_ID }, sender, sendResponse);
                                return;
                            }
                        }
                        panel.sendImportSuccessProgress(sender.tab, "NoResultsWereFoundForTheseCriteria");
                        sendResponse();
                    }
                    else {
                        
                        performCommand_({ action: MessageKeys.importReference, value: response, importFormat: format }, sender, sendResponse);
                    }
                }
                break;

            case MessageKeys.fetchText:
                {
                    try {
                        var response = await fetch(msg.value);
                        var html = "";
                        if (response.ok) {
                            html = await response.text();
                        }
                        sendResponse(html);
                    }
                    catch (e) {
                        telemetry.error(e);
                        sendResponse("");
                    }
                }
                break;

            case MessageKeys.getAnalyserOptions:
                {
                    var url = msg.value;
                    var delay = 0;
                    if (url.indexOf("researchgate.net") !== -1) {
                        //#2609
                        delay = 2000;
                    }
                    var pageOptions = {
                        isBlacklisted: settings.isURLBlacklisted(url),
                        detectIsbnDoi: settings.detectReferenceIdentifier,
                        hunterEnabled: settings.enableHunter,
                        version: citaviPicker.activeRepo.version_major,
                        connected: citaviPicker.activeRepo.connected,
                        supportsDuplCheck: citaviPicker.activeRepo.isLocal,
                        delay: delay,
                        buildType: settings.buildType
                    };

                    sendResponse(pageOptions);
                }
                break;

            case MessageKeys.getISBNTransformers:
                {
                    var isRunning = await citaviPicker.citaviIsRunning(false);
                    if (!isRunning) {
                        sendResponse({
                            action: "citaviIsNotRunning"
                        });
                        return;
                    }
                    var transformers = await citaviPicker.getIsbnTransformers();
                    sendResponse({ value: transformers });
                }
                break;

            case MessageKeys.getHunter:
                {
                    var hunter = this.hunters.getHunter(msg.value);
                    if (!hunter.identifyUrl(senderUrl)) {
                        contextMenu.resetBadgeText(sender.tab);
                        sendResponse({ result: null, pickerVersion: runtimeInfo.pickerVersion });
                        return;
                    }
                    if (sender.tab == undefined) {
                        sendResponse({ result: null, pickerVersion: runtimeInfo.pickerVersion });
                        return;
                    }

                    var source = hunter.source + "\r\nvar c = hunter.identify(); if(c > 0){ var x = { count: c, hunter: hunter} ;JSON.stringify(x);}";
                    var url = sender.tab.url;
                    chrome.tabs.executeScript(sender.tab.id, { code: source }, (jsonResponse) => {

                        if (!isNullOrUndefined(chrome.runtime.lastError)) {
                            telemetry.error(chrome.runtime.lastError.message, { hunter: hunter.name });
                            sendResponse({ result: null, pickerVersion: runtimeInfo.pickerVersion });
                            return;
                        }

                        try {
                            var r = JSON.parse(jsonResponse[0]);

                            if (r != null &&
                                r.count > 0) {

                                var result = {
                                    activehunter: {
                                        name: hunter.name,
                                        id: hunter.id,
                                        importFormat: hunter.importFormat,
                                        supportsRefresh: hunter.supportsRefresh,
                                    }, count: r.count
                                };

                                if (hunter.requiredParsers) {
                                    for (let parser of hunter.requiredParsers) {
                                        chrome.tabs.executeScript(sender.tab.id, {
                                            code: "typeof " + parser + " === 'function'"
                                        }, (parserExists) => {
                                            if (!parserExists[0]) {
                                                chrome.tabs.executeScript(sender.tab.id, {
                                                    file: "hunter/parser/" + parser.toLowerCase() + ".js"
                                                });
                                            }
                                        });

                                    }
                                }

                                sendResponse({ result: result, pickerVersion: runtimeInfo.pickerVersion });
                                contextMenu.showBadgeText(r.count.toString(), sender.tab);
                            }
                            else {
                                sendResponse({ result: null, pickerVersion: runtimeInfo.pickerVersion });
                            }
                        }
                        catch (e) {
                            sendResponse({ result: null, pickerVersion: runtimeInfo.pickerVersion });
                        }
                    });

                }
                break;

            case MessageKeys.getHuntersCount:
                {
                    await hunterTask;
                    sendResponse({ value: this.hunters.count });
                }
                break;

            case MessageKeys.hunterScan:
                {
                    var id = msg.id;
                    var jobId = guid();
                    importJobs.push(jobId);
                    var hunter = hunters.getById(id);

                    var source = hunter.source + ` hunterScan("${jobId}","${sender.tab.id}", "${citaviPicker.activeRepo.type}");`;
                    chrome.tabs.executeScript(sender.tab.id, { code: source });
                }
                break;

            case MessageKeys.hunterImport:
                {
                    var jobId = msg.jobId;
                    var info = {};
                    if (importJobs.indexOf(jobId) == -1) {
                        telemetry.error("Unknown jobId: " + jobId);
                        return;
                    }
                    importJobs = importJobs.filter(id => id != jobId);
                    var hunter = hunters.getById(msg.hunterId);
                    if (hunter.id === "47B3F418-8125-413D-AADE-B96742176011") {
                        var source = `hunter.isLoggedIn`;
                        var promise = new Promise(resolve => {
                            chrome.tabs.executeScript(sender.tab.id, { code: source }, (r) => {
                                resolve(r[0]);
                            });
                        });
                        var isLoggedIn = await promise;
                        telemetry.log(`JSTOR isLoggedIn: ${isLoggedIn}`);
                        if (!isLoggedIn) {
                            info.type = InfoType.jstorNotLoggedIn;
                        }
                    }

                    info.hunterId = hunter.id;
                    var records = msg.records;
                    
                    var bib_reference_index = records.findIndex(s => s.type === "bib");

                    if (bib_reference_index !== -1) {
                        var item = records[bib_reference_index];
                        records.splice(bib_reference_index, 1);
                        bibLookup.cache_ieee[item.doi] = item.json.references;
                    }
                    
                    var references = new SimpleParser().parse(hunter.importFormat, records);

                    if (references != null) {
                        for (var reference of references) {
                            var ok = await reference.validate();

                            if (ok) {
                                if (references.length === 1) {
                                    if (reference.pdf === "") {
                                        await reference.lookupPdf();
                                    }
                                    await reference.lookupCover();
                                }
                            }
                            else {
                                telemetry.log("Reference already in project: " + reference.toString());
                            }

                            if (hunter.id == "31C7BF0A-E6C8-48B8-B988-192536888BE1") {
                                reference.completeTitledataAfterImport = false;
                            }
                            else {
                                reference.completeTitledataAfterImport = true;
                            }

                            if (references.length === 1) {
                                await bibLookup.getBibliographyReferencesCount(reference);
                            }

                            if (settings.newsPaperHtmlAsPdf) {
                                reference.importHtmlAsPdf = true;
                            }
                        }
                        
                        panel.sendMessage(msg.tabId * 1, null, { action: MessageKeys.hunterImport, references: references, info: info });
                    }
                    else {
                        telemetry.warn("references is null");
                    }
                }
                break;

            case MessageKeys.setImportProgress:
                {
                    if (!citaviPicker.validate(true)) {
                        return;
                    }

                    if (!await citaviPicker.citaviIsRunning(true)) {
                        return;
                    }

                    panel.sendProgress(sender.tab, { type: ProgressType.import, text: msg.text, text2: msg.text2 });
                }
                break;

            case MessageKeys.hunterDirectImport:
                {
                    if (!citaviPicker.validate(true)) {
                        return;
                    }

                    if (!await citaviPicker.citaviIsRunning(true)) {
                        return;
                    }

                    panel.sendProgress(sender.tab, { type: ProgressType.import, text: msg.text, text2: msg.text2 });
                    performCommand_({ action: MessageKeys.importReference, value: msg.value, importFormat: msg.importFormat }, sender, (r) => {
                        sendResponse(r);
                    });
                }
                break;

            case MessageKeys.isbnImport:
                {
                    var records = msg.value;
                    var references = new SimpleParser().parse(msg.importFormat, records);
                    if (references != null) {
                        for (var reference of references) {
                            var ok = await reference.validate();
                            if (ok) {
                                if (reference.pdf === "") {
                                    await reference.lookupPdf();
                                }
                                await reference.lookupCover();
                            }
                            else {
                                telemetry.log("Reference already in project: " + reference.toString());
                            }
                        }
                        panel.sendMessage(sender.tab.id, null, { action: MessageKeys.progressDialogHide });
                        panel.sendMessage(sender.tab.id, null, { action: MessageKeys.isbnImport, references: references });
                    }
                    else {
                        telemetry.warn("references is null");
                    }
                }
                break;

            case MessageKeys.importReference:
                {
                    telemetry.log("Import reference", { msg: msg });
                   //ISBN, DOI, PMID
                    var arr = [];

                    if (msg.importFormat == "json") {
                        arr.push(JSON.stringify(msg.value[0]));
                    }
                    else {
                        arr.push(msg.value);
                    }

                    var references = new SimpleParser().parse(msg.importFormat, arr);

                    for (var reference of references) {
                        await reference.lookupPdf();
                    }

                    await reference.lookupCover();

                    if (settings.lookupBibliography) {
                        if (references.length === 1) {
                            await bibLookup.getBibliographyReferencesCount(references[0]);
                            if (references[0].bibliographyReferencesCount > 0) {
                                panel.clearProgress(sender.tab);
                                panel.sendMessage(sender.tab.id, null, { action: MessageKeys.showBibliopgraphyImportInfoTab, references: references });
                                return;
                            }
                        }
                    }

                    msg.action = MessageKeys.importReferences;
                    msg.value = references;
                    await this.performCommand_(msg, sender, sendResponse);
                }
                break;

            case MessageKeys.importReferences:
                {
                    var result = { success: true };
                    var importedReferences = [];
                    try {
                        var references = "";
                        var count = msg.value.length;
                        var index = 1;

                        var importPdf = settings.importPdf;
                        var batchImport = false;
                        if (msg.value[0].importFormat === SimpleParser.REFWORK_RIS_ID) {
                            importPdf = false;
                            for (var reference of msg.value) {
                                if (!isNullOrEmpty(reference.pdf)) {
                                    importPdf = true;
                                }
                            }
                            if (!importPdf) {
                                batchImport = true;
                            }
                        }

                        if (batchImport) {
                            var all_references = "";
                            for (var reference of msg.value) {
                                all_references += reference.raw;
                            }
                            var info = {};
                            info["CompleteTitledataAfterImport"] = false;
                            info["PickerCreateImportGroup"] = true;
                            result = await citaviPicker.sendImport(all_references, reference.importFormat, null, senderUrl, info);
                            if (result === null ||
                                !result.success) {
                                if (result.exception && count == 1) {
                                    panel.showException(sender.tab, result, "sendImport failed");
                                }
                            }
                        }
                        else {
                            if (citaviPicker.isLocal) {
                                for (var reference of msg.value) {
                                    try {
                                        if (count > 1) {
                                            var importProgressText = chrome.i18n.getMessage("ImportKindleReference") + ` (${index}/${count})`;
                                            if (msg.hasProgressDialog) {
                                                panel.sendMessage(sender.tab.id, null, { action: MessageKeys.progressDialogProgress, val: importProgressText });
                                            }
                                            panel.sendProgress(sender.tab, { type: ProgressType.import, text: importProgressText, text2: reference.title });
                                        }
                                        else {
                                            if (msg.hasProgressDialog) {
                                                panel.sendMessage(sender.tab.id, null, { action: MessageKeys.progressDialogProgress, val: chrome.i18n.getMessage("ImportKindleReference") });
                                            }
                                            panel.sendProgress(sender.tab, { type: ProgressType.import, text: chrome.i18n.getMessage("ImportKindleReference"), text2: reference.title });
                                        }
                                        index++;

                                        //Import
                                        var info = {};
                                        if (reference.completeTitledataAfterImport) {
                                            info["completeTitledataAfterImport"] = true;
                                        }
                                        result = await citaviPicker.sendImport(reference.raw, reference.importFormat, null, senderUrl, info);
                                        if (result === null ||
                                            !result.success) {
                                            if (result.exception && count == 1) {
                                                panel.showException(sender.tab, result, "sendImport failed");
                                            }
                                            return;
                                        }

                                        var referenceId = result.referenceId;
                                        reference.citaviId = referenceId;
                                        if (referenceId !== undefined) {
                                            importedReferences.push(referenceId);
                                        }
                                        else if (!citaviPicker.isLocal) {
                                            delete reference.pdf;
                                            delete reference.cover;
                                        }

                                        if (importPdf && reference.retryUpwChecked) {
                                            //Das tritt auf, wenn man sich bei Proxy anmeldet und im Panel bereits die Titeldaten sind
                                            //Dann wurde der Check VOR dem setzen des Proxies gemacht. 
                                            //Muss wiederholt werden
                                            telemetry.log("lookupPdf again - Proxy available");
                                            await pdfLookup.lookup(reference);
                                        }

                                        if (!isNullOrEmpty(reference.pdf) && importPdf) {
                                            telemetry.log("Download Pdf", { pdf: reference.pdf, reference: reference });
                                            if (msg.value.length == 1) {

                                                if (msg.hasProgressDialog) {
                                                    panel.sendMessage(sender.tab.id, null, { action: MessageKeys.progressDialogProgress, val: chrome.i18n.getMessage("TryDownloadPdf") });
                                                }
                                                panel.sendProgress(sender.tab, { type: ProgressType.searchPdf, text: chrome.i18n.getMessage("TryDownloadPdf") });
                                            }
                                            var result = await citaviPicker.download(sender.tab.id, reference.pdf, citaviPicker.activeRepo.isLocal, DownloadFileType.Pdf);

                                            if ((result == null ||
                                                result.fileType != "PDF") &&
                                                !reference.upwChecked) {
                                                telemetry.log("No pdf found. Check upw", { reference: reference });
                                                var pdfUrl = reference.pdf;
                                                reference.pdf = "";
                                                if (!reference.upwChecked) {
                                                    await pdfLookup.lookup(reference);
                                                    if (reference.pdf != "" &&
                                                        pdfUrl != reference.pdf) {
                                                        telemetry.log("Pdf found via upw", { reference: reference });
                                                        result = await citaviPicker.download(sender.tab.id, reference.pdf, citaviPicker.activeRepo.isLocal, DownloadFileType.Pdf);
                                                    }
                                                    else {
                                                        telemetry.log("No pdf found via upw", { reference: reference });
                                                    }
                                                }
                                            }
                                            if (result != null &&
                                                result.fileType == "PDF") {
                                                telemetry.log("Download successfull", { pdf: reference.pdf, reference: reference });
                                                var bag = {
                                                    referenceId: referenceId,
                                                    data: citaviPicker.activeRepo.isLocal ? result.data : Uint8Array.from(result.data),
                                                    url: reference.pdf,
                                                    title: reference.title,
                                                    attachmenType: AttachmentType.referenceAttachment,
                                                    contentType: "application/pdf"
                                                };
                                                result.success = await citaviPicker.sendAttachment(bag);
                                            }
                                            else {
                                                if (result != null) {
                                                    telemetry.log("Download Pdf failed. Wrong contenttype: " + result.fileType, { pdf: reference.pdf, reference: reference });
                                                }
                                                else {
                                                    telemetry.log("Download Pdf failed", { pdf: reference.pdf, reference: reference });
                                                }
                                            }
                                        }

                                        //Cover
                                        if (reference.cover) {
                                            telemetry.log("Download Cover", { cover: reference.cover, reference: reference });
                                            var result = await citaviPicker.download(sender.tab.id, reference.cover, citaviPicker.activeRepo.isLocal, DownloadFileType.Cover);
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

                                        //HTMLToPDF
                                        if (msg.value.length === 1 && reference.htmlToPdfUrl) {
                                            var bytes = await citaviPicker.html2Pdf(sender.tab, reference);
                                            if (bytes !== null) {
                                                var bag = {
                                                    referenceId: referenceId,
                                                    data: bytes,
                                                    attachmenType: AttachmentType.referenceAttachment
                                                };
                                                result.success = await citaviPicker.sendAttachment(bag);
                                            }
                                            settings.newsPaperHtmlAsPdf = reference.importHtmlAsPdf;
                                        }
                                    }
                                    catch (e) {
                                        telemetry.error(e);
                                    }
                                }
                            }
                            else {

                                var attachmentImportTasks = [];

                                //PDF
                                for (var reference of msg.value) {
                                    if ((!isNullOrEmpty(reference.pdf) || reference.retryUpwChecked) && importPdf) {
                                        attachmentImportTasks.push(new Promise(async resolve => {
                                            var bag = {};
                                            try {

                                                if (reference.retryUpwChecked) {
                                                    //Das tritt auf, wenn man sich bei Proxy anmeldet und im Panel bereits die Titeldaten sind
                                                    //Dann wurde der Check VOR dem setzen des Proxies gemacht. 
                                                    //Muss wiederholt werden
                                                    telemetry.log("lookupPdf again - Proxy available");
                                                    await pdfLookup.lookup(reference);
                                                }
                                                if (isNullOrEmpty(reference.pdf)) {
                                                    return;
                                                }
                                                telemetry.log("Download Pdf", { pdf: reference.pdf, reference: reference });

                                                var result = await citaviPicker.download(sender.tab.id, reference.pdf, citaviPicker.activeRepo.isLocal, DownloadFileType.Pdf);

                                                if ((result == null ||
                                                    result.fileType != "PDF") &&
                                                    !reference.upwChecked) {
                                                    telemetry.log("No pdf found. Check upw", { reference: reference });
                                                    var pdfUrl = reference.pdf;
                                                    reference.pdf = "";
                                                    if (!reference.upwChecked) {
                                                        await pdfLookup.lookup(reference);
                                                        if (reference.pdf != "" &&
                                                            pdfUrl != reference.pdf) {
                                                            telemetry.log("Pdf found via upw", { reference: reference });
                                                            result = await citaviPicker.download(sender.tab.id, reference.pdf, citaviPicker.activeRepo.isLocal, DownloadFileType.Pdf);
                                                        }
                                                    }
                                                    else {
                                                        telemetry.log("No pdf found via upw", { reference: reference });
                                                    }
                                                }
                                                if (result != null &&
                                                    result.fileType == "PDF") {

                                                    bag = {
                                                        referenceId: reference.id,
                                                        data: citaviPicker.activeRepo.isLocal ? result.data : Uint8Array.from(result.data),
                                                        url: reference.pdf,
                                                        title: reference.title,
                                                        attachmenType: AttachmentType.referenceAttachment,
                                                        contentType: "application/pdf"
                                                    };
                                                    if (citaviPicker.activeRepo.isWeb) {
                                                        await citaviPicker.activeRepo.uploadAttachmentInTempContainer(bag);
                                                    }
                                                }
                                                else {
                                                    if (result != null) {
                                                        telemetry.log("Download Pdf failed. Wrong contenttype: " + result.fileType, { pdf: reference.pdf, reference: reference });
                                                    }
                                                    else {
                                                        telemetry.log("Download Pdf failed", { pdf: reference.pdf, reference: reference });
                                                    }
                                                }
                                            }
                                            finally {
                                                resolve(bag);
                                            }
                                        }));
                                    }
                                }

                                //Cover
                                for (var reference of msg.value) {
                                    if (reference.cover) {
                                        attachmentImportTasks.push(new Promise(async resolve => {
                                            var bag = {};
                                            try {

                                                telemetry.log("Download Cover", { cover: reference.cover, reference: reference });
                                                var result = await citaviPicker.download(sender.tab.id, reference.cover, citaviPicker.activeRepo.isLocal, DownloadFileType.Cover);
                                                if (result != null &&
                                                    result.data != null &&
                                                    result.data.length > 0) {
                                                    bag = {
                                                        referenceId: reference.id,
                                                        data: citaviPicker.activeRepo.isLocal ? result.data : Uint8Array.from(result.data),
                                                        url: reference.cover,
                                                        attachmenType: AttachmentType.referenceCover
                                                    };
                                                    if (citaviPicker.activeRepo.isWeb) {
                                                        await citaviPicker.activeRepo.uploadAttachmentInTempContainer(bag);
                                                    }
                                                }
                                                else {
                                                    telemetry.log("Download Cover failed", { cover: reference.cover, reference: reference });
                                                }
                                            }
                                            finally {
                                                resolve(bag);
                                            }
                                        }));
                                    }
                                }

                                //Import
                                for (var reference of msg.value) {
                                    try {
                                        if (count > 1) {
                                            var importProgressText = chrome.i18n.getMessage("ImportKindleReference") + ` (${index}/${count})`;
                                            if (msg.hasProgressDialog) {
                                                panel.sendMessage(sender.tab.id, null, { action: MessageKeys.progressDialogProgress, val: importProgressText });
                                            }
                                            panel.sendProgress(sender.tab, { type: ProgressType.import, text: importProgressText, text2: reference.title });
                                        }
                                        else {
                                            if (msg.hasProgressDialog) {
                                                panel.sendMessage(sender.tab.id, null, { action: MessageKeys.progressDialogProgress, val: chrome.i18n.getMessage("ImportKindleReference") });
                                            }
                                            panel.sendProgress(sender.tab, { type: ProgressType.import, text: chrome.i18n.getMessage("ImportKindleReference"), text2: reference.title });
                                        }
                                        index++;
                                        var info = {};
                                        if (reference.completeTitledataAfterImport) {
                                            info["completeTitledataAfterImport"] = true;
                                        }
                                        result = await citaviPicker.sendImport(reference.raw, reference.importFormat, null, senderUrl, info);
                                        if (result === null ||
                                            !result.success) {
                                            if (result.exception && count == 1) {
                                                panel.showException(sender.tab, result, "sendImport failed");
                                            }
                                            continue;
                                        }

                                        var referenceId = result.referenceId;
                                        if (referenceId !== undefined) {
                                            importedReferences.push(referenceId);
                                            reference.citaviId = referenceId;
                                        }
                                        else if (!citaviPicker.isLocal) {
                                            delete reference.pdf;
                                            delete reference.cover;
                                        }
                                    }
                                    catch (e) {
                                        telemetry.error(e);
                                    }
                                }

                                await Promise.all(attachmentImportTasks);

                                for (var attachmentImport of attachmentImportTasks) {
                                    var bag = await attachmentImport;
                                    if (bag.referenceId) {
                                        var reference = msg.value.find(r => r.id == bag.referenceId);
                                        if (msg.hasProgressDialog) {
                                            panel.sendMessage(sender.tab.id, null, { action: MessageKeys.progressDialogProgress, val: chrome.i18n.getMessage("TryDownloadPdf") });
                                        }
                                        else {
                                            panel.sendProgress(sender.tab, { type: ProgressType.import, text: chrome.i18n.getMessage("TryDownloadPdf") });
                                        }
                                        bag.referenceId = reference.citaviId;
                                        await citaviPicker.sendAttachment(bag);
                                    }
                                }

                                //HTMLToPDF
                                if (msg.value.length === 1 && reference.htmlToPdfUrl) {
                                    var bytes = await citaviPicker.html2Pdf(sender.tab, reference);
                                    if (bytes !== null) {
                                        var bag = {
                                            referenceId: reference.citaviId,
                                            data: Uint8Array.from(bytes),
                                            attachmenType: AttachmentType.referenceAttachment,
                                            contentType: "application/pdf",
                                            title: reference.title
                                        };
                                        result.success = await citaviPicker.sendAttachment(bag);
                                    }
                                    settings.newsPaperHtmlAsPdf = reference.importHtmlAsPdf;
                                }
                            }
                        }

                        if (importedReferences.length > 0) {
                            var ids = importedReferences.join(";");
                            if (ids.length > 0) {
                                await citaviPicker.sendCreateImportGroup({ referenceIds: ids });
                            }
                            chrome.tabs.sendMessage(sender.tab.id, { action: MessageKeys.updateDuplicateState });
                        }
                    }
                    catch (e) {
                        telemetry.error(e);
                    }
                    finally {

                        if (importedReferences.length > 1) {
                            panel.sendImportSuccessProgress(sender.tab, "ReferenceSentToCitavi_Plural");
                        }
                        else {
                            panel.sendImportSuccessProgress(sender.tab, "ReferenceSentToCitavi");
                        }
                        sendResponse(result);
                    }
                }
                break;

            case MessageKeys.lookupBibliography:
                {
                    try {
                        var jobId = msg.obj.jobId;
                        var reference = msg.obj.reference;
                        var success = await bibLookup.lookup(reference, sender.tab);
                        sendResponse({ success: success, reference: reference });
                    }
                    catch (e) {
                        telemetry.error(e);
                        sendResponse({ success: false, reference: null });
                    }
                }
                break;

            case MessageKeys.telemetry:
                {
                    switch (msg.severityLevel) {
                        case SeverityLevel.Error:
                        case SeverityLevel.Critical:
                            {
                                telemetry.error(msg.exception, msg.params);
                            }
                            break;
                        case SeverityLevel.Information:
                            {
                                telemetry.info(msg.message, msg.params);
                            }
                            break;
                        case SeverityLevel.Verbose:
                            {
                                telemetry.log(msg.message, msg.params);
                            }
                            break;
                        case SeverityLevel.Warning:
                            {
                                telemetry.warn(msg.message, msg.params);
                            }
                            break;
                    }
                }
                break;

            case MessageKeys.proxyCancel:
                {
                    settings.showProxyInfo = false;
                }
                break;

            case MessageKeys.proxyLogin:
                {
                    var url = msg.url;
                    Proxy.create(url, (p) =>
                    {
                        pdfLookup.proxy = p;
                        if (pdfLookup.proxy != null) {
                            panel.broadcast({ action: MessageKeys.proxyLoggedIn, value: pdfLookup.proxy });
                            pdfLookup.resetCache(null);
                        }
                    });
                }
                break;

            case MessageKeys.reportBug:
                {

                    try {
                        msg.params["Subject"] = "Bug report - Citavi Picker (" + runtimeInfo.browserName + ")";
                        if (isNullOrUndefined(msg.params["SessionId"])) {
                            msg.params["SessionId"] = settings.aiSessionId;
                        }
                        await account.post("reportbug", msg.params, []);
                        sendResponse(true);
                    }
                    catch (e) {
                        telemetry.error(e);
                        sendResponse(false);
                    }
                }
                break;

            case MessageKeys.refreshPanel:
                {
                    panel.sendMessage(sender.tab.id, null, { action: MessageKeys.refreshPanel });
                }
                break;

            case MessageKeys.restoreAnnotations:
                {
                    annotationService.update(msg.url, sender.tab);
                }
                break;

            case MessageKeys.getSettings:
                {
                    var bag = {};
                    for (var name in SettingNames) {
                        if (name == SettingNames.blackList) continue;
                        bag[name] = settings[name];
                    }
                    sendResponse(bag);
                }
                break;

            case MessageKeys.setSettings:
                {
                    switch (msg.type) {

                        case SettingNames.aiSeverityLevel:
                            {
                                settings.aiSeverityLevel = msg.value;
                            }
                            break;

                        case SettingNames.autoShowDuplicateReference:
                            {
                                settings.autoShowDuplicateReference = msg.value;
                            }
                            break;

                        case SettingNames.buildType:
                            {
                                settings.buildType = msg.value;
                                account = new CitaviAccount();
                            }
                            break;

                        case SettingNames.detectReferenceIdentifier:
                            {
                                settings.detectReferenceIdentifier = msg.value;
                            }
                            break;

                        case SettingNames.developerMode:
                            {
                                settings.developerMode = msg.value;
                                if (!settings.developerMode) {
                                    settings.buildType = BuildTypes.Release;
                                }
                            }
                            break;

                        case SettingNames.enableHunter:
                            {
                                settings.enableHunter = msg.value;
                            }
                            break;

                        case SettingNames.lookupBibliography:
                            {
                                settings.lookupBibliography = msg.value;
                            }
                            break;

                        case SettingNames.importPdf:
                            {
                                settings.importPdf = msg.value;
                            }
                            break;
                    }
                    if (sendResponse) {
                        sendResponse();
                    }
                }
                break;

            case MessageKeys.showCitaviEntity:
                {
                    citaviPicker.showCitaviEntity(msg.id);
                }
                break;

            case MessageKeys.takeScreenshot:
                {
                    await new Screenshot().initalize(sender.tab);
                    sendResponse();
                    panel.close(sender.tab);
                }
                break;

            case MessageKeys.sendScreenshotAsAttachment:
                try {
                    
                    panel.sendProgress(sender.tab, { type: ProgressType.import, text: chrome.i18n.getMessage("ReferenceDataSentToCitavi") });

                    var res = await fetch(msg.bag.data);
                    msg.bag.data = await res.blob();
                    await citaviPicker.sendAttachment(msg.bag);
                    
                }
                finally {
                    panel.sendImportSuccessProgress(sender.tab, "ReferenceDataSentToCitavi");
                    sendResponse();
                }
                break;
        }

    }
    catch (e) {
       telemetry.error(e);
    }
}







