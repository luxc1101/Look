class Permissions {
    constructor() {
    }

    isApiAvailable(name) {
        try {
            switch (name) {
                case PermissonAPINames.contextMenus:
                    {
                        //Firefox Mobile 68.0: chrome.contextMenus is undefined
                        return !isNullOrUndefined(chrome.contextMenus);
                    }
                    break;

                case PermissonAPINames.identity:
                    {
                        //Firefox Mobile 68.0: chrome.identity is undefined
                        return !isNullOrUndefined(chrome.identity);
                    }
                    break;
            }
        }
        catch (e) {
            telemetry.error(e);
            return false;
        }
        return true;
    }

    hasUrlPermission(url) {
        try {
            if (isNullOrEmpty(url) || isNullOrUndefined(url)) return false;
            if (url.startsWith("file:/")) return false;
            if (url.startsWith("chrome-extension:")) return false;
            if (url.startsWith("moz-extension:")) return false;
            if (url.startsWith("https://4809aec236656fcbe688f735278214f28a2c7c65.extensions.allizom.org")) return false;
            if (url.startsWith("chrome-error:")) return false;
            if (url.startsWith("about:")) return false;
            if (url.startsWith("chrome:")) return false;
            if (url.startsWith("blob:")) return false;
            if (url.startsWith("devtools://")) return false;
            if (url.indexOf("chrome/newtab") != -1) return false;
            if (url.indexOf("chrome.google.com/webstore/") != -1) return false;
            if (url.startsWith("chrome-search:")) return false;
            if (url.startsWith("view-source:")) return false;
            if (url.indexOf("@") !== -1) return false; //is an url with embedded credentials.
        }
        catch (e) {
            telemetry.error(e);
        }

        return true;
    }

    hasTabPermisson(tab) {
        try {
            if (isNullOrUndefined(tab)) return false;
            if (!this.hasUrlPermission(tab.url)) return false;
            if (!isNullOrEmpty(tab.title)) {
                if (tab.title.startsWith("chrome-extension:")) return false;
                if (tab.title.startsWith("moz-extension:")) return false;
                if (tab.title.startsWith("chrome-error:")) return false;
                if (tab.title.startsWith("moz-error:")) return false;
                if (tab.title.startsWith("chrome:")) return false;
            }
        }
        catch (e) {
            telemetry.error(e);
            return false;
        }
        return true;
    }
}

const PermissonAPINames = {
    contextMenus: "chrome.contextMenus",
    identity: "chrome.identity",
};