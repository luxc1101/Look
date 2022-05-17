var hunter = new function() {
	this.fileName = "sciencedirect.js";
	this.name = "ScienceDirect";
    this.id = "0928DBF8-6016-4D7B-827E-E63FC3A55193";
    this.importFormat = "1bdc9da0-328c-4cdf-96de-b9fe2eaef9da";
    this.priority = 10;
    this.example = "https://www.sciencedirect.com/science/article/pii/S1319157816301434";

    this.identifyUrl = function (url) { return url.indexOf("sciencedirect.com") != -1 || url.indexOf("reader.elsevier.com") != -1 };

    this.identify = function () {
        var counter = 0;
        try {
            //https://www.sciencedirect.com/sdfe/arp/cite?pii=S1319157816301434&format=application%2Fx-research-info-systems&withabstract=false

            var element = document.querySelector('form[name="exportCite"]');
            if (element != null) {
                //No Open Access
                return 1;
            }

            element = document.querySelector("meta[name='citation_pii']");
            if (element != null &&
                element.getAttribute('content') != null) {
                //Open Access
                return 1;
            }

            var pii = /download\/file\/\pii\/(S\d+)/g.exec(document.body.innerHTML);
            if (pii != null) {
                return 1;
            }
            return 0;
        }
        catch (e) {
            console.error(e);
        }
        return counter;
    }

    this.scanAsync = async function () {
        var records = [];
        try {
            var piiMatch = /https:.+?download\/file\/\pii\/(S\d+).+?.pdf/g.exec(document.body.innerHTML);
            if (piiMatch != null) {
                var exportLink = "https://www.sciencedirect.com/sdfe/arp/cite?pii=" + piiMatch[1] + "&format=application%2Fx-research-info-systems&withabstract=false"
                var response = await fetch(exportLink);
                var responseText = await response.text();
                responseText = responseText.trim();
                responseText = responseText.replace("ER  - ", "");
                responseText += "\r\nQZ  - " + piiMatch[0];
                responseText += this.tryGetAbstract();
                responseText += this.tryGetCover();
                records.push(responseText);
            }
            else if (document.querySelector("meta[name='citation_pii']").getAttribute('content') != null) {
                var pii = document.querySelector("meta[name='citation_pii']").getAttribute('content');
                var exportLink = "https://www.sciencedirect.com/sdfe/arp/cite?pii=" + pii + "&format=application%2Fx-research-info-systems&withabstract=false"
                var response = await fetch(exportLink);
                var responseText = await response.text();
                try {
                    responseText = responseText.replace("ER  - ", "");
                    responseText = responseText.trim();
                    var pdfElement = document.querySelector("meta[name='citation_pdf_url']");
                    if (pdfElement != null) {
                        var pdf = pdfElement.getAttribute('content');
                        responseText += "\r\nQZ  - " + pdf;
                    }
                    responseText += this.tryGetAbstract();
                    responseText += this.tryGetCover();
                }
                catch (e) { console.error(e);}
                
                records.push(responseText);
            }
            else {
                var element = document.querySelector('form[name="exportCite"]');
                var exportLink = element.getAttribute("action");
                var response = await fetch(exportLink, {
                    method: "POST",
                    body: new URLSearchParams("zone=toolbar&citation-type=RIS&format=cite-abs&export=Export")
                });
                var responseText = await response.text();
                responseText = responseText.replace("ER  - ", "");
                responseText = responseText.trim();
                responseText += this.tryGetAbstract();
                responseText += this.tryGetCover();
                records.push(responseText);
            }
        }
        catch (e) {
            console.error(e);
        }
        return records;
    }

    this.tryGetAbstract = function(){
        var abstract = "\r\nAB  - ";
        try {
            for (var element of document.getElementsByClassName("abstract author")[0].childNodes) {
                if (element.textContent == "Abstract") continue;
                for (var subelement of element.childNodes) {
                    abstract += subelement.textContent + "\r\n\r\n";
                }
            }
        }
        catch (e) {
            console.error(e);
        }
        return abstract;
    }
    this.tryGetCover = function () {
        var coverUrl = "\r\nQX  - ";
        try {
            coverUrl += document.getElementsByClassName("publication-cover")[0].getElementsByTagName("img")[0].getAttribute("src");
        }
        catch (e) {
            console.error(e);
        }
        return coverUrl;
    }
}

if (typeof hunters !== 'undefined') {
    hunters.add(hunter);
}