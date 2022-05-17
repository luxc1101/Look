class Proxy {

    constructor(type, url) {
        this._type = type;
        this._url = url;
        try {
            var u = new URL(url);
            this._domain = u.host;
        }
        catch (e) {
            telemetry.error(e);
        }
    }

    get domain() {
        return this._domain;
    }

    get isEZProxy() {
        return this.type === ProxyType.EZProxy;
    }

    get isHAN() {
        return this.type === ProxyType.HAN;
    }

    get type() {
        return this._type;
    }

    get url() {
        return this._url;
    }

    static create(url, callback) {
        var proxy = null;
        chrome.tabs.create({ 'url': url }, (proxyTab) => {

            var onUpdate = (tabId, changeInfo, tab) => {
                if (tabId === proxyTab.id) {
                    chrome.tabs.executeScript(tabId,
                        {
                            code: "var x = {source:document.body.innerHTML, cookie:document.cookie, url: document.URL}; x;"
                        },
                        (response) => {
                            if (chrome.runtime.lastError != null) {
                                console.error(chrome.runtime.lastError);
                                return;
                            }
                            if (response != null && response.length > 0) {
                                var source = response[0];
                                if (proxy !== null) {
                                    return;
                                }
                                if (!isNullOrEmpty(source.cookie)) {
                                    var cookieNames = [];
                                    for (var cookie of source.cookie.split(';')) {
                                        if (cookie.indexOf("=") == -1) continue;
                                        var cookieName = cookie.split('=')[0].trim();
                                        cookieNames.push(cookieName);
                                    }
                                    for (var cookie of source.cookie.split(';')) {
                                        if (cookie.indexOf("=") == -1) continue;
                                        var cookieName = cookie.split('=')[0].trim();
                                        var cookieValue = cookie.split('=')[1].trim();
                                        if (cookieName == "HHAUTHID" &&
                                            (cookieNames.indexOf("HHCALLINGURL") == -1 || cookieNames.indexOf("HANID") != -1) //Via SAML
                                            ) {
                                            telemetry.log("Login complete. Set HAN Proxy: " + url);
                                            proxy = new HAN(url);
                                            proxy.authId = cookieValue;
                                            chrome.tabs.onUpdated.removeListener(onUpdate);
                                            chrome.tabs.onRemoved.removeListener(onRemoved);
                                            chrome.tabs.remove(tabId);
                                            callback(proxy);
                                            break;
                                        }
                                        if (cookieName === "ezproxy")
                                        {
                                            telemetry.log("Login complete. Set EZProxy Proxy: " + url);
                                            proxy = new EZProxy(url, source.cookie);
                                            chrome.tabs.onUpdated.removeListener(onUpdate);
                                            chrome.tabs.onRemoved.removeListener(onRemoved);
                                            chrome.tabs.remove(tabId);
                                            callback(proxy);
                                            break;
                                        }
                                    }
                                }
                            }
                        });
                }
            };

            var onRemoved = (tabId, changeInfo, tab) => {
                if (tabId === proxyTab.id) {
                    chrome.tabs.onUpdated.removeListener(onUpdate);
                    chrome.tabs.onRemoved.removeListener(onRemoved);
                    callback(null);
                } 
            };

            chrome.tabs.onUpdated.addListener(onUpdate);
            chrome.tabs.onRemoved.addListener(onRemoved);
            chrome.tabs.update(proxyTab.id, { 'url': url });
        });
    }
}