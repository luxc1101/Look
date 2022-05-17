 //BSP: https://www.ncbi.nlm.nih.gov/pubmed/29466827

class EZProxy extends Proxy {

    constructor(url, cookies) {
        super(ProxyType.EZProxy, url);
        this._cookies = cookies;
        this.host = new URL(url).host;
    }

    get cookies() {
        return this._cookies;
    }

    buildUrl(url) {
        var ezProxyUrl = this.url;

        var u = new URL(url);
        if (u.host == this.host ||
            u.host.indexOf(this.host) !== -1) {
            return url;
        }

        try {
            if (url.indexOf("login?url=") !== -1) {
                ezProxyUrl = url;
            }
            else if (ezProxyUrl.endsWith("?")) {
                ezProxyUrl = ezProxyUrl + "url=" + url;
            }
            else if (ezProxyUrl.endsWith("/login")) {
                ezProxyUrl = ezProxyUrl + "?url=" + url;
            }
            else if (ezProxyUrl.endsWith("/")) {
                ezProxyUrl = ezProxyUrl + "login?url=" + url;
            }
            else {
                ezProxyUrl = ezProxyUrl + "/login?url=" + url;
            }

            if (ezProxyUrl.indexOf("login?url=/login?url=") !== -1) {
                ezProxyUrl = ezProxyUrl.replace("login?url=/login?url=", "login?url=");
            }

            telemetry.log("Url: " + url + "\r\nEZProxy Url: " + ezProxyUrl);
        }
        catch (e) {
            telemetry.error(e);
        }
        return ezProxyUrl;
    }

    async fetch(url) {
        url = this.buildUrl(url);

        var response = await fetch(url, {
            redirect: 'follow'
        });

        return response;
    }
}