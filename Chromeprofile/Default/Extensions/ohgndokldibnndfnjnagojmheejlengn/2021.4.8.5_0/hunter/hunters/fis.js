var hunter = new function() {
	this.fileName = "fis.js";
	this.name = "FIS";
    this.id = "A982C70B-0F86-45AF-A1F4-70716D54132A";
    this.importFormat = "1bdc9da0-123c-4cdf-96de-b9fe2eaef9da";
    this.priority = 10;
    this.example = "https://pubs.acs.org/doi/10.1021/acsomega.9b00642";

    this.identifyUrl = function (url) { return url.indexOf("www.fachportal-paedagogik.de/literatur/vollanzeige.html") != -1 };

    this.identify = function () {
        var counter = 0;
        try {
            var id = /FId=(.+?)&/.exec(document.URL)[1];
            return 1;
        }
        catch (e) {
            console.error(e);
        }
        return counter;
    }

    this.scanAsync = async function () {
        var records = [];
        try {
            var id = /FId=(.+?)&/.exec(document.URL)[1];
            var exportLink = "https://www.fachportal-paedagogik.de/literatur/fis_ausgabe.html?FId%5B%5D=" + id + "&lart=EndNote+-+direkter+Import&senden=Exportieren&senden_an=";
            var response = await fetch(exportLink);
            var responseText = await response.text();
            responseText = responseText.trim();

            var record = "";
            var s = responseText.split('\n');
            for (var r of s) {
                if (r.startsWith("%U")) {
                    var link = r.substr(2);
                    for (var url of link.split(';')) {
                        record += "%U " + url + "\r\n";
                        if (url.indexOf(".pdf") != -1) {
                            record += "%PD " + url + "\r\n";
                        }
                    }
                }
                else {
                    record += r + "\r\n";
                }
            }


            if (record.indexOf("eric_") === 0) {
                record += "\r\n%EI " + id.substr(5);
            }
            
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