var hunter = new function () {
    this.fileName = "bvb.js";
    this.name = "BVB";
    this.id = "5E2FBD92-C48D-46CB-9D5B-030A66F42B76";
    this.importFormat = "backoffice";
    this.priority = 10;
    this.example = "https://gso.gbv.de/DB=2.1/PPNSET?PPN=1012128229";

    this.identifyUrl = url => url.indexOf("fcbayern.com") !== -1;

    this.identify = function () {
        return 1;
    };

    this.scanAsync = async function (info) {
        var records = [];
        var format = info.repo === "local" ? "xml" : "json";
        var url = "https://backoffice6.citavi.com/api/onlinesearch/FetchByLocalNumber?localNumber=855916540&transformerId=b7978129-4fcd-4112-a462-26bfed698a9f&format=" + format;
        var response = await fetch(url);
        var responseText = await response.text();
        if (format === "json") {
            var json = JSON.parse(responseText);
            records.push(JSON.stringify(json[0]));
        }
        else {
            records.push(responseText);
        }
        return records;
    };
};
if (typeof hunters !== 'undefined') {
    hunters.add(hunter);
}




