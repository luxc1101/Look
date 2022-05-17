var hunter = new function () {
    this.fileName = "eupresscorner.js";
    this.name = "European Commission - Press corner";
    this.id = "123F10AE-20EF-4EAF-90A0-3C07BAC24423";
    this.importFormat = "1bdc9da0-328c-4cdf-96de-b9fe2eaef9da";
    this.priority = 10;
    this.example = "https://ec.europa.eu/commission/presscorner/detail/de/ip_20_358";

    this.identifyUrl = function (url) {
        return url.startsWith("https://ec.europa.eu/commission/presscorner/detail/");
    };

    this.identify = function () {
        return 1;
    }

    this.scanAsync = async function () {
        var records = [];

        try {
            var record = "TY  - PRESS\r\n";
            record += "TI  - " + document.title + "\r\n";
            record += "IN  - European Commission\r\n";
            var date = document.querySelector("meta[name='Date']");
            if (date) {
                record += "DA  - " + date.getAttribute("content") + "\r\n";
            }

            var keywords = document.querySelector("meta[name='keywords']");
            if (keywords) {
                record += "KW  - " + keywords.getAttribute("content") + "\r\n";
            }

            var abstract = document.querySelector("meta[name='description']");
            if (abstract) {
                record += "AB  - " + abstract.getAttribute("content") + "\r\n";
            }

            var pdf = document.querySelector("a.ecl-file__download");
            if (pdf) {
                record += "QZ  - " + pdf.getAttribute("href") + "\r\n";
            }

            record += "UR  - " + document.URL + "\r\n";
            
            records.push(record);
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
