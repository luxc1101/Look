var hunter = new function () {
    this.fileName = "dublincore.js";
    this.name = "DublinCore";
    this.id = "DA3E83BD-31D8-4B46-AA56-B5E996CAD8D3";
    this.importFormat = "backoffice";
    this.priority = 1;
    this.example = "http://journals.sagepub.com/doi/full/10.1177/2158244016646148";

    this.identifyUrl = function (url) { return true };

    this.identify = function () {
        try {
            var identifier = document.querySelectorAll("meta[name='dc.Identifier'][scheme='doi']");
            if (identifier != null && identifier.length == 1) {
                return 1;
            }
        }
        catch (e) {
            console.error(e);
        }
        return 0;
    }

    this.scanAsync = function () {
        return new Promise(resolve => {
            resolve(this.scan());
        });
    }

    this.scanAsync = async function (info) {
        var records = [];
        var recordText = "";
        var format = info.repo === "local" ? "xml" : "json";

        try {
            var doi = document.querySelector("meta[name='dc.Identifier'][scheme='doi']").getAttribute('content');
            var url = `https://backoffice6.citavi.com/api/onlinesearch/FetchByDoi?doi=${doi}&format=${format}`;
            var response = await fetch(url);
            var responseText = await response.text();
            if (format === "json") {
                var json = JSON.parse(responseText);
                records.push(JSON.stringify(json[0]));
            }
            else {
                records.push(responseText);
            }
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
