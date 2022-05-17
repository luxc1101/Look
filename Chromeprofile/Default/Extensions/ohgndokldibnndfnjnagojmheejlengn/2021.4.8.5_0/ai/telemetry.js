//https://github.com/Microsoft/ApplicationInsights-JS/blob/master/API-reference.md

class Telemetry {
    
    constructor() {
        this.ignoreErrorMsgs = [
            "The tab was closed",
            "No tab with id",
            "Attempting to use a disconnected port object",
            "The message port closed before a response was received",
            "The extensions gallery cannot be scripted",
            "Cannot access a chrome://",
            "Could not establish connection. Receiving end does not exist",
            "The storage API will not work with a temporary addon ID" //Firefox Dev Add-Ons
        ];
        this.ignoreWarningMsgs = [
            "The tab was closed",
        ];
        this.treatErrorAsWarningMsgs = [
            "NetworkError when attempting to fetch resource.",
            "Access to the native messaging host was disabled by the system administrator.",
            "Native Messaging is not supported on this platform.",
            "No matching message handler",
            "This is not supported on tabs in Internet Explorer Mode",
            "An unexpected error occurred",
            "Missing host permission for the tab",
            "Message manager disconnected",
            "Cannot access a chrome-extension:// URL of different extension",
            "Cannot access \"about:blank\" at origin",
            "Invalid tab ID",
            "Failed to fetch",
            "IO error: .../MANIFEST-000001: Unable to create sequential file",
            "Cannot access contents of url",
            "Failed to start native messaging host",
            "Error when communicating with the native messaging host",
            "Access to the specified native messaging host is forbidden",
            "Attempt to postMessage on disconnected port",
            "Native host has exited.",
            "Specified native messaging host not found",
            "nsIXPCComponents_Utils.evalInSandbox", //Component returned failure code: 0x80070057 (NS_ERROR_ILLEGAL_VALUE) [nsIXPCComponents_Utils.evalInSandbox]
            "The message port closed before a reponse was received."
        ];

        this._operationName = "";
        this._severityLevel = SeverityLevel.None;
        this._sessionId = "";
        this._stackRgx = /^([\s]+at)?(.*?)(\@|\s\(|\s)([^\(\@\n]+):([0-9]+):([0-9]+)(\)?)$/;

        this._payloads = [];
        this._isBusy = false;
    }

    get sessionId() {
        if (isNullOrEmpty(this._sessionId)) {
            this._sessionId = guid();
        }
        return this._sessionId;
    }
    set sessionId(sId) {
        this._sessionId = sId;
    }

    get severityLevel() {
        return this._severityLevel;
    }
    set severityLevel(level) {
        this._severityLevel = level;
    }

    get operationName() {
        return this._operationName;
    }
    set operationName(name) {
        this._operationName = name;
    }

    get tags() {
        return {
            "ai.application.ver": runtimeInfo.pickerVersion,
            "ai.application.name": runtimeInfo.browserName + " Picker",
            "ai.internal.sdkVersion": "javascript:1.0.18",
            "ai.operation.name": this.operationName,
            "ai.session.id": this.sessionId,
        };
    }

    init() {
        this.interval = window.setInterval(() => this.flush(), 5000);
    }

    error(e, params) {

        if (!this.validateError(e)) return;

        if (e.params != undefined) {
            params = e.params;
        }

        if (params != undefined) {
            console.warn(e, params);
        }
        else {
            console.warn(e);
        }

        try {
            if (isString(e)) {
                var ex = new Error(e);
                params = this.validateParams(params);
                this.trackException(ex, params, SeverityLevel.Error);
            }
            else {
                params = this.validateParams(params);
                this.trackException(e.message, params, SeverityLevel.Error);
            }
        }
        catch (e) {
            console.error(e);
        }
    }

    info(text, params) {
        if (text == null) return;
        if (text == "") return;

        if (params != undefined) {
            console.info(text, params);
        }
        else {
            console.info(text);
        }

        params = this.validateParams(params, (new Error()).stack);
        this.trackTrace(text, params, SeverityLevel.Information);
    }

    table(obj, params) {
        if (obj == null) return;
        if (obj == "") return;

        if (params != undefined) {
            console.table(obj, params);
        }
        else {
            console.table(obj);
        }
    }

    log(text, params) {
        if (text == null) return;
        if (text == "") return;

        if (params != undefined) {
            console.log(text, JSON.stringify(params));
        }
        else {
            console.log(text);
        }
      
        params = this.validateParams(params, (new Error()).stack);
        this.trackTrace(text, params, SeverityLevel.Verbose);
    }

    warn(text, params) {

        if (isNullOrEmpty(text)) {
            return;
        }
        if (isString(text)) {
            for (var key of this.ignoreWarningMsgs) {
                if (text.indexOf(key) !== -1) {
                    return false;
                }
            }
        }

        params = this.validateParams(params, (new Error()).stack);

        if (params != undefined) {
            console.warn(text, params);
        }
        else {
            console.warn(text);
        }
        this.trackTrace(text, params, SeverityLevel.Warning);
    }

    validateError(e) {
        if (isString(e)) {
            for (var key of this.ignoreErrorMsgs) {
                if (e.indexOf(key) !== -1) {
                    return false;
                }
            }
            for (var key of this.treatErrorAsWarningMsgs) {
                if (e.indexOf(key) !== -1) {
                    this.warn(e);
                    return false;
                }
            }
            return true;
        }
        if (!isNullOrUndefined(e.message)) {
            return this.validateError(e.message);
        }
        //e.message ist undefined
        this.warn(e);
        return false;
    }

    validateParams(params, stack) {
        if (isNullOrUndefined(params)) {
            params = {};
        }
        else if (typeof params !== 'object') {
            params = { item1: params };
        }
        else {
            params = JSON.parse(JSON.stringify(params));
        }
        for (var par in params) {
            if (par === "url") {
                if (settings.aiSeverityLevel !== SeverityLevel.Verbose) {
                    params[par] = "---";
                }
            }
            var val = params[par];
            if (typeof val === 'object') {
                if (isNullOrUndefined(val)) continue;
                params[par] = JSON.stringify(val);
            }
        }
        if (!isNullOrUndefined(stack)) {
            var stacktrace = stack.toString();
            stacktrace = stacktrace.replace("Error", "").trim();
            stacktrace = stacktrace.replace(/^.+?at\s/g, '\r\nat ');
            params.stack = stacktrace;
        }
        return params;
    }

    trackException(e, properties, severityLevel) {
        if (settings === undefined) {
            var msg = { action: MessageKeys.telemetry, severityLevel: SeverityLevel.Error };
            msg.exception = e;
            msg.params = properties;
            chrome.runtime.sendMessage(msg, () => { });
            return;
        }
        try {
            var parsedStack = [];
            if (e.stack !== undefined) {
                var stacks = e.stack.split("\n");
                for (var stack of stacks) {
                    if (this._stackRgx.test(stack)) {
                        var matches = this._stackRgx.exec(stack);
                        var obj = {};
                        obj.assembly = stack.trim();
                        if (matches && matches.length >= 5) {
                            obj.method = matches[2].trim();
                            obj.fileName = matches[4].trim();
                            obj.line = parseInt(matches[5]) || 0;
                            obj.level = parsedStack.length;
                            if (obj.method === "") {
                                obj.method = "unknown";
                            }
                        }
                        parsedStack.push(obj);
                    }
                }
            }
            let payload = {
                "data": {
                    "baseType": "ExceptionData",
                    "baseData": {
                        "ver": "2",
                        "severityLevel": severityLevel,
                        "properties": properties,
                        "exceptions": [
                            {
                                "message": e.message,
                                "hasFullStack": true,
                                "stack": e.stack,
                                "parsedStack": parsedStack,
                                "typeName": "Error"
                            }
                        ]
                    },
                },
                "tags": this.tags,
                "ver": 1,
                "name": `Microsoft.ApplicationInsights.${settings.AIInstrumentationKey.replace(/-/g, "")}.Exception`,
                "time": new Date().toISOString(),
                "iKey": settings.AIInstrumentationKey
            };
            if (severityLevel < settings.aiSeverityLevel) {
                return;
            }
            this._payloads.push(payload);
        }
        catch (e) {
            console.error(e);
        }
    }

    trackTrace(text, properties, severityLevel) {
        if (settings === undefined) {
            var msg = { action: MessageKeys.telemetry, severityLevel: severityLevel };
            msg.message = text;
            msg.params = properties;
            chrome.runtime.sendMessage(msg, () => { });
            return;
        }
        try {
            let payload = {
                "data": {
                    "baseType": "MessageData",
                    "baseData": {
                        "ver": "2",
                        "message": text,
                        "severityLevel": severityLevel,
                        "properties": properties
                    }
                },
                "tags": this.tags,
                "ver": 1,
                "name": `Microsoft.ApplicationInsights.${settings.AIInstrumentationKey.replace(/-/g, "")}.Message`,
                "time": new Date().toISOString(),
                "iKey": settings.AIInstrumentationKey
            };
            if (severityLevel < settings.aiSeverityLevel) {
                return;
            }
            this._payloads.push(payload);
        }
        catch (e) {
            console.error(e);
        }
    }

    async flush() {

        if (this._isBusy) {
            return;
        }

        if (this._payloads.length === 0) {
            return;
        }

        try {

            this._isBusy = true;

            let headers = {
                'content-type': 'application/json',
            };

            let response = await fetch("https://dc.services.visualstudio.com/v2/track", {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(this._payloads)
            });

            var responseText = await response.json();
            if (responseText.errors.length > 0) {
                console.warn(responseText);
            }
        }
        catch (e) {
            console.error(e);
        }
        finally {
            this._payloads = [];
            this._isBusy = false;
        }
    }
}

var telemetry = new Telemetry();