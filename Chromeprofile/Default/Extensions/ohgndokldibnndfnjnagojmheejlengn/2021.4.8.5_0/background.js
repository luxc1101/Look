//Fields
let msgBox = new MsgBox();
let citaviPicker = new CitaviPicker();
let settings = new Settings();
let permissions = new Permissions();
let pdfLookup = new PdfLookup();
let coverLookup = new CoverLookup();
let bibLookup = new BibliographyLookup();
let account;
let panel = new Panel();
let contextMenuEventhandler = new ContextMenuEventhandler();
let importJobs = [];
var contextMenu = new ContextMenu();
let referenceLookup = new ReferenceLookup();
let annotationService = new AnnotationService();
let backoffice = new BackOffice();

//Listeners
chrome.runtime.onMessage.addListener(performCommand);
chrome.tabs.onActivated.addListener((activeInfo) => contextMenu.initalize(activeInfo.tabId));
chrome.browserAction.onClicked.addListener((tab) => panel.toggle(tab));


function loadJsFile(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            callback((xhr.status == 200) || (xhr.status == 304), xhr.responseText);
        }
    };
    xhr.onerror = function () {
        callback(false, undefined);
    };
    xhr.open("GET", url, true);
    xhr.send();
}

//NICHT supported in FF
//chrome.runtime.sendMessage("fneidadefimoalbgjnfgkcjpclpkbadf", { message: "version" }, console.log)
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    if (request) {
        if (request.message) {
            if (request.message == "version") {
                sendResponse(runtimeInfo.pickerVersion);
            }
        }
    }
    return true;
});

//Extensions
chrome.tabs.sendMessageEx = (tabId, message, checkCitaviRunningState, enviroment, responseCallback) => {
    if (enviroment == null) {
        getEnvironment((env) => {
            message.environment = env;
            chrome.tabs.sendMessage(tabId, message, {}, () => {
                if (!isNullOrUndefined(chrome.runtime.lastError)) {
                    if (chrome.runtime.lastError.message.indexOf("Promised response from onMessage listener at") !== -1 &&
                        chrome.runtime.lastError.message.indexOf("went out of scope") !== -1) {
                        telemetry.warn(chrome.runtime.lastError.message);
                    }
                    else {
                        telemetry.error(chrome.runtime.lastError.message);
                    }
                }
                if (responseCallback != null) {
                    responseCallback();
                }
            });
        }, checkCitaviRunningState);
    }
    else {
        message.environment = enviroment;
        chrome.tabs.sendMessage(tabId, message, {}, () => {
            if (!isNullOrUndefined(chrome.runtime.lastError)) {
                if (chrome.runtime.lastError.message.indexOf("Promised response from onMessage listener at") !== -1 &&
                    chrome.runtime.lastError.message.indexOf("went out of scope") !== -1) {
                    telemetry.warn(chrome.runtime.lastError.message);
                }
                else {
                    telemetry.error(chrome.runtime.lastError.message);
                }
            }
            if (responseCallback != null) {
                responseCallback();
            }
        });
    }
};

var localRepo = new LocalRepo();
var webRepo = new WebRepo();


async function initalize() {
    await settings.load();

    if (isNullOrEmpty(settings.aiSessionId)) {
        settings.aiSessionId = guid();
    }
    telemetry.init();
    account = new CitaviAccount();

    await localRepo.init();
    await webRepo.init();

    citaviPicker.addRepo(localRepo);
    citaviPicker.addRepo(webRepo);
   
    if (!localRepo.connected) {
        citaviPicker.changeRepo(webRepo.type);
    }
    else if (isNullOrEmpty(settings.projectKey)) {
        citaviPicker.changeRepo(localRepo.type);
    }
    else {
        citaviPicker.changeRepo(settings.repo);
    }

    telemetry.log("Local citavi installed: " + localRepo.connected);
    telemetry.log("Active repo: " + citaviPicker.activeRepo.type);
    if (!isNullOrUndefined(settings.projectKey)) {
        telemetry.log("Current project: " + settings.projectKey);
    }
    else {
        telemetry.log("Current project: null");
    }

    if (settings.lastLogin !== "") {
        telemetry.log("try silent login");
        settings.lastLogin = "";
        account.oauth.renew(false);
    }
}

async function initalizeHunters() {
    await initalizeTask;
    hunters.sort();
    for (var hunter of hunters.innerList) {
        var url = chrome.extension.getURL("hunter/hunters/" + hunter.fileName);
        var response = await fetch(url);
        hunter.source = await response.text();
        if (hunter.source.indexOf("this.citaviVersion = 6;") !== -1) {
            if (citaviPicker.activeRepo != null && citaviPicker.activeRepo.isCitavi5) {
                hunter.source = hunter.source.replace("this.citaviVersion = 6;", "this.citaviVersion = 5;");
            }
        }
    }
}

function getEnvironment(callback, checkCitaviRunningState) {
    var environment = {};
    environment.pickerVersion = runtimeInfo.pickerVersion;
    environment.accountAvailable = localRepo.version_major >= 6;
    environment.localAvailable = localRepo.connected;
    environment.account = {};
    environment.account.user = account.user;
    environment.currentProject = null;

    if (settings.showProxyInfo) {
        if (settings.proxyName != "0") {
            //environment.proxyUrl = settings.proxyUrl;
            //environment.proxyName = settings.proxyName;
            //environment.proxy = pdfLookup.proxy;
        }
    }

    environment.buildType = settings.buildType;

    if (!localRepo.connected) {
        citaviPicker.changeRepo(webRepo.type);
    }
    else if (account.user == null && settings.repo == webRepo.type) {
        telemetry.log("Not connected. Change repo: web -> local");
        citaviPicker.changeRepo(localRepo.type);
    }
    environment.sessionId = settings.aiSessionId;

    if (!isNullOrEmpty(settings.projectKey)) {
        var projectKey = settings.projectKey;
        if (account.user != null) {
            environment.currentProject = account.user.ProjectRoles.find((e) => e.ProjectKey == projectKey);
            if (environment.currentProject == null && settings.repo == Constants.WebRepo) {
                if (account.user.ProjectRoles.length > 0) {
                    environment.currentProject = account.user.ProjectRoles[0];
                }
            }
            else if (environment.currentProject != null) {
                citaviPicker.changeRepo(webRepo.type);
            }
        }
        else if (localRepo.connected) {
            environment.currentProject = null;
            citaviPicker.changeRepo(localRepo.type);
        }
    }
    else {
        environment.currentProject = null;
        if (localRepo.connected) {
            citaviPicker.changeRepo(localRepo.type);
        }
    }
    environment.repo = settings.repo;

    if (checkCitaviRunningState && environment.localAvailable && environment.currentProject == null) {
        //Diese Zeile wird zu einer Verzögerung beim Öffnen des Panels führen.
        citaviPicker.citaviIsRunning(false, (isRunning) => {
            environment.citaviIsRunning = isRunning;
            telemetry.log("citavi is running: " + isRunning);
            callback(environment);
        });
    }
    else {
        callback(environment);
    }
}

var initalizeTask = initalize();
var hunterTask = initalizeHunters();






