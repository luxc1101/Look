class HAN extends Proxy {
    //https://opacplus.bsb-muenchen.de/search?id=springer_jour10.1007/s12599-017-0467-3&db=255&View=default

    constructor(url) {
        super(ProxyType.HAN, url);
        this._authId = "";
        this._apiId = "citavi";
        this._loginUrl = url;
        var uri = new URL(url);
        this._baseUrl = uri.protocol + "//" + uri.host.replace("login.", "");
        this._apiUrl = uri.protocol + "//" + uri.host.replace("login.", "") + "/hanapi/?method=getHANID&return=1&id=" + this._apiId;
    }

    set authId(id) {
        this._authId = id;
    }


    async fetchDoi(doi) {
        try {
            var url = this._apiUrl + "&doi=" + doi;
            var response = await fetch(url);
            var json = await response.json();
            telemetry.log(json);
            if (json["count"] > 0) {
                for (var script of json["scripts"]) {
                    if (script.fulltext !== undefined &&
                        !isNullOrEmpty(script.fulltext)) {
                        var url = this._baseUrl + script.fulltext;
                        telemetry.log("PDF found via HAN: " + url);
                        return url;
                    }
                }
            }
            else {
                telemetry.log("No PDF found via HAN: " + doi);
            }
        }
        catch (e) {
            telemetry.error(e);
        }
        return null;
    }
}