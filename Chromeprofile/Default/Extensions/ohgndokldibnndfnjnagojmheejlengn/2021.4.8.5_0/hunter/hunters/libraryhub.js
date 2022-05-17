var hunter = new function() {
    this.fileName = "libraryhub.js";
    this.name = "Library Hub Discover";
    this.id = "3FAB8135-88AA-45E2-9B6C-79AD2E3202B9";
    this.importFormat = "1bdc9da0-328c-4cdf-96de-b9fe2eaef9da";
    this.priority = 10;

    this.identifyUrl = function (url) { return url.indexOf("discover.libraryhub.jisc.ac.uk") != -1 };

    this.identify = function () {
        var counter = 0;
        try {

            var element = document.getElementById("c-export__options");
            if (element != null) return 1;
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

            var exportLink = document.URL + "&format=endnote";

            var response = await fetch(exportLink);
            var responseText = await response.text();
            responseText = responseText.replace(/UR  - /g, "L1  - ");
            responseText = responseText.replace(/NT  - Contents:/g, "AB  - ");
            responseText = responseText.replace(/NT  - Summary:/g, "AB  - ");
            responseText = responseText.trim();
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