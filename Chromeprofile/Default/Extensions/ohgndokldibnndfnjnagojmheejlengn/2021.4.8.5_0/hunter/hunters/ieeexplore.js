var hunter = new function() {
	this.fileName = "ieeexplore.js";
	this.name = "IEEEXplore";
    this.id = "602C06E9-C94B-4E07-9698-C37BB3019DAF";
    this.importFormat = "1bdc9da0-328c-4cdf-96de-b9fe2eaef9da";
    this.priority = 10;
    this.example = "https://ieeexplore.ieee.org/document/8337949/";

    this.identifyUrl = function (url) { return url.indexOf("ieeexplore.ieee.org/document") != -1 };

    this.identify = function () {
        try {
            var ieeeId = /ieeexplore.ieee.org\/document\/(\d+)/.exec(document.URL)[1];
            if (ieeeId == null) return 0;
            return 1;
        }
        catch(e){

        }
        return 0;
    }

    this.scanAsync = async function () {
        var records = [];
        try {

            var ieeeId = /ieeexplore.ieee.org\/document\/(\d+)/.exec(document.URL)[1];
            var exportLink = "https://ieeexplore.ieee.org/xpl/downloadCitations";
            var response = await fetch(exportLink, {
                method: "POST",
                body: new URLSearchParams("citations-format=citation-abstract&download-format=download-ris&recordIds=" + ieeeId)
            });
            var responseText = await response.text();

            responseText += "\r\nQZ  - https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=" + ieeeId;
            
            records.push(responseText);

            var doi_match = /DO  - (.+)/.exec(responseText);
            var doi = "";
            if (doi_match.length == 2) {
                doi = doi_match[1].trim();
            }

            if (doi !== "") {
                var url = "https://ieeexplore.ieee.org/rest/document/" + ieeeId + "/references";
                response = await fetch(url, {
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                    },
                });

                response_text = await response.json();
                var bib_reference = {
                    json: response_text,
                    doi: doi,
                    type: "bib"
                }

                records.push(bib_reference);
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