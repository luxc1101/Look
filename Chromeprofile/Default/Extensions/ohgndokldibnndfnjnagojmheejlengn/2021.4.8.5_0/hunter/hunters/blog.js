var hunter = new function () {
    this.fileName = "blog.js";
    this.name = "Blog";
    this.id = "210B9CAB-3A44-42C2-BA18-6EC109CA48CD";
    this.importFormat = "1bdc9da0-328c-4cdf-96de-b9fe2eaef9da";
    this.priority = 10;
    this.example = "https://www.citavi.com/de/nuetzliche-irrtuemer/artikel/digitale-textmarker";
    this.supportedBlogs =
        [
            "https://www.citavi.com/de/nuetzliche-irrtuemer/artikel/.+",
        ];

    this.identifyUrl = function (url) {
        for (var pattern of this.supportedBlogs) {
            var m = url.match(pattern);
            if (m !== null && m.length === 1) {
                return 1;
            }
        }
        return 0;
    };

    this.identify = function () {
        return 1;
    };

    this.scanAsync = async function () {
        var records = [];
        try {
            var ris = "TY  - WEB\r\n";
            ris += `UR  - ${document.URL}\r\n`;

            var titleSource = document.URL;
            try {
                var u = new URL(document.URL);
                titleSource = u.host;
            }
            catch (e) { }

            ris += `TS  - ${titleSource}\r\n`;
            ris += `Y3  - ${new Date().toLocaleDateString()}\r\n`;

            if (!isNullOrUndefined(document.lastModified)) {
                var parsedDate = new Date(document.lastModified).toLocaleDateString();
                if (parsedDate) {
                    ris += `Y2  - ${parsedDate}\r\n`;
                }
            }

            ris += `TI  - ${document.title}\r\n`;

            for (var meta of document.querySelectorAll("meta")) {
                if (meta.name === "description") {
                    ris += `AB  - ${meta.content}\r\n`;
                }
                else if (meta.name.indexOf("keyword") !== -1 ||
                         meta.name === "subject"){
                    ris += `KW  - ${meta.content}\r\n`;
                }
            }

            var article = document.getElementById("article");
            if (article !== null) {
                var cover = article.getElementsByTagName("img");
                if (cover.length > 0) {
                    ris += `QX  - ${cover[0].src}\r\n`;
                }
            }

            ris += "QW  - " + document.URL + "\r\n";
            records.push(ris);
            
        }
        catch (e) {
            console.error(e);
        }
        return records;
    };
};

if (typeof hunters !== 'undefined') {
    hunters.add(hunter);
}