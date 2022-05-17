var hunter = new function () {
    this.fileName = "ebscohost.js";
    this.name = "EBSCOhost";
    this.id = "31C7BF0A-E6C8-48B8-B988-192536888BE1";
    this.importFormat = "1bdc9da0-328c-4cdf-96de-b9fe2eaef9da";
    this.priority = 10;


    this.identifyUrl = function (url) { return url.indexOf("ebscohost.com/ehost") != -1; };

    this.identify = function () {
        try {
            if (window.location.href.indexOf("bdata") === -1) {
                return 0;
            }
            if (document.querySelector('a[title="Cite"') === null) {
                return 0;
            }
        }
        catch (e) {
            return 0;
        }
        return 1;
    };

    this.scanAsync = async function () {
        var records = [];
        try {

            var urlParams = new URLSearchParams(window.location.href);

            var sid = urlParams.get('sid');
            var bdata = urlParams.get('bdata');
            var vid = /vid=(\d+)/.exec(window.location.href)[1];
            
            var db = /db=(.+?)(&|$)/.exec(window.location.hash)[1];
            var an = /AN=(.+?)(&|$)/.exec(window.location.hash)[1];
            var bdata = bdata.replace(/#.+/, "");

            bag = btoa(`${db}__${an}__AN`);
            bag = bag.replace(/\+/g, "-").replace(/\//g, "_");

            if (bag.indexOf("=") !== -1) {
                bag = bag.replace(/=*$/, function (m) {
                    return m.length;
                });
            }
            else {
                bag += "0";
            }

            var url = `/ehost/delivery/ExportPanelSave/${bag}?vid=${vid}&sid=${sid}&bdata=${bdata}&theExportFormat=1`;
            var response = await fetch(url);
            var ris = await response.text();
            ris = ris.replace("DB  - ", "TS  - EBSCOhost ");
            if (document.querySelector('a[title="PDF Full Text"') !== null) {
                try {
                    var pdfurl = `/ehost/pdfviewer/pdfviewer/${bag}?vid=${vid}&sid=${sid}`;
                    response = await fetch(pdfurl);
                    var pdf_response = await response.text();
                    var downloadPdf = /a id="downloadLink".+?href="(.+?)"/.exec(pdf_response)[1];
                    ris += "\r\nDP  - " + downloadPdf.replace(/&amp;/g, "&");
                }
                catch (e) { }
            }

            records.push(ris);
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