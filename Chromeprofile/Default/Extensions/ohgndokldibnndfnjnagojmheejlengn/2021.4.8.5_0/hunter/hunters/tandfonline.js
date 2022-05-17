var hunter = new function () {
    this.fileName = "tandfonline.js";
    this.name = "Taylor + Francis";
    this.id = "68698F4A-68F0-4A5B-8057-6E29270E929D";
    this.importFormat = "1bdc9da0-328c-4cdf-96de-b9fe2eaef9da";
    this.priority = 10;
    this.example = "https://www.tandfonline.com/doi/full/10.1080/24709360.2017.1407866";

    this.identifyUrl = function (url) { return url.indexOf("tandfonline.com/doi/") != -1 };
    this.identify = function () {
        try {
            var doi = document.querySelector("meta[scheme='doi']").getAttribute("content");
            return 1;
        }
        catch (e) {
            
        }
        return 0;
    }

    this.scanAsync = async function () {
        var records = [];
        try {
            var doi = document.querySelector("meta[scheme='doi']").getAttribute("content");
            var exportLink = "https://www.tandfonline.com/action/downloadCitation?doi=" + doi + "&format=ris&direct=true&include=abs&cookieSet=0";
            var response = await fetch(exportLink, {
                credentials: "same-origin"
            });
            var responseText = await response.text();

            if (document.getElementsByClassName("showDownloadPopup show-pdf").length > 0) {
                responseText = responseText.replace("ER  -", "QZ  - " + "https://www.tandfonline.com/doi/pdf/" + doi[1] + "?needAccess=true" + "\r\nER  -");
            }

            responseText = responseText.replace(/N1.+?doi.+/, "");
            responseText = responseText.replace(/M3.+?doi.+/, "");
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