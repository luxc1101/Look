var hunter = new function () {
    this.fileName = "iaea.js";
    this.name = "International Atomic Energy Agency (IAEA)";
    this.id = "630A6A25-DBD1-4DD4-B1F1-7F29BC001A02";
    this.importFormat = "1bdc9da0-328c-4cdf-96de-b9fe2eaef9da";
    this.priority = 10;
    this.example = "https://inis.iaea.org/search/searchsinglerecord.aspx?recordsFor=SingleRecord&RN=49057759";

    this.identifyUrl = url => url.indexOf("inis.iaea.org") !== -1;

    this.identify = function () {
        try {
            return this.getRNs().length;
        }
        catch (e) {
            console.error(e);
            return 0;
        }
    }

    this.getRNs = function () {
        var list = [];
        var rn = /RN=(\d+)$/.exec(document.URL);
        if (rn !== null) {
            list.push(rn[1]);
        }
        else {
            var rgx = /RN=(\d+)/g;
            var rns;
            do {
                rns = rgx.exec(document.body.innerHTML);
                if (rns === null) {
                    break;
                }
                var rn = rns[1];
                if (list.indexOf(rn) !== -1) continue;
                list.push(rn);
            }
            while (rns);
        }
        return list;
    }

    this.scanAsync = async function (info) {
        var records = [];
        try {
            for (var rn of this.getRNs()) {
                var body = "RN=" + rn + "&citationFormat=Ris";
                var response = await fetch("https://inis.iaea.org/search/citationdownload.aspx", {
                    method: 'POST',
                    referrer: document.URL,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: body
                });
                var ris = await response.text();
                ris = ris.trim();
                //DO  - DOI:101016/jijrobp200906003
                ris = ris.replace(/DO  - .+/g, "");
                var url = /UR  - .+?doi\.org\/(.+)(\s|$)/g.exec(ris);
                if (url != null) {
                    ris += "\r\nDO  - " + url[1];
                }
                records.push(ris);
            }
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




