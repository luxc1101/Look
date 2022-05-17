var hunter = new function () {
    this.fileName = "library.js";
    this.name = "Library";
    this.id = "46A7E631-B3DC-449C-892E-19D0094046AF";
    this.importFormat = "backoffice";
    this.priority = 10;
    this.example = "http://catalogo.pusc.it/cgi-bin/koha/opac-detail.pl?biblionumber=10729";

    this.libraries = [
        {
            pattern: /catalogo\.pusc\.it\/cgi-bin\/koha\/opac-detail\.pl\?biblionumber=(\d+)/,
            transformer: "4A7F6808-7422-4E68-9678-A2512964A40E"
        }
    ];

    this.getLibrary = function (url) {
        for (var lib of this.libraries) {
            if (lib.pattern.test(url)) {
                return lib;
            }
        }
        return null;
    }

    this.identifyUrl = function (url) {
        return this.getLibrary(url) != null;
    }

    this.identify = function () {
        return 1;
    }

    this.scanAsync = async function (info) {
        var records = [];
        var format = info.repo === "local" ? "xml" : "json";
        var libary = this.getLibrary(document.URL);
        var localNumber = libary.pattern.exec(document.URL)[1];
        var url = `https://backoffice6.citavi.com/api/onlinesearch/FetchByLocalNumber?localNumber=${localNumber}&transformerId=${libary.transformer}&format=${format}`;
        var response = await fetch(url);
        var responseText = await response.text();
        if (format === "json") {
            var json = JSON.parse(responseText);
            records.push(JSON.stringify(json[0]));
        }
        else {
            records.push(responseText);
        }
        return records;
    }
}
if (typeof hunters !== 'undefined') {
    hunters.add(hunter);
}




