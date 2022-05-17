var hunter = new function() {
	this.fileName = "acs.js";
	this.name = "ACS";
    this.id = "B9A29031-B183-4FBB-B11A-473C0454E1F0";
    this.importFormat = "1bdc9da0-328c-4cdf-96de-b9fe2eaef9da";
    this.priority = 10;
    this.example = "https://pubs.acs.org/doi/10.1021/acsomega.9b00642";

    this.identifyUrl = function (url) { return url.indexOf("pubs.acs.org/doi") != -1 };

    this.identify = function () {
        var counter = 0;
        try {
            var element = document.getElementsByClassName('cit-download-dropdown_button');
            if (element.length > 0) {
                var doi = document.querySelector("meta[name='dc.Identifier']");
                if (doi != null) {
                    return 1;
                }
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

            var doi = document.querySelector("meta[name='dc.Identifier']").content;
            var exportLink = "https://pubs.acs.org/action/downloadCitation?doi=" + doi + "&include=abs&format=ris&direct=true&downloadFileName=" + doi;
            var response = await fetch(exportLink);
            var responseText = await response.text();
            responseText = responseText.trim();
            responseText += "\r\rQZ  - https://pubs.acs.org/doi/pdf/" + doi; 
            responseText = responseText.replace("ER  - ", "");
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