var hunter = new function () {
    this.fileName = "gbv.js";
    this.name = "GBV";
    this.id = "35252AFB-55E8-47A5-9DE1-9C1A0EE86073";
    this.importFormat = "backoffice";
    this.priority = 10;
    this.example = "https://gso.gbv.de/DB=2.1/PPNSET?PPN=1012128229";

    this.identifyUrl = url => url.indexOf("k10plus.de/DB=") !== -1;

    this.identify = function () {
        var counter = 0;
        var checked = {};
        try {

            var links = document.getElementsByTagName("span");

            for (var i = 0; i < links.length; i++) {
                if (links[i].className == "Z3988") {
                    if (checked[links[i].title] != null) continue;
                    checked[links[i].title] = true;
                    var source = decodeURIComponent(links[i].title);
                    if (/rft.ppn=(\d+)/g.exec(source) != null) {
                        counter++;
                    }
                }
            }
        }
        catch (e) {

        }
        return counter;
    }

    this.scanAsync = async function (info) {
        var records = [];
        var links = document.getElementsByTagName("span");
        var format = info.repo === "local" ? "xml" : "json";
        var checked = {};
        var index = 0;
        for (var i = 0; i < links.length; i++) {
            if (links[i].className === "Z3988") {
                if (checked[links[i].title] != null) continue;
                checked[links[i].title] = true;

                var source = decodeURIComponent(links[i].title);
                if (/rft.ppn=(\d+)/g.exec(source) != null) {
                    var ppn = /rft.ppn=(\d+)/g.exec(source)[1];
                    var url = "https://backoffice6.citavi.com/api/onlinesearch/FetchByLocalNumber?localNumber=" + ppn + "&transformerId=DF091162-859E-4FF3-A04D-466ECAD29D83&format=" + format;
                    var response = await fetch(url);
                    var responseText = await response.text();
                    if (responseText === "null") {
                        continue;
                    }
                    if (format == "json") {
                        var json = JSON.parse(responseText);
                        records.push(JSON.stringify(json[0]));
                    }
                    else {
                        records.push(responseText);
                    }
                }
            }
        }
        return records;
    }
}
if (typeof hunters !== 'undefined') {
    hunters.add(hunter);
}




