var hunter = new function() {
	this.fileName = "wikipedia.js";
    this.name = "Wikipedia";
    this.id = "B852EFA0-6745-49D1-8E9B-500065C5C941";
    this.importFormat = "1bdc9da0-328c-4cdf-96de-b9fe2eaef9da";
    this.priority = 10;
    this.example = "https://de.wikipedia.org/wiki/Dublin_Core";
    this.info = "https://en.wikipedia.org/api/rest_v1/#!/Page_content/get_page_pdf_title";

    this.identifyUrl = function (url) { return url.indexOf("wikipedia.org") != -1 };

    this.identify = function () {
        try {
            if (document.location.pathname.indexOf(":") != -1) return 0;
            return 1;
        }
        catch (e) {
            console.error(e);
        }
        return 0;
    }

    this.formatDate = function (date) {
        try {
            var d = new Date(date);
            return d.toLocaleDateString();
        }
        catch (e) {
            return date;
        }
    }
    this.getYear = function (date) {
        try {
            var d = new Date(date);
            return d.getFullYear();
        }
        catch (e) {
            return date;
        }
    }

    this.scanAsync = async function () {
        var records = [];
        try {
            var url = decodeURI(document.URL);//wg. umlauten
            var wikiLng = /https:\/\/(\w+)\.wikipedia/.exec(url)[1];
            var record = await fetch("https://en.wikipedia.org/api/rest_v1/data/citation/zotero/" + encodeURIComponent(url));

            var json = (await record.json())[0];
            var record = "TY  - WEB\r\n";
            if (json.creators) {
                for (var creator of json.creators) {
                    record += "AU  - " + creator + "\r\n";
                }
            }
            if (json.tags) {
                for (var tag of json.tags) {
                    record += "KW  - " + tag + "\r\n";
                }
            }
            if (json.notes) {
                for (var note of json.notes) {
                    record += "N1  - " + note + "\r\n";
                }
            }
            record += "TI  - " + json.title + "\r\n";
            record += "N1  - " + json.rights + "\r\n";
            record += "UR  - " + decodeURI(json.url) + "\r\n";
            record += "N1  - " + json.extra + "\r\n";
            record += "LA  - " + json.language + "\r\n";
            record += "PY  - " + this.getYear(json.date) + "\r\n";
            record += "Y2  - " + this.formatDate(json.date) + "\r\n";
            record += "ED  - " + json.libraryCatalog + "\r\n";
            record += "AB  - " + json.abstractNote + "\r\n";
            record += "Y3  - " + this.formatDate(json.accessDate) + "\r\n";
            record += "QZ  - " + `https://${wikiLng}.wikipedia.org/api/rest_v1/page/pdf/` + json.title.replace(" ", "_") + "\r\n";

            var wikiTitle = json.title.replace(" ", "_");
            
            var summary = await fetch("https://" + wikiLng + ".wikipedia.org/api/rest_v1/page/summary/" + wikiTitle);
            if (summary.ok) {
                var summaryJson = await summary.json();
                if (summaryJson.originalimage !== undefined) {
                    if (!summaryJson.originalimage.source.endsWith(".svg")) {
                        record += "QX  - " + summaryJson.originalimage.source + "\r\n";
                    }
                }

                if (summaryJson.api_urls !== undefined) {
                    //summaryJson.api_urls.references
                }
            }

            records.push(record);
        }
        catch (e) {
            console.error(e);
        }
        return records;
    }
}

if (typeof hunters !== 'undefined') {
    hunters.add(hunter);
}