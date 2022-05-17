class CitationMetaTagParser {
    constructor() {
        this._doi = "";
        this._pdfUrl = "";
        this._isbn = "";
        this._oai = "";
        this._success = false;
        this._url = "";
    }
    
    get DOI() {
        return this._doi;
    }
    get PDFUrl() {
        return this._pdfUrl;
    }
    get ISBN() {
        return this._isbn;
    }
    get OAI() {
        return this._oai;
    }
    get Success() {
        return this._success;
    }

    async parse(html, url, findPdfUrlOnly) {

        this._doi = "";
        this._isbn = "";
        this._success = false;
        this._url = url;

        if (html == "") return "";

        var recordText = "";
        try {
            var metaElements = [];

            html = html.replace(/\sxmlns=\".+?\"/g, "");
            html = html.replace(/\sxml\:lang=\".+?\"/g, "");
            html = html.replace(/(?:\r\n|\r|\n)/g, '');
            var rgx = /<meta name=\"(.+?)\".+?content=\"(.*?)\"/g;
            var match;
            do {
                match = rgx.exec(html);
                if (match) {
                    metaElements.push({
                        name: match[1].replace(/\"/g, "").trim().toLocaleLowerCase(),
                        content: match[2].replace(/\"/g, "").trim(),
                        raw: match[0]
                    });
                }
            } while (match);

            rgx = /<meta content=\"(.*?)\".+?name=\"(.+?)\"/g;
            match;
            do {
                match = rgx.exec(html);
                if (match) {
                    metaElements.push({
                        name: match[2].replace(/\"/g, "").trim().toLocaleLowerCase(),
                        content: match[1].replace(/\"/g, "").trim(),
                        raw: match[0]
                    });
                }
            } while (match);

            rgx = /<meta property=\"(.+?)\".+?content=\"(.*?)\"/g;
            match;
            do {
                match = rgx.exec(html);
                if (match) {
                    metaElements.push({
                        name: match[1].replace(/\"/g, "").trim().toLocaleLowerCase(),
                        content: match[2].replace(/\"/g, "").trim(),
                        raw: match[0]
                    });
                }
            } while (match);

            var reference =
            {
                HasEP: false,
                HasSP: false,
                HasDP: false,
                HasYear: false,
                HasAccess: false,
                HasAbstract: false,
                HasKeywords: false,
                HasTitle: false,
                Doi: "",
                refType: "",
                bag: [],
                affiliations: [],
                isbn: "",
                issn: "",
                language: "",
            };

            reference.refType = this.getReferenceType(metaElements);

            for (var metaElement of metaElements) {
                recordText += "\r\n";
                var content = metaElement.content;

                switch (metaElement.name) {
                    case "Access":
                        if (content == "Yes") {
                            reference.HasAccess = true;
                        }
                        break;

                    case "citation_xml_url":
                        reference.citation_xml_url = content;
                        break;

                    case "citation_pii":
                        {
                            try {
                                if (!findPdfUrlOnly) {
                                    var pii = content;
                                    var response = await fetch("https://www.sciencedirect.com/sdfe/arp/cite?pii=" + pii + "&format=application%2Fx-research-info-systems&withabstract=true");
                                    var responseText = await response.text();
                                    if (responseText.indexOf("UR  -") != -1 && responseText.indexOf(pii) != -1) {
                                        return responseText;
                                    }
                                }
                            }
                            catch (e) {
                                console.error(e);
                            }
                        }
                        break;

                    case "eprints.abstract":
                    case "citation_abstract":
                    case "dcterms.abstract":
                    case "dcterms.description":
                    case "dc.description":
                    case "description":
                    case "og:description":
                        if (reference.HasAbstract) continue;
                        if (content == "none") continue;

                        reference.HasAbstract = true;
                        recordText += "AB  - " + content;
                        break;

                    case "citation_abstract_html_url":
                        break;

                    case "citation_arxiv_id":
                        recordText += "AX  - " + content;
                        break;

                    case "citation_author":
                        recordText += "AU  - " + content + "\r\n";
                        break;

                    case "citation_author":
                    case "citation_authors":
                    case "wkhealth_authors":
                    case "eprints.creators_name":
                        var parsedNames = this.parsePersonNames(content);
                        for (var jj = 0; jj < parsedNames.length; jj++) {
                            recordText += "AU  - " + parsedNames[jj] + "\r\n";
                        }
                        break;

                    case "eprints.editors_name":
                        var parsedNames = this.parsePersonNames(metaElement.content);
                        for (var jj = 0; jj < parsedNames.length; jj++) {
                            recordText += "ED  - " + parsedNames[jj] + "\r\n";
                        }
                        break;

                    case "dc.contributor":
                        var personTag = "A3  - ";
                        if (reference.refType === "CHAPTER" ||
                            reference.refType === "CPAPER") {
                            personTag = "ED  - ";
                        }
                        var parsedNames = this.parsePersonNames(metaElement.content);
                        for (var jj = 0; jj < parsedNames.length; jj++) {
                            recordText += personTag + parsedNames[jj] + "\r\n";
                        }
                        break;

                    case "citation_author_email":
                        recordText += "AD  - " + content;
                        break;

                    case "citation_author_institution":
                        if (reference.affiliations[content] != null) continue;
                        reference.affiliations[content] = 1;
                        recordText += "AD  - " + content;
                        break;

                    case "citation_conference_title":
                    case "eprints.event_title":
                        recordText += "T2  - " + content;
                        this._success = true;
                        break;

                    case "citation_inbook_title":
                        recordText += "T2  - " + content;
                        this._success = true;
                        break;

                    case "citation_book_title":
                    case "eprints.book_title":
                        recordText += "T2  - " + content;
                        this._success = true;
                        break;

                    case "citation_conference":
                        recordText += "C1  - " + content;
                        break;

                    case "citation_date":
                        if (reference.refType === "PCOMM") {
                            recordText += "DA  - " + content;
                        }
                        else {
                            recordText += "Y1  - " + content;
                        }
                        break;

                    case "dc.identifier":
                        {
                            if (this._doi == "" &&
                                content.indexOf("10.") != -1 &&
                                content.indexOf("/") != -1) {
                                this._doi = content;
                                recordText += "DO  - " + content;
                            }

                            if (content.startsWith("oai:")) {
                                this._oai = content;
                                recordText += "OA  - " + content;
                            }
                        }
                        break;

                    case "eprints.id_number":
                        if (content.startsWith("10.")) {
                            recordText += "DO  - " + content;
                            this._doi = content;
                        }
                        break;

                    case "prism.doi":
                    case "dc.doi":
                    case "dcsext.wt_doi":
                    case "citation_doi":
                    case "wkhealth_doi":
                        recordText += "DO  - " + content;
                        this._doi = content;
                        break;

                    case "citation_technical_report_number":
                        recordText += "SN  - " + content;
                        break;

                    case "citation_technical_report_institution":
                        recordText += "T2  - " + content;
                        break;

                    case "citation_dissertation_institution":
                        recordText += "PB  - " + content;
                        break;

                    case "citation_dissertation_name":
                        recordText += "TI  - " + content;
                        this._success = true;
                        break;

                    case "wkhealth_firstpage":
                    case "citation_firstpage":
                    case "prism.startingPage":
                        if (!reference.HasSP) {
                            reference.HasSP = true;
                            recordText += "SP  - " + content;
                        }
                        if (reference.refType == "Book") {
                            reference.refType = "CHAPTER";
                        }
                        break;

                    case "citation_fulltext_html_url":
                        break;

                    case "eprints.isbn":
                    case "citation_isbn":
                        if (reference.isbn === "") {
                            recordText += "SN  - " + content;
                            this._isbn = content;
                            reference.isbn = content;
                        }
                        break;

                    case "eprints.issn":
                    case "citation_issn":
                    case "wkhealth_issn":
                    case "dcsext.wt_issn":
                        if (reference.refType != "RPRT") {
                            recordText += "SN  - " + metaElement.content;
                            reference.issn = metaElement.content;
                        }
                        break;

                    case "eprints.number":
                    case "dcsext.wt_issue":
                    case "citation_issue":
                    case "wkhealth_issue":
                    case "eprints.article_number":
                        recordText += "IS  - " + content;
                        break;

                    case "citation_journal_abbrev":
                        recordText += "JA  - " + content;
                        break;

                    case "eprints.series":
                        recordText += "T3  - " + content;
                        break;

                    case "eprints.publication":
                    case "citation_journal_title":
                    case "dcsext.wt_name":
                    case "wkhealth_journal_title":
                        recordText += "JF  - " + content;
                        break;

                    case "citation_keywords":
                    case "eprints.keywords":
                    case "dc.subject":
                        var keywords = this.parseKeywords(content);
                        for (var keyword of keywords) {
                            var text = keyword.trim();
                            recordText += "\r\nKW  - " + text;
                        }
                        break;

                    case "citation_language":
                    case "dc.language":
                        if (reference.language === content) continue;
                        recordText += "LA  - " + content;
                        reference.language = content;
                        break;

                    case "citation_lastpage":
                    case "prism.endingPage":
                        if (!reference.HasEP) {
                            reference.HasEP = true;
                            recordText += "EP  - " + content;
                        }
                        break;

                    case "citation_online_date":
                        recordText += "Y2  - " + content;
                        reference.bag["date"] = content;
                        break;

                    case "citation_pages":
                    case "eprints.pagerange":
                        recordText += "SP  - " + content.replace("--", "-");
                        break;

                    case "citation_patent_number":
                        recordText += "SE  - " + content;
                        break;

                    case "citation_patent_country":
                        recordText += "CY  - " + content;
                        break;

                    case "eprints.document_url":
                    case "wkhealth_pdf_url":
                    case "citation_pdf_url":
                    case "citation_abstract_pdf_url": //https://www.jmir.org/2019/10/e13601/
                        {
                            if (!reference.HasDP) {
                                reference.HasDP = true;
                                if (url.indexOf("scielo") != -1) {
                                    recordText += "L1  - " + content;
                                }
                                else {
                                    recordText += "QZ  - " + content;
                                }
                                this._pdfUrl = content;
                            }
                        }
                        break;

                    case "eprints.event_title":
                        if (reference.refType === "CPAPER") {
                            recordText += "JF  - " + metaElement.content;
                        }
                        break;

                    case "eprints.event_location":
                        if (reference.refType === "CPAPER") {
                            recordText += "C1  - " + metaElement.content;
                        }
                        break;

                    case "eprints.event_dates":
                        if (reference.refType === "CPAPER") {
                            recordText += "C4  - " + metaElement.content;
                        }
                        break;

                    case "eprints.event_start":
                        if (reference.refType === "CPAPER") {
                            reference.event_start = metaElement.content;
                            recordText += "C4  - " + metaElement.content;
                        }
                        break;

                    case "eprints.event_end":
                        if (reference.refType === "CPAPER") {
                            if (reference.event_start) {
                                recordText += "C4  - " + reference.event_start + " - " + metaElement.content;
                            }
                            else {
                                recordText += "C4  - " + metaElement.content;
                            }
                        }
                        break;

                    case "eprints.institution":
                        if (reference.refType === "CPAPER") {
                            recordText += "IN  - " + metaElement.content;
                        }
                        if (reference.refType === "RPRT") {
                            recordText += "IN  - " + metaElement.content;
                        }
                        break;

                    case "citation_patent_country":
                    case "eprints.place_of_pub":
                        if (!reference.HasPlaceOfPublication) {
                            recordText += "CY  - " + metaElement.content;
                            reference.HasPlaceOfPublication = true;
                        }
                        break;

                    case "citation_pmid":
                        recordText += "PM  - " + content;
                        break;

                    case "wkhealth_date":
                    case "eprints.date":
                    case "citation_publication_date":
                        recordText += "PY  - " + content;
                        reference.HasYear = true;
                        break;

                    case "citation_publisher":
                    case "eprints.publisher":
                    case "dc.publisher":
                        recordText += "PB  - " + content;
                        break;

                    case "citation_technical_report_institution":
                        recordText += "PB  - " + content;
                        break;

                    case "citation_technical_report_number":
                        recordText += "VL  - " + content;
                        break;

                    case "wkhealth_title":
                    case "eprints.title":
                    case "dc.title":
                    case "dcsext.wt_title":
                    case "citation_title":
                        {
                            if (reference.HasTitle) {
                                continue;
                            }
                            reference.HasTitle = true;
                            var title = content;
                            title = htmlToText(title);
                            title = title.replace(/<.+?>/g, "");
                            recordText += "TI  - " + title;
                            this._success = true;
                        }
                        break;

                    case "eprints.volume":
                    case "citation_volume":
                    case "dcsext.wt_volume":
                    case "wkhealth_volume":
                        recordText += "VL  - " + content;
                        break;

                    case "citation_year":
                        recordText += "PY  - " + content;
                        reference.HasYear = true;
                        break;

                    case "description":
                        if (url.indexOf("citeseerx.ist.psu.edu") != -1) {
                            recordText += "AB  - " + content;
                        }
                        break;

                    case "citation_affiliation":
                        recordText += "AD  - " + content;
                        break;

                    case "twitter:image":
                    case "twitter:image:src":
                    case "og:image":
                        {
                            if (reference.hasCover) {
                                continue;
                            }
                            if (content.indexOf("pubmed-meta-image.png") !== -1) {
                                continue;
                            }
                            reference.hasCover = true;
                            recordText += "QX  - " + content;
                        }
                        break;

                    default:
                        //console.log(metaElement.name);
                        continue;

                }
            }

            recordText += "\r\n";

            var loc = new URL(url);

            if (reference.refType != "") {
                recordText = "TY  - " + reference.refType + "\r\n" + recordText;
            }
            else if (loc.hostname === "core.ac.uk") {
                recordText = "TY  - RPRT\r\n" + recordText;
            }
            else if (this._oai !== "") {
                recordText = "TY  - GEN\r\n" + recordText;
            }

            if (reference.HasAccess && !reference.HasDP) {
                recordText += "QZ  - " + url + "\r\n";
            }

            if (!reference.HasYear &&
                reference.bag["date"] != null) {
                recordText += "PY  - " + reference.bag["date"] + "\r\n";
            }

            if (loc.hostname == "plato.stanford.edu") {
                recordText += "U6  - " + url + "\r\n"; //#18136
                recordText += "Y3  - " + new Date().toLocaleDateString() + "\r\n";
            }

            if (loc.hostname == "www.emerald.com" && !reference.HasDP) {
                reference.HasDP = true;
                var emerald_url = url.replace("/full/html", "/full/pdf");
                recordText += "QZ  - " + url.replace("/full/html", "/full/pdf") + "\r\n";
                recordText += "\r\nU6  - " + url.replace("/full/html", "/full/pdf") + "\r\n";
                this._pdfUrl = emerald_url;
            }

            recordText += "UR  - " + url + "\r\n";
            recordText += "TS  - " + loc.hostname + "\r\n";

            var r = recordText.split('\r\n');
            recordText = "";
            for (var l of r) {
                if (l == "") continue;
                recordText += l + "\r\n";
            }
        }
        catch (e) {
            console.error(e);
        }
        //console.log("CitatonMetaTag: \r\n" + recordText);
        return recordText;
    }

    parseKeywords(keywords) {
        var arr = new Array();
        if (keywords.indexOf(";") !== -1) {
            for (var keyword of keywords.split(';')) {
                arr.push(keyword);
            }
        }
        else if (keywords.indexOf(",") !== -1) {
            for (var keyword of keywords.split(',')) {
                arr.push(keyword);
            }
        }
        else if (keywords.indexOf(".") !== -1) {
            for (var keyword of keywords.split('.')) {
                arr.push(keyword);
            }
        }
        else {
            arr.push(keywords);
        }
        return arr;
    }

    parsePersonNames(personNames) {

        var newArray = new Array();
        var isPubmed = this._url !== undefined && this._url !== null && this._url.indexOf("pubmed.ncbi.nlm.nih.gov") !== -1;
        for (var personName of personNames.split(';')) {
            if (personName.indexOf(",") == -1) {
                var personNameArray = personName.split(' ');
                if (isPubmed) {
                    personName = personNameArray[0] + ", ";
                    for (var j = 1; j < personNameArray.length; j++) {
                        personName += personNameArray[j] + " ";
                    }
                }
                else {
                    
                    personName = personNameArray[personNameArray.length - 1] + ", ";
                    for (var j = 0; j < personNameArray.length - 1; j++) {
                        personName += personNameArray[j] + " ";
                    }
                }
            }
            newArray.push(personName);
        }
        return newArray;
    }

    getReferenceType(metaElements) {

        var refType = "";
        for (var metaElement of metaElements) {

            var content = metaElement.content.toLocaleLowerCase();

            switch (metaElement.name.toLocaleLowerCase()) {

                case "citation_conference_title":
                    refType = "CPAPER";
                    break;

                case "citation_book_title":
                    refType = "Book";
                    break;

                case "citation_inbook_title":
                    refType = "CHAPTER";
                    break;

                case "citation_technical_report_number":
                    refType = "RPRT";
                    break;

                case "citation_technical_report_institution":
                    refType = "RPRT";
                    break;

                case "citation_dissertation_institution":
                    refType = "THES";
                    break;

                case "citation_dissertation_name":
                    refType = "THES";
                    break;

                case "citation_firstpage":
                case "prism.startingpage":
                    if (refType == "Book") {
                        refType = "CHAPTER";
                    }
                    break;

                case "citation_issn":
                    if (refType != "RPRT") {
                        refType = "JOUR";
                    }
                    break;

                case "citation_journal_title":
                    refType = "JOUR";
                    break;

                case "citation_patent_number":
                    refType = "PAT";
                    break;

                case "citation_patent_country":
                    refType = "PAT";
                    break;

                case "citation_technical_report_institution":
                    refType = "RPRT";
                    break;

                case "citation_technical_report_number":
                    refType = "RPRT";
                    break;

                case "og:type":
                    if (content === "article") {
                        refType = "JOUR";
                    }
                    break;

                case "dc.type":
                    if (content.indexOf("konferenzbeitrag") !== -1) {
                        refType = "CPAPER";
                    }
                    else if (content.indexOf("conference item") !== -1) {
                        refType = "CPAPER";
                    }
                    else if (content.indexOf("proceedings") !== -1) {
                        refType = "CPAPER";
                    }
                    else if (content.indexOf("buchkapitel") !== -1) {
                        refType = "CHAPTER";
                    }
                    else if (content.indexOf("correspondence") !== -1) {
                        refType = "PCOMM";
                    }
                    else if (content.indexOf("article") !== -1) {
                        refType = "JOUR";
                    }
                    else if (content.indexOf("report") !== -1) {
                        refType = "RPRT";
                    }
                    else if (content.indexOf("book item") !== -1) {
                        refType = "CHAPTER";
                    }
                    else if (content.indexOf("thesis") !== -1) {
                        refType = "THES";
                    }
                    
                    break;

                default:
                    continue;

            }
        }

        return refType;
    }
}