class CoverLookup {
    constructor() {
        this.url = "https://backoffice6.citavi.com/api/cover/";
        this.cache = {};
    }

    async lookup(reference) {
        try {
            if (isNullOrEmpty(reference.isbn)) {
                return;
            }
            if (!isNullOrEmpty(reference.cover)) {
                return;
            }
            if (this.cache[reference.isbn] !== undefined) {
                return this.cache[reference.isbn];
            }

            var response = await fetch(this.url + "get?isbn=" + reference.isbn);
            var result = await response.text();
            if (!isNullOrEmpty(result) && result !== "null") {
                reference.cover = result.replace(/\"/g, "").trim();
                this.cache[reference.isbn] = result;
                return true;
            }
            this.cache[reference.isbn] = null;
        }
        catch (e) {
            telemetry.error(e);
        }
        return false;
    }

    resolveUrl(url) {
        try {
            //NZZ.ch Watermark
            if (url.endsWith("?wmark=nzz")) {
                url = url.replace("?wmark=nzz", "");
            }
        }
        catch (e) {
            telemetry.error(e);
        }
        return url;
    }
}