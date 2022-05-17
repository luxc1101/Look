var hunter = new function () {
    this.fileName = "arxiv.js";
    this.name = "arXiv.org";
    this.id = "BB724F35-13AF-4038-B7C9-9B416A389ACD";
    this.importFormat = "1bdc9da0-328c-4cdf-96de-b9fe2eaef9da";
    this.priority = 10;
    this.example = "https://arxiv.org/abs/1802.05717";

    this.identifyUrl = function (url) {
        if (url.indexOf("arxiv.org", 0) == -1) {
            return false;
        }
        return true;
    }

    this.identify = function () {
        try {

            if (document.URL.indexOf("arxiv.org", 0) == -1) {
                return 0;
            }

            var metaFields = document.getElementsByTagName("meta");

            for (var i = 0; i < metaFields.length; i++) {
                if (metaFields[i].getAttribute("name") != null &&
                    metaFields[i].getAttribute("name") == "citation_arxiv_id") {

                    return 1;
                }

            }
        }
        catch (e) {
            console.error(e);
        }
        return 0;
    }

    this.scanAsync = function () {
        return new Promise(resolve => {
            var references = [];

            try {

                var metaFields = document.getElementsByTagName("meta");

                for (var i = 0; i < metaFields.length; i++) {
                    if (metaFields[i].getAttribute("name") != null &&
                        metaFields[i].getAttribute("name") == "citation_title") {

                        var id = metaFields[i].getAttribute("content");
                        references.push(this.get(id));

                        break;
                    }

                }
            }
            catch (e) {
                console.error(e);
            }
            resolve(references);
        });
    }

    this.get = function (recordId) {
        var recordText = "TY  - RPRT\r\n";

        try {
            var metaFields = document.getElementsByTagName("meta");
            recordText += "AX  - " + recordId.replace("arXiv:", "") + "\r\n";
            for (var i = 0; i < metaFields.length; i++) {
                if (metaFields[i].getAttribute("name") != null) {
                    var metaName = metaFields[i].getAttribute("name");
                    switch (metaName) {
                        case "citation_title":
                            recordText += "TI  - " + metaFields[i].getAttribute("content") + "\r\n";
                            break;
                        case "citation_author":
                            recordText += "AU  - " + metaFields[i].getAttribute("content") + "\r\n";
                            break;
                        case "citation_date":
                            recordText += "PY  - " + /^\d\d\d\d/.exec(metaFields[i].getAttribute("content"))[0] + "\r\n";
                            break;
                        case "citation_pdf_url":
                            recordText += "UR  - " + metaFields[i].getAttribute("content") + "\r\n";
                            recordText += "QZ  - " + metaFields[i].getAttribute("content") + "\r\n";
                            break;

                        case "citation_arxiv_id":
                            recordText += "AX  - " + metaFields[i].getAttribute("content") + "\r\n";
                            break;
                    }
                }
            }
            var abstract = document.querySelector(".abstract");
            if (abstract != null) {
                recordText += "AB  - " + abstract.innerText + "\r\n";
            }
            metaFields = document.getElementsByTagName("td");

            for (var i = 0; i < metaFields.length; i++) {
                if (metaFields[i].getAttribute("class") != null) {
                    var metaName = metaFields[i].getAttribute("class");
                    switch (metaName) {
                        case "tablecell jref":
                            var source = metaFields[i].innerText;
                            if (!source) source = metaFields[i].textContent;
                            if (/(^.+?)(\d\d\d\d)/.test(source)) recordText += "JF  - " + /(^.+?)(\d\d\d\d)/.exec(source)[1] + "\r\n";
                            if (/\d\d\d\d/.test(source)) recordText += "PY  - " + /\d\d\d\d/.exec(source)[0] + "\r\n";
                            if (/(Vol\.)(.+?),/gi.test(source)) recordText += "VL  - " + /(Vol\.)(.+?),/gi.exec(source)[2] + "\r\n";
                            if (/(No\.)(.+?),/gi.test(source)) recordText += "IS  - " + /(No\.)(.+?),/gi.exec(source)[2] + "\r\n";
                            if (/(No\..+?,)(.+$)/.test(source)) recordText += "SP  - " + /(No\..+?,)(.+$)/.exec(source)[2] + "\r\n";
                            recordText += "SO  - " + source + "\r\n";
                            break;

                        case "tablecell subjects":
                            var keyword = metaFields[i].innerText;
                            if (!keyword) keyword = metaFields[i].textContent;
                            recordText += "KW  - " + keyword + "\r\n";
                            break;

                        case "tablecell doi":
                            var doi = metaFields[i].innerText;
                            if (!doi) doi = metaFields[i].textContent;
                            recordText += "DO  - " + doi + "\r\n";
                            break;
                    }
                }

            }

            recordText += "TS  - arXiv.org\r\n";

            recordText += "ER  - \r\n";
        }
        catch (e) {
            console.error(e);
        }


        return recordText;
    }
}
if (typeof hunters !== 'undefined') {
    hunters.add(hunter);
}
