var hunter = new function () {
    this.fileName = "jstor.js";
    this.name = "JStor";
    this.id = "47B3F418-8125-413D-AADE-B96742176011";
    this.importFormat = "1bdc9da0-328c-4cdf-96de-b9fe2eaef9da";
    this.priority = 10;
    this.example = "https://www.jstor.org/stable/44235000";
    this.supportsRefresh = true;
    this.isLoggedIn = false;
    this.identifyUrl = function (url) { return url.indexOf("jstor.org") != -1; };

    this.identify = function () {
        try {

            if (this.getDoi() !== null) {
                return 1;
            }
            var dois = this.getDois();
            return dois.length;
        }
        catch (e) {

        }
        return 0;
    };

    this.getDoi = function () {
        try {
            var script = document.querySelector("script[data-analytics-provider='ga']");
            if (script === null) {
                return null;
            }
            if (script.innerHTML === null) {
                return null;
            }
            var doi = /objectDOI.+?(10.+?)\"/.exec(script.innerHTML);
            if (doi === null) {
                return null;
            }
            return doi[1];
        }
        catch (e) {
            console.error(e);
        }
        return null;
    };

    this.getDois = function () {
        var dois = [];
        try {
            var inputs = document.querySelectorAll("input[name='doi']");
            for (var input of inputs) {
                dois.push(input.getAttribute("value"));
            }
        }
        catch (e) {
            console.error(e);
        }
        return dois;
    };

    this.checkAccess = async function () {
        var response = await fetch("https://www.jstor.org/access_details/");
        var json = await response.json();
        if (json.tc_accepted || json.has_active_jpass) {
            this.isLoggedIn = true;
        }
        else {
            this.isLoggedIn = false;
        }
    };

    this.scanAsync = async function () {
        var records = [];
        try {

            await this.checkAccess();

            var dois = this.getDois();
            if (dois.length === 0) {
                dois.push(this.getDoi());
            }
            //https://www.jstor.org/citation/bulk/ris?referring_requestid=&ab_segments=&citations=10.2307%2F43856647&citations=10.2307%2F26819617
            var url = "https://www.jstor.org/citation/bulk/ris";
            var data = new URLSearchParams();
            data.append("referring_requestid", "");
            data.append("ab_segments", "");
            for (var doi of dois) {
                data.append("citations", doi);
            }

            var ris_response = await fetch(url, {method: 'POST', body: data});
            var ris_text = await ris_response.text();

            var ris_records = ris_text.split('ER  -');
            for (var ris_record of ris_records) {
                try {
                    var jstorId = /jstor.org\/stable\/(.+)/.exec(ris_record);
                    if (jstorId === null) {
                        continue;
                    }
                    ris_record += "QZ  - https://www.jstor.org/stable/pdf/" + jstorId[1] + ".pdf";
                    records.push(ris_record);
                }
                catch (e) {
                    console.error(e);
                }
            }
        }
        catch (e) {
            console.error(e);
        }
        return records;
    };
};

if (typeof hunters !== 'undefined') {
    hunters.add(hunter);
}