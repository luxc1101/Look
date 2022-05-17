var hunter = new function () {
    this.fileName = "epo.js";
    this.name = "Espacenet";
    this.id = "55A787EB-D717-4CD9-BF0C-583309BD5B0B";
    this.importFormat = "backoffice";
    this.priority = 10;
    this.example = "https://worldwide.espacenet.com/patent/search/family/056189219/publication/CN205320108U?q=ABB";
    this.supportsRefresh = true;

    this.identifyUrl = url => url.indexOf("espacenet.com/patent/search/family/") !== -1;
    this.identify = function () {
        try {
            var localNumber = this.getLocalNumberFromQuery();
            if (localNumber !== "") {
                return 1;
            }
        }
        catch (e) {
            console.error(e);
        }
        return 0;
    };

    this.getLocalNumberFromQuery = function () {
        var query = /patent\/search\/family\/\d+\/publication\/(\w+\d+\w*)/.exec(document.location);
        if (query !== null && query.length > 0) {
            return query[1];
        }
        return "";
    }

    this.getQueryVariable = function(variable) {
        var query = window.location.search.substring(1);
        var vars = query.split('&');
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            if (decodeURIComponent(pair[0]) == variable) {
                return decodeURIComponent(pair[1]);
            }
        }
        return "";
    }

    this.scanAsync = async function (info) {
        var references = [];

        try {
            var localNumber = this.getLocalNumberFromQuery();
            var format = info.repo === "local" ? "xml" : "json";
            var url = "https://backoffice6.citavi.com/api/onlinesearch/FetchByLocalNumber?localNumber=" + localNumber + "&transformerId=6a32513d-93ae-4b9e-6598-6329c1a721c1&format=" + format;
            var response = await fetch(url);
            var responseText = await response.text();
            if (format == "json") {
                var json = JSON.parse(responseText);
                references.push(JSON.stringify(json[0]));
            }
            else {
                references.push(responseText);
            }
            
        }
        catch (e) {
            console.error(e);
        }
        return references;
    };
}
if (typeof hunters !== 'undefined') {
    hunters.add(hunter);
}
