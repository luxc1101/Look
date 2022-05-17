var hunter = new function() {
	this.fileName = "springer.js";
	this.name = "SpringerLink";
	this.id = "0ACA5FB2-8608-42FC-B0DC-DAD830AE34C4";
    this.importFormat = "1bdc9da0-328c-4cdf-96de-b9fe2eaef9da";
    this.priority = 10;
    this.example = "https://link.springer.com/article/10.1007/s00228-017-2389-x";

    this.identifyUrl = function (url) { return url.indexOf("link.springer.com") != -1 };

    this.identify = function () {
        var counter = 0;
        try {

            var elements = document.getElementsByTagName("a");
            for (var i = 0; i < elements.length; i++) {
                var link = elements[i].href;
                if (/citation-needed.*?springer.com.+?format=refman&flavour=citation/.test(link)) {
                    counter++;
                }
            }
            if (counter > 1) return 1;
            return 0;
        }
        catch (e) {
            console.error(e);
        }
        return counter;
    }

    this.fetch2 = function (url) {
        return new Promise(async resolve => {
            chrome.runtime.sendMessage({ action: MessageKeys.fetchText, value: url }, (source) => {
                if (source == "") {
                    console.error(url);
                }
                resolve(source);
            });
        });
    }

    this.scanAsync = async function () {
        var records = [];
        try {

            var elements = document.getElementsByTagName("a");
            var exportLink = "";
            var pdfLink = "";
            for (var i = 0; i < elements.length; i++) {
                var link = elements[i].href;
                if (/citation-needed.*?.springer.com.+?format=refman&flavour=citation/.test(link)) {
                    exportLink = link;
                }
            }

            
            var responseText = await this.fetch2(exportLink);
            
            responseText = responseText.replace("ER  - ", "");
            responseText = responseText.trim();
            

            for (var el of document.getElementsByTagName("meta")) {
                if (el.name == "twitter:image") {
                    responseText += "\r\nQX  - " + el.getAttribute("content");
                    break;
                }
            }

            var isChapter = responseText.indexOf("TY  - CHAP") != -1;

            for (var i = 0; i < elements.length; i++) {
                var link = elements[i].href;
                var contenttype = elements[i].contenttype;
                if (isChapter && contenttype != null &&
                    contenttype != "Chapter") {
                    continue;
                }
                var meta_element = document.querySelector("meta[name='citation_pdf_url']");
                if (meta_element !== null) {
                    responseText += "\r\nQZ  - " + meta_element.getAttribute("content");
                    continue;
                }
                if (/content\/pdf\/.+?.pdf/.test(link)) {

                    responseText += "\r\nQZ  - " + link;
                    break;
                }
            }

            records.push(responseText);
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