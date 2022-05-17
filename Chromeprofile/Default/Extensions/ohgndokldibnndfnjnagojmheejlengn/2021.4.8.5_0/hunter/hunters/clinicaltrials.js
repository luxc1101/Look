var hunter = new function() {
    this.fileName = "clinicaltrials.js";
    this.name = "ClinicalTrials";
    this.id = "0CBD37F7-7B40-47F7-8857-59E36F5D1B99";
    this.importFormat = "1bdc9da0-328c-4cdf-96de-b9fe2eaef9da";
    this.priority = 10;
    this.example = "https://clinicaltrials.gov/ct2/";

    this.identifyUrl = function (url) { return url.indexOf("https://clinicaltrials.gov/ct2/") != -1 };

    this.identify = function () {
        try {
            var id = /NCT\d+$/.exec(document.URL)[0];
            return 1;
        }
        catch (e) {
        }
        return 0;
    }

    this.scanAsync = async function () {
        var records = [];
        try {

            var id = /NCT\d+/.exec(document.URL)[0];
            var record = "";

            var response = await fetch("https://clinicaltrials.gov/ct2/show/" + id + "?displayxml=true");
            var responseText = await response.text();
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(responseText, "text/xml");
            var title = xmlDoc.getElementsByTagName("official_title")[0].textContent.trim();
            record += "TY  - WEB\r\n";
            record += "TI  - " + title + "\r\n";
            record += "ED  - ClinicalTrials.gov\r\n";

            for (var sponsor of xmlDoc.getElementsByTagName("sponsors")) {
                for (var lead_sponsor of sponsor.childNodes) {
                    for (var agency of lead_sponsor.childNodes) {
                        if (agency.nodeName != "agency") {
                            continue;
                        }
                        if (isNullOrEmpty(agency.textContent)) {
                            continue;
                        }
                        record += "AU  - " + agency.textContent.trim() + "\r\n";
                    }
                }
            }

            var org_study_id = xmlDoc.getElementsByTagName("org_study_id")[0].textContent.trim();
            record += "T2  - " + id + ", " + org_study_id + "\r\n";

            var hasAbstract = false;
            for (var brief_summary of xmlDoc.getElementsByTagName("detailed_description")) {
                for (var textblock of brief_summary.childNodes) {
                    if (isNullOrEmpty(textblock.textContent.trim())) {
                        continue;
                    }
                    var ab = textblock.textContent.trim();
                    ab = ab.replace("\r\n", " ");
                    ab = ab.replace(/\s+/g, " ");
                    record += "AB  - " + ab + "\r\n";
                    hasAbstract = true;
                }
            }

            if (!hasAbstract) {
                for (var brief_summary of xmlDoc.getElementsByTagName("brief_summary")) {
                    for (var textblock of brief_summary.childNodes) {
                        if (isNullOrEmpty(textblock.textContent.trim())) {
                            continue;
                        }
                        var ab = textblock.textContent.trim();
                        ab = ab.replace("\r\n", " ");
                        ab = ab.replace(/\s+/g, " ");
                        record += "AB  - " + ab + "\r\n";
                    }
                }
            }

            //for (var location of xmlDoc.getElementsByTagName("location")) {
            //    for (var facility of location.childNodes) {
            //        if (facility.nodeName == "facility") {
            //            for (var name of facility.childNodes) {
            //                if (name.nodeName == "name") {
            //                    record += "CY  - " + name.textContent.trim() + "\r\n";
            //                }
            //            }
            //        }
            //    }
            //}

            for (var keyword of xmlDoc.getElementsByTagName("keyword")) {
                if (isNullOrEmpty(keyword.textContent.trim())) {
                    continue;
                }
                record += "KW  - " + keyword.textContent.trim() + "\r\n";
            }

            var url = xmlDoc.getElementsByTagName("document_url");
            if (url != null && url.length > 0) {
                record += "QZ  - " + url[0].textContent + "\r\n";
            }

            var last_update_posted  = xmlDoc.getElementsByTagName("last_update_posted");
            if (last_update_posted != null && last_update_posted.length > 0) {
                record += "Y2  - " + last_update_posted[0].textContent + "\r\n";
            }

            record += "UR  - https://clinicaltrials.gov/ct2/show/" + id + "\r\n";

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