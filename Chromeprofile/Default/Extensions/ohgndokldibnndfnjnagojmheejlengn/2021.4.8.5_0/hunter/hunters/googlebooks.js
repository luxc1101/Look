var hunter = new function () {
    this.fileName = "googlebooks.js";
    this.name = "Google Books";
    this.id = "213D4264-16BB-3652-9A02-3C272E1D85FD";
    this.importFormat = "1bdc9da0-328c-4cdf-96de-b9fe2eaef9da";
    this.priority = 10;

    this.identify = function () {
        if (document.URL.indexOf("books.google", 0) == -1) return 0;
        if (document.URL.indexOf("books?id=") != -1) return 1;
        return 0;
    }

    this.identifyUrl = function (url) {
        if (url.indexOf("books.google", 0) == -1) return false;
        if (url.indexOf("books?id=") != -1) return true;
        return false;
    }

    this.scanAsync = async function () {
        var records = [];
        try {
            var idRegex = new RegExp(/books\?id=(.*?)(\&|$)/g);
            var idMatch = idRegex.exec(document.URL);
            var id = idMatch[1];

            var baseUrl = document.domain;
            var url = "https://" + baseUrl + "/books/download/Export.ris?id=" + id + "&output=ris";
            var response = await fetch(url);
            var recordText = await response.text() + "\r\n\r\n";
            recordText = recordText.replace("books.google.de", baseUrl);

            //Kein Download von PDF möglich ohne das Cacha kommt (27.4.2018)

            for (var link of document.getElementsByTagName('a')) {
                if (link.href == null) continue;
                if (link.href.indexOf("books/download") == -1) continue;
                if (link.href.indexOf("&output=pdf") == -1) continue;
                //recordText += "\r\nQZ  - " + link.href;
            }

            records.push(recordText);
        }
        catch(e){
            console.error(e);
        }
        return records;
    }
}
if (typeof hunters !== 'undefined') {
    hunters.add(hunter);
}