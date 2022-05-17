class OAuth {
    constructor(host) {
        this.host = host;

        if (runtimeInfo.isChrome) {
            if (runtimeInfo.isEdge) {
                this.clientID = "MicrosoftEdgePickerClient";
            }
            else {
                this.clientID = "GoogleChromePickerClient";
            }
        }
        else {
            this.clientID = "FirefoxPickerClient";
        }
        if (permissions.isApiAvailable(PermissonAPINames.identity)) {
            this.redirectUrl = chrome.identity.getRedirectURL();
            if (this.redirectUrl.endsWith("/")) {
                this.redirectUrl = this.redirectUrl.slice(0, -1);
            }
        }
        else {
            this.redirectUrl = null;
            telemetry.warn("chrome.identity api is not available");
        }

        this.silentRenewUrl = chrome.runtime.getURL("web/_sr.html");

        telemetry.log("ClientId: " + this.clientID);
        telemetry.log("SilentRenewUrl: " + this.silentRenewUrl);
        telemetry.log("RedirectUrl: " + this.redirectUrl);

        this.accessToken;
        this.idToken;
        this.expires_in;
        this.expires_at;
    }

    buildAuthUrl(state, redirectUrl) {
        var url = this.host + 'identity/connect/authorize?client_id=' + this.clientID + '&redirect_uri=' + encodeURIComponent(redirectUrl) + '&scope=openid+webapi';
        url += "&response_type=id_token+token";
        url += "&nonce=" + guid() + "&" + "state=" + state;

        return url;
    }

    login(callback) {
        if (this.redirectUrl === null) {
            callback(false);
            return;
        }
        var state = guid();
        var url = this.buildAuthUrl(state, this.redirectUrl);
        var self = this;
        if (runtimeInfo.isFirefox) {
            chrome.identity.launchWebAuthFlow({
                interactive: true,
                url: url
            }, (redirectUri) => {
                if (isNullOrUndefined(redirectUri)) {
                    callback(false);
                    return;
                }
                let m = redirectUri.match(/[#?](.*)/);
                if (!m || m.length < 1) {
                    callback(false);
                    return;
                }
                var ok = self.parseAuthUrl(m[1].split("#")[0], state);
                callback(ok);
            });
        }
        else {
            chrome.tabs.create({ 'url': url }, (authTab) => {
                chrome.tabs.onUpdated.addListener(function onAuth(tabId, changeInfo, tab) {
                    if (tabId === authTab.id) {
                        if (tab.url.startsWith(self.redirectUrl)) {
                            chrome.tabs.remove(tabId);
                            var ok = self.parseAuthUrl(tab.url, state);
                            chrome.tabs.onUpdated.removeListener(onAuth);
                            callback(ok);
                        }
                    }
                });

                chrome.tabs.update(authTab.id, { 'url': url });
            });
        }
    }

    logout() {
        var url = this.host + "identity/connect/endsession?id_token_hint=" + this.idToken + "&post_logout_redirect_uri=" + encodeURIComponent(this.redirectUrl);
        var self = this;
        if (runtimeInfo.isFirefox) {
            chrome.identity.launchWebAuthFlow({
                interactive: false,
                url: url
            }, (redirectUri) => {
                self.onLoggedOut();
                return;
            });
        }
        else {
            chrome.tabs.create({ 'url': url }, (authTab) => {
                chrome.tabs.onUpdated.addListener(function onAuth(tabId, changeInfo, tab) {
                    if (tabId === authTab.id) {
                        if (tab.url.startsWith(self.redirectUrl) ||
                            tab.url.indexOf("ebknlgmfnfjagpagnhhfecefabfdlolk") != -1) {
                            chrome.tabs.remove(tabId);
                            chrome.tabs.onUpdated.removeListener(onAuth);
                            self.onLoggedOut();
                        }
                    }
                });

                chrome.tabs.update(authTab.id, { 'url': url });
            });
        }
    }

    renew(accountMustBeLoggedIn) {
        if (accountMustBeLoggedIn &&
            !account.isLoggedIn) {
            return;
        }
        this.silentRenewState = guid();
        var url = this.buildAuthUrl(this.silentRenewState, this.silentRenewUrl);
        url += "&prompt=none";
        var self = this;
        if (runtimeInfo.isFirefox) {
            url = this.buildAuthUrl(this.silentRenewState, chrome.identity.getRedirectURL().slice(0, -1));
            url += "&prompt=none";

            telemetry.log("renew accesstoken via launchWebAuthFlow");
            chrome.identity.launchWebAuthFlow({
                interactive: false,
                url: url
            }, (redirectUri) => {
                try {
                    if (isNullOrUndefined(redirectUri)) {
                        if (accountMustBeLoggedIn) {
                            telemetry.error("Failed to renew accesstoken", chrome.runtime.lastError.message);
                        }
                        self.onLoggedOut();
                        return;
                    }
                    let m = redirectUri.match(/[#?](.*)/);
                    performCommand_({ action: "updateAccessToken", obj: m[1].split("#")[0] });
                }
                catch (e) {
                    telemetry.error(e);
                }
            });
        }
        else {
            var frame = document.getElementById("renewAccessTokenFrame");
            if (frame != null) frame.parentNode.removeChild(frame);

            frame = document.createElement("iframe");
            frame.id = "renewAccessTokenFrame";
            frame.src = url;
            frame.style.display = "none";

            document.body.appendChild(frame);
        }
    }

    update(hash) {
        return this.parseAuthUrl(hash, this.silentRenewState);
    }

    parseAuthUrl(url, state) {
        try {

            var responseState = /state=([^&]+)/.exec(url)[1];
            if (state != responseState) {
                telemetry.warn("Login failed. state != responseState");
                return false;
            }
            if (url.indexOf("#error=login_required") != -1) {
                telemetry.log("Not logged in - login_required");
                this.onLoginFailed();
                return false;
            }
            if (url.indexOf("access_token") == -1) {
                telemetry.warn("Login failed. No AccessToken.");
                this.onLoginFailed();
                return false;
            }

            this.accessToken = /access_token=([^&]+)/.exec(url)[1];
            this.idToken = /id_token=([^&]+)/.exec(url)[1];
            this.expires_in = parseInt(/expires_in=([^&]+)/.exec(url)[1]);
            let now = parseInt(Date.now());
            this.expires_at = new Date(now + this.expires_in);

            var next = (this.expires_in - 60 * 10) * 1000;

            telemetry.log("Accesstoken expires_at: " + this.expires_at + ". Start timer: " + (next / 1000) / 60 + " min.");
            window.setTimeout(() => this.renew(true), next);

            settings.lastLogin = Date.now().toString();

            account.onRenewAccessToken();

            return true;
        }
        catch (e) {
            telemetry.error(e);
            this.onLoginFailed();
            return false;
        }
    }

    onLoginFailed() {
        var sendMsg = this.accessToken != null;

        this.accessToken = null;
        this.idToken = null;
        this.expires_in = null;
        this.expires_at = null;

        settings.lastLogin = "";

        if (sendMsg) {
            performCommand_({ action: MessageKeys.onLoggedOut });
        }
    }

    onLoggedOut() {
        telemetry.log("onLoggedOut");
        this.accessToken = null;
        this.idToken = null;
        this.expires_in = null;
        this.expires_at = null;

        settings.lastLogin = "";

        performCommand_({ action: MessageKeys.onLoggedOut });
    }
}