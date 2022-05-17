var hunter = new function () {
    this.fileName = "ssoar.js";
    this.name = "SSOAR";
    this.id = "0BFC8248-F9F4-423E-965F-2237FA200B6E";
    this.importFormat = "1bdc9da0-328c-4cdf-96de-b9fe2eaef9da";
    this.priority = 10;
    this.example = "https://www.ssoar.info/ssoar/handle/document/25274";

    this.identifyUrl = function (url) { return url.indexOf("www.ssoar.info/ssoar/handle/document/") != -1; };

    this.identify = function () {
        try {

            var element = document.querySelector("meta[name='citation_title']");
            if (element != null) {
                return 1;
            }
        }
        catch (e) {
            console.error(e);
        }
        return 0;
    };

    this.scanAsync = function () {
        return new Promise(resolve => {
            resolve(this.scan());
        });
    };

    this.scan = function () {
        var result = [];
        var recordText = "";
        var referenceType = "";
        var reference =
        {
            HasEP: false,
            HasSP: false,
            HasDP: false,
            HasYear: false,
            HasAccess: false,
            HasAbstract: false,
            HasKeywords: false,
            Doi: "",
            refType: "",
            bag: [],
            affiliations: [],
        };

        try {
            var metaElements = document.getElementsByTagName("meta");

            for (var i = 0; i < metaElements.length; i++) {
                var metaElement = metaElements[i];

                for (var j = 0; j < metaElement.attributes.length; j++) {
                    var metaAttribute = metaElement.attributes[j];
                    if (metaAttribute.name == "name" ||
                        metaAttribute.name == "property") {
                        switch (metaAttribute.value) {

                            case "DC.type":
                                switch (metaElement.content) {
                                    case "Konferenzbeitrag":
                                        recordText += "TY  - CPAPER\r\n";
                                        reference.refType = "CPAPER";
                                        break;

                                    case "journal article":
                                        recordText += "TY  - JOUR\r\n";
                                        reference.refType = "JOUR";
                                        break;

                                    case "Sammelwerksbeitrag":
                                        recordText += "TY  - CHAPTER\r\n";
                                        reference.refType = "CHAPTER";
                                        break;

                                    case "Sammelwerk":
                                        recordText += "TY  - BOOK\r\n";
                                        reference.refType = "BOOK";
                                        break;
                                }
                                break;

                            case "Access":
                                if (metaElement.content == "Yes") reference.HasAccess = true;
                                break;

                            case "citation_abstract":
                            case "DCTERMS.abstract":
                                if (reference.HasAbstract) continue;

                                reference.HasAbstract = true;
                                recordText += "AB  - " + metaElement.content;
                                break;

                            case "citation_abstract_html_url":
                                recordText += "L1  - " + metaElement.content;
                                break;

                            case "citation_arxiv_id":
                                recordText += "AX  - " + metaElement.content;
                                break;

                            case "citation_author":
                            case "citation_authors":
                                var parsedNames = this.parsePersonNames(metaElement.content);
                                for (var jj = 0; jj < parsedNames.length; jj++) {
                                    recordText += "AU  - " + parsedNames[jj] + "\r\n";
                                }
                                break;

                            case "citation_author_email":
                                recordText += "AD  - " + metaElement.content;
                                break;

                            case "citation_author_institution":
                                if (reference.affiliations[metaElement.content] != null) continue;
                                reference.affiliations[metaElement.content] = 1;
                                recordText += "AD  - " + metaElement.content;
                                break;

                            case "citation_conference_title":
                                recordText += "TY  - CPAPER\r\n";
                                recordText += "T2  - " + metaElement.content;
                                break;

                            case "citation_inbook_title":
                                recordText += "TY  - CHAPTER\r\n";
                                recordText += "T2  - " + metaElement.content;
                                break;

                            case "citation_book_title":
                                recordText += "T2  - " + metaElement.content;
                                reference.refType = "Book";
                                break;

                            case "citation_conference":
                                recordText += "C1  - " + metaElement.content;
                                break;

                            case "citation_date":
                                recordText += "Y1  - " + metaElement.content;
                                break;

                            case "citation_doi":
                                recordText += "DO  - " + metaElement.content;
                                break;

                            case "citation_technical_report_number":
                                recordText += "SN  - " + metaElement.content;
                                referenceType = "TY  - RPRT";
                                break;

                            case "citation_technical_report_institution":
                                recordText += "T2  - " + metaElement.content;
                                referenceType = "TY  - RPRT";
                                break;

                            case "citation_dissertation_institution":
                                referenceType = "TY  - THES";
                                recordText += "PB  - " + metaElement.content;
                                break;

                            case "citation_dissertation_name":
                                referenceType = "TY  - THES";
                                recordText += "TI  - " + metaElement.content;
                                break;

                            case "citation_firstpage":
                            case "prism.startingPage":
                                if (!reference.HasSP) {
                                    reference.HasSP = true;
                                    recordText += "SP  - " + metaElement.content;
                                }
                                if (reference.refType == "Book") {
                                    reference.refType = "CHAPTER";
                                }
                                break;

                            case "citation_fulltext_html_url":
                                recordText += "L1  - " + metaElement.content;
                                break;

                            case "citation_isbn":
                                recordText += "SN  - " + metaElement.content;
                                break;

                            case "citation_issn":
                                if (referenceType == "") {
                                    referenceType = "TY  - JOUR";
                                }
                                break;

                            case "citation_issue":
                                recordText += "IS  - " + metaElement.content;
                                break;

                            case "citation_journal_abbrev":
                                recordText += "JA  - " + metaElement.content;
                                break;

                            case "citation_journal_title":
                                referenceType = "TY  - JOUR";
                                recordText += "JF  - " + metaElement.content;
                                break;

                            case "citation_keywords":
                            case "DC.subject":
                                recordText += "KW  - " + metaElement.content;
                                break;

                            case "citation_language":
                                recordText += "LA  - " + metaElement.content;
                                break;

                            case "citation_lastpage":
                            case "prism.endingPage":
                                if (!reference.HasEP) {
                                    reference.HasEP = true;
                                    recordText += "EP  - " + metaElement.content;
                                }
                                break;

                            case "citation_online_date":
                                recordText += "Y2  - " + metaElement.content;
                                reference.bag["date"] = metaElement.content;
                                break;

                            case "citation_pages":
                                recordText += "SP  - " + metaElement.content.replace("--", "-");
                                break;

                            case "citation_patent_number":
                                referenceType = "TY  - PAT";
                                recordText += "SE  - " + metaElement.content;
                                break;

                            case "citation_patent_country":
                                referenceType = "TY  - PAT";
                                recordText += "CY  - " + metaElement.content;
                                break;

                            case "citation_pdf_url":
                                {
                                    reference.HasDP = true;
                                    recordText += "QZ  - " + metaElement.content;
                                    recordText += "\r\nU6  - " + metaElement.content;
                                }
                                break;

                            case "citation_pmid":
                                recordText += "C8  - " + metaElement.content;
                                break;

                            case "citation_publication_date":
                                var date = metaElement.content;
                                if (date != null && date.endsWith("/00/00")) {
                                    date = date.substring(0, date.length - 6);
                                }
                                recordText += "PY  - " + date;
                                reference.HasYear = true;
                                break;

                            case "citation_publisher":
                                recordText += "PB  - " + metaElement.content;
                                break;

                            case "citation_technical_report_institution":
                                referenceType = "TY  - RPRT";
                                recordText += "PB  - " + metaElement.content;
                                break;

                            case "citation_technical_report_number":
                                referenceType = "TY  - RPRT";
                                recordText += "VL  - " + metaElement.content;
                                break;

                            case "citation_title":
                                recordText += "TI  - " + metaElement.content;
                                break;

                            case "citation_volume":
                                recordText += "VL  - " + metaElement.content;
                                break;

                            case "citation_year":
                                recordText += "PY  - " + metaElement.content;
                                reference.HasYear = true;
                                break;

                            case "description":
                                if (document.URL.indexOf("citeseerx.ist.psu.edu") != -1) {
                                    recordText += "AB  - " + metaElement.content;
                                }
                                break;

                            case "citation_affiliation":
                                recordText += "AD  - " + metaElement.content;
                                break;

                            default:
                                continue;

                        }
                        recordText += "\r\n";
                    }
                }
            }

            if (reference.refType != "") {
                recordText = "TY  - " + reference.refType + "\r\n" + recordText;
            }

            if (reference.HasAccess && !reference.HasDP) {
                recordText += "QZ  - " + document.URL + "\r\n";
            }


            if (referenceType == "" &&
                reference.refType == "") {
                if (isCiteSeer) {
                    referenceType = "TY  - GEN";
                }
                else {
                    referenceType = "TY  - GEN";
                }
            }

            if (!reference.HasYear &&
                reference.bag["date"] != null) {
                recordText += "PY  - " + reference.bag["date"] + "\r\n";
            }

            recordText += "UR  - " + document.URL + "\r\n";
            recordText += "TS  - " + document.location.hostname + "\r\n";
            recordText = referenceType + "\r\n" + recordText;

            result.push(recordText);
        }
        catch (e) {
            console.error(e);
        }

        return result;
    };

    this.parsePersonNames = function(personNames) {

        var newArray = new Array();

        for (var personName of personNames.split(';')) {
            if (personName.indexOf(",") == -1) {
                var personNameArray = personName.split(' ');
                personName = personNameArray[personNameArray.length - 1] + ", ";
                for (var j = 0; j < personNameArray.length - 1; j++) {
                    personName += personNameArray[j] + " ";
                }
            }
            newArray.push(personName);
        }
        return newArray;
    }
}
if (typeof hunters !== 'undefined') {
    hunters.add(hunter);
}
