var hunter = new function () {
    this.fileName = "aleph.js";
    this.name = "aleph";
    this.id = "3A7FA22D-0225-492C-ACF7-E5FC63DAB32D";
    this.importFormat = "1bdc9da0-328c-4cdf-96de-b9fe2eaef9da";
    this.priority = 10;
    this.example = "https://aleph.mpg.de";

    this.identifyUrl = function (url) {

        if (url.indexOf("/F/", 0) == -1) {
            return false;
        }
        if (url.indexOf("func=full-set", 0) == -1) {
            return false;
        }
        if (url.indexOf("set_number=", 0) == -1) {
            return false;
        }
        if (url.indexOf("set_entry=", 0) == -1) {
            return false;
        }
        return true;
    };

    this.identify = function () {
        try {
            if (document.body.innerHTML.indexOf("format=001") != -1 ||
                document.body.innerHTML.indexOf("format=999") != -1) {

                var tdElements = document.getElementsByTagName("a");

                for (var i = 0; i < tdElements.length; i++) {
                    var attr = tdElements[i].href;
                    if (attr == null) continue;
                    if (attr.indexOf("set_entry=") != -1) {
                        return 1;
                    }
                }
            }
        }
        catch (e) {
            console.error(e);
        }
        return 0;
    };

    this.scanAsync = async function () {
        var references = [];

        try {
            var tdElements = document.getElementsByTagName("a");
            var docNumber = /doc_number=(\d+)/.exec(document.body.innerHTML)[1];
            var docLibary = /doc_library=(.+?)&/.exec(document.body.innerHTML);

            for (var i = 0; i < tdElements.length; i++) {
                var element = tdElements[i];
                if (element.href == null) continue;
                if (element.href.indexOf("func=") == -1) continue;

                var downloadURL = /http.+?func=/i.exec(element.href);

                downloadURL += "full-mail&format=777&encoding=UTF_TO_WEB_MAIL+++++&SUBJECT=&NAME=&EMAIL=&text=&x=45&y=5&option_type=&doc_number=" + docNumber;
                if (docLibary != null && docLibary.length > 0) {
                    downloadURL += "&doc_library=" + docLibary[1];
                }

                var response = await fetch(downloadURL);
                var fileDownloadSource = await response.text();

                var fileName = /http.+?\.(ris|end|enw)/gi.exec(fileDownloadSource)[0];

                response = await fetch(fileName);
                let buffer = await response.arrayBuffer();
                let decoder = new TextDecoder("iso-8859-1");
                let recordText = decoder.decode(buffer);

                if (document.URL.indexOf("aleph.mpg.de") != -1) {
                    recordText = recordText.replace(/UR  - .+/g, "");
                }

                references.push(recordText);
                break;
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
