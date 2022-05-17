class SimpleParser {

    static get ENW_ID() {
        return "1bdc9da0-123c-4cdf-96de-b9fe2eaef9da";
    }
    static get RIS_ID() {
        return "1bdc9da0-328c-4cdf-96de-b9fe2eaef9da";
    }
    static get REFWORK_RIS_ID() {
        return "0a41ea70-fde9-4897-bfba-a7338ca787ad";
    }
    static get PubMed_ID() {
        return "3d2c0414-066b-4a30-b011-06136eb493f9";
    }
    static get COINS_ID() {
        return "54B6DF2C-9C53-4D8A-9508-B72A552016FB";
    }

    constructor() {
        this.datetimeformat = "";
        this.personNameParser = new PersonNameParser();
    }

    cleanUpUrl(url) {
        try {
            if (url.indexOf("?fbclid") != -1) {
                url = url.replace(/\?fbclid.+/, "").trim();
            }
        }
        catch (e) {
            telemetry.warn(e);
        }
        return url;
    }

    today() {
        return dateToCitaviString("");
    }

    parse(format, records) {
        var references = [];

        if (records === null) {
            telemetry.warn("records must not be null. format: " + format);
            return references;
        }
        
        try {
            switch (format) {
                case "coins":
                    {
                        references = this.parseCoins(records);
                    }
                    break;

                case SimpleParser.ENW_ID:
                    {
                        references = this.parseENW(records);
                    }
                    break;

                case "ris":
                case SimpleParser.RIS_ID:
                    {
                        references = this.parseRIS(records);
                    }
                    break;

                case SimpleParser.REFWORK_RIS_ID:
                    {
                        references = this.parseRIS(records);
                        for (var reference of references) {
                            reference.importFormat = SimpleParser.REFWORK_RIS_ID;
                        }
                    }
                    break;

                case "pubmed":
                case SimpleParser.PubMed_ID:
                    {
                        references = this.parsePubmed(records);
                    }
                    break;

                case "htmlToRis":
                    {
                        //TODO References erstellen und importieren (wg. Cover)
                        return this.parseHtmlToRis(records);
                    }
                    break;

                case "backoffice":
                case "json":
                case "xml":
                    {
                        if (records.length > 0) {
                            var isXml = records[0].indexOf("<ReferenceTypeId>") != -1;
                            if (isXml) {
                                references = this.parseXml(records);
                            }
                            else {
                                references = this.parseJson(records);
                            }
                        }
                    }
                    break;

                default:
                    telemetry.warn("unsupported format: " + format);
                    break;
            }
        }
        catch (e) {
            telemetry.error(e, { records: records });
            return [];
        }

        

        if (settings.developerMode) {
            telemetry.log(references);
        }

        references.forEach(r => r.prettify());

        return references;
    }

    parseDate(input) {
        try {
            return new Date(input);
        }
        catch (e) {
            return null;
        }
    }
    parseKeywords(input) {
        return input.split(/[,;]+/);
    }
    parseTaggedRecord(record, pattern) {
        var lines = record.split(/[\r\n]/g);
        var index = -1;
        var list = new Array();
        for (var line of lines) {
            if (line.trim() == "") continue;
            if (line.trim() == ",") continue;

            pattern.lastIndex = 0;
            if (pattern.test(line)) {
                index++;
                list[index] = line;

            }
            else {
                var val = list[index] + " " + line
                list[index] = val.replace(/\s+/g, " ");
            }

        }
        return list;
    }

    parseCoins(records) {
        var references = [];

        for (var source of records) {
            var reference = new Reference("Coins:" + source, SimpleParser.COINS_ID);
            var coinsRgx = [
                { fld: "isbn", rgx: /rft\.isbn=(.*?)(\&|$)/g },
                { fld: "issn", rgx: /rft\.issn=(.*?)(\&|$)/g },
                { fld: "year", rgx: /rft\.date=(.*?)(\&|$)/g },
                { fld: "placeOfPublication", rgx: /rft\.place=(.*?)(\&|$)/g },
                { fld: "publishers", rgx: /rft\.pub=(.*?)(\&|$)/g }
            ];

            source += "&";
            var titleRegex = new RegExp(/rft\.atitle=(.*?)\&|rft\.btitle=(.*?)\&|rft\.jtitle=(.*?)\&|rft\.title=(.*?)\&/g);
            let [, atitle, btitle, jtitle, rtitle] = titleRegex.exec(source) || [];
            reference.title = atitle || btitle || jtitle || rtitle || "";

            var authorRegex = new RegExp(/rft\.au=(.*?)\&|rft\.aulast=(.*?)\&/g);
            let [, aut1, aut2] = authorRegex.exec(source) || [];
            reference.authors = aut1 || aut2 || "";

            for (var item of coinsRgx) {
                if (item.rgx.test(source)) {
                    item.rgx.lastIndex = 0;
                    reference[item.fld] = item.rgx.exec(source)[1];
                }
            }
            reference.authors = reference.authors.replace(/\+/g, " ");
            reference.title = reference.title.replace(/\+/g, " ");
            references.push(reference);
        }
        return references;
    }

    parseENW(records) {
        var references = [];
        for (var r of records) {
            var record = he.decode(r);
            var reference = new Reference(record, SimpleParser.ENW_ID);
            var lines = this.parseTaggedRecord(record, /^%.+?\s/g);

            for (var line of lines) {
                var m = /^(%.+?)\s(.+)/g.exec(line)
                var fld = m[1].trim();
                var val = m[2].trim();

                switch (fld) {
                    case "%A":
                        reference.authors += val + ";";
                        break;

                    case "%EI":
                        reference.eric_id = val;
                        break;

                    case "%E":
                        reference.editors += val + ";";
                        break;

                    case "%D":
                        if (isNullOrEmpty(reference.year)) {
                            reference.year = val;
                        }
                        break;

                    case "%R":
                        if (val.indexOf("doi.org") != -1) {
                            val = val.replace(/^.+?org.\//, "");
                        }
                        if (val.indexOf("DOI:") != -1) {
                            val = val.replace(/DOI:/, "");
                        }
                        reference.doi = val.trim();
                        break;

                    case "%V":
                        reference.volume = val;
                        break;

                    case "%J":
                        reference.journal = val;
                        break;

                    case "%PD":
                        reference.pdf = val;
                        break;

                    case "%T":
                        if (reference.title == "") {
                            reference.title = val;
                        }
                        break;
                }
            }

            references.push(reference);
        }
        return references;
    }

    parseHtmlToRis(page) {

        if (page.html === undefined) {
            page.html = "";
        }

        var ris = "TY  - WEB\r\n";

        var url = page.url;
        url = this.cleanUpUrl(url);

        ris += `UR  - ${url}\r\n`;
        var titleSource = url;
        try {
            var u = new URL(page.url);
            titleSource = u.host;
        }
        catch (e) {
            telemetry.error(e);
        }
        ris += `TS  - ${titleSource}\r\n`;
        ris += `Y3  - ${this.today()}\r\n`;

        if (!isNullOrUndefined(page.lastModified)) {
            var parsedDate = dateToCitaviString(page.lastModified);
            if (parsedDate) {
                ris += `Y2  - ${parsedDate}\r\n`;
            }
        }
        var info = { hasAbstract: false};

        var rgx = /<meta (name|property)="([^"]+?)"\s*content="(.+?)"/gi;
        var hasTitle = false;
        var hasAuthor = false;
        var fallback_author = "";

        var html = page.html.replace("\r\n\"", "\"");
        var match = rgx.exec(html);

        while (match != null) {
            try {
                var attr = match[2];
                var value = match[3];
                if (value === "") continue;
                if (value === "null") continue;

                attr = attr.replace(/^dc\W|^og\W/g, "");

                switch (attr) {
                    case "title":
                        {
                            if (hasTitle) {
                                continue;
                            }
                            ris += `T1  - ${value}\r\n`;
                            hasTitle = true;
                        }
                        break;

                    case "parsely-author":
                    case "author":
                    case "creator":
                        {
                            value = value.replace(", et al.", "");
                            for (var person of this.personNameParser.parse(value)) {
                                ris += `AU  - ${person}\r\n`;
                            }
                            hasAuthor = true;
                        }
                        break;

                    case "language":
                        {
                            value = value.replace(/\(.+?\)/, "");
                            ris += `LA  - ${value}\r\n`;
                        }
                        break;

                    case "article:publisher":
                    case "publisher":
                    case "DC.publisher":
                        {
                            if (value.indexOf("facebook.com/") == -1) {
                                ris += `IN  - ${value}\r\n`;
                            }
                        }
                        break;

                    case "article:tag":
                    case "subject":
                    case "keywords":
                    case "DC.keywords":
                    case "news_keywords":
                        {
                            for (var keyword of this.parseKeywords(value)) {
                                keyword = keyword.replace(/\[.+?\]/g, "");
                                ris += `KW  - ${keyword.trim()}\r\n`;
                            }
                        }
                        break;

                    case "dcterms:abstract":
                    case "dcterms.abstract":
                    case "description":
                        {
                            if (!info.hasAbstract) {
                                info.hasAbstract = true;
                                ris += `AB  - ${value}\r\n`;
                            }
                        }
                        break;

                    case "article:published_time":
                    case "dcterms:created":
                    case "dcterms.created":
                    case "date":
                        {
                            var date = this.parseDate(value);
                            if (date != null) {
                                ris += `PY  - ${date.getFullYear()}\r\n`;
                            }
                        }
                        break;

                    case "updated_time":
                    case "article:modified_time":
                        {
                            var date = dateToCitaviString(value);
                            if (date != null) {
                                ris += `Y2  - ${value}\r\n`;
                            }
                        }
                        break;

                    case "content":
                        {
                            ris += `N1  - ${value}\r\n`;
                        }
                        break;

                    case "copyright":
                        {
                            ris += `N1  - Copyright: ${value}\r\n`;
                        }
                        break;

                    case "contributor":
                        {
                            for (var person of this.personNameParser.parse(value)) {
                                ris += `A3  - ${person}\r\n`;
                            }
                        }
                        break;

                    case "site_name":
                        {
                            fallback_author = value;
                        }
                        break;

                    default:
                        break;
                }
            }
            finally {
                match = rgx.exec(page.html);
            }
        }

        if (!hasTitle) {
            var title = page.title.replace(/^\([\d+]+\)/g, "");
            ris += `T1  - ${title}\r\n`;
        }

        if (!hasAuthor && fallback_author !== "") {
            ris += `AU  - ${fallback_author}\r\n`;
        }

        try {
            var coverRgx = /<meta (property|name)="(og:image|twitter:image:src)".+?content="(.+?)"/gi;
            match = coverRgx.exec(page.html);
            if (match) {
                ris += `QX  - ${match[3]}\r\n`;
            }
        }
        catch (e) {
            telemetry.error(e);
        }

        telemetry.log(ris);

        return ris;
    }

    parsePubmed(records) {
        var references = [];
        for (var record of records) {
            var reference = new Reference(record, SimpleParser.PubMed_ID);
            var lines = this.parseTaggedRecord(record, /^....-\s/g);
            for (var line of lines) {
                var m = /^(.+?)-(.+)/g.exec(line)
                var fld = m[1].trim();
                var val = m[2].trim();
                switch (fld) {
                    case "AU":
                        reference.authors += val + ";";
                        break;

                    case "AID":
                        if (val.endsWith("[doi]")) {
                            reference.doi = val.replace("[doi]", "").trim();
                        }
                        if (val.endsWith("[pii]")) {
                            reference.pii = val.replace("[pii]", "").trim();
                            if (!reference.pii.startsWith("S")) {
                                reference.pii = "";
                            }
                        }
                        break;
                    case "PMC":
                        reference.pmcid = val;
                        break;
                    case "PMID":
                        reference.pmid = val;
                        break;
                    case "DoP":
                        reference.pdf = val;
                        break;
                    case "SO":
                        reference.source = val;
                        break;
                    case "TI":
                        reference.title = val;
                        break;
                    case "DP":
                        reference.year = val;
                        break;
                }
            }

            references.push(reference);
        }
        return references;
    }

    parseRIS(records) {
        var references = [];
        for (var r of records) {

            var record;
            try {
                record = he.decode(r);
            }
            catch (e) {
                //html.replace is not a function (21-08-2019: Verstehe nicht was da passiert -> Ignorieren
                continue;
            }
            var reference = new Reference(record, SimpleParser.RIS_ID);
            var lines = this.parseTaggedRecord(record, /^..\s\s-\s/g);

            for (var line of lines) {
                var m = /^(.+?)-(.+)/g.exec(line);
                var fld = m[1].trim();
                var val = m[2].trim();
                
                switch (fld) {
                    case "AU":
                    case "A1":
                        reference.authors += val + ";";
                        break;
                   
                    case "ED":
                        reference.editors += val + ";";
                        break;

                    case "AX":
                        reference.arxivId = val;
                        break;

                    case "AZ":
                        reference.asin = val;
                        break;

                    case "AN":
                        if (val.indexOf("PMC") == 0) {
                            reference.pmcid = val;
                        }
                        break;

                    case "PC":
                        reference.pmcid = val;
                        break;

                    case "PM":
                        reference.pmid = val;
                        break;

                    case "DA":
                        if (isNullOrEmpty(reference.year)) {
                            reference.year = val;
                        }
                        break;

                    case "DO":
                        if (val.indexOf("doi.org") != -1) {
                            val = val.replace(/^.+?org.\//, "");
                        }
                        reference.doi = val;
                        break;

                    case "N6": //Aktenzeichen (bsp. Juris)
                        reference.source = val;
                        break;

                    case "IN":
                        reference.organization = val;
                        break;

                    case "JF":
                        reference.journal = val;
                        break;

                    case "PB":
                        reference.publishers = val;
                        break;

                    case "KW":
                        reference.keywords = val;
                        break;

                    case "QW":
                        reference.htmlToPdfUrl = val;
                        break;

                    case "QX":
                        reference.cover = val;
                        break;

                    case "QZ":
                        reference.pdf = val;
                        break;

                    case "OA":
                        reference.oai = val;
                        break;

                    case "UR":
                        reference.url = val;
                        break;

                    case "Y1":
                    case "Y2":
                    case "PY":
                        if (isNullOrEmpty(reference.year)) {
                            reference.year = val;
                        }
                        break;

                    case "TI":
                    case "T1":
                    case "T2":
                        if (reference.title == "") {
                            reference.title = val;
                        }
                        break;
                }
            }

            references.push(reference);
        }
        return references;
    }

    parseXml(records) {
        var references = [];
        for (var record of records) {
            var parser = new DOMParser();
            var xml = "<References>";
            xml += record;
            xml += "</References>";
            xml = xml.replace(/\\r\\n/g, "\r\n");
            xml = xml.replace(/\\"/g, "\"");
            xml = xml.replace(/\\}/g, "\}");
            xml = xml.replace(/\\{/g, "\{");

            var xmlDoc = parser.parseFromString(xml, "text/xml");
            var r = xmlDoc.getElementsByTagName("Reference");

            for (var referenceNode of r) {

                if (referenceNode.parentNode.nodeName == "ParentReference") continue;

                var raw = (new XMLSerializer()).serializeToString(referenceNode);
                var reference = new Reference(raw, "xml");
                var author = "";
                for (var data of referenceNode.childNodes) {
                    switch (data.nodeName) {

                        case "ArxivId":
                            reference.arxivId = data.textContent;
                            break;

                        case "Authors":
                        case "Editors":
                            if (author != "") continue;
                            for (var personNode of data.childNodes) {
                                for (var personAttr of personNode.childNodes) {
                                    if (personAttr.nodeName == "LastName") {
                                        if (author != "") continue;
                                        author = personAttr.textContent;
                                    }
                                }
                            }
                            break;

                        case "Doi":
                            reference.doi = data.textContent;
                            break;

                        case "Isbn":
                            reference.isbn = data.textContent;
                            break;

                        case "Number":
                            if (reference.refenencetype === "Patent") {
                                reference.patentNumber = data.textContent;
                            }
                            break;

                        case "OnlineAddress":
                            if (data.textContent !== null &&
                                data.textContent.endsWith(".pdf")) {
                                reference.pdf = data.textContent;
                            }
                            break;

                        case "PubMedId":
                            reference.pmid = data.textContent;
                            break;

                        case "PmcId":
                            reference.pmcid = data.textContent;
                            break;

                        case "ReferenceTypeId":
                            reference.refenencetype = data.textContent;
                            break;

                        case "Title":
                            reference.title = data.textContent;
                            break;

                        case "Year":
                            reference.year = data.textContent;
                            break;

                        case "Volume":
                            reference.volume = data.textContent;
                            break;
                    }
                }
                reference.authors = author;
                references.push(reference);
            }
        }
        return references;
    }

    parseJson(records) {
        var references = [];

        for (var record of records) {
            if (isNullOrUndefined(record)) {
                telemetry.warn("parseJson: record is null");
                continue;
            }
            var reference = new Reference(record, "json");
            var json = JSON.parse(record);
            if (isNullOrUndefined(json)) {
                telemetry.warn("parseJson: json is null");
                continue;
            }
            reference.title = json.Title;
            reference.doi = json.Doi;
            reference.year = json.Year;
            reference.arxivId = json.ArxivId;
            reference.pmid = json.PubMedId;
            reference.pmcid = json.PmcId;
            reference.isbn = json.Isbn;
            reference.source = json.Source;
            if (!reference.source) {
                reference.source = json.SourceOfBibliographicInformation;
            }
            reference.pdf = json.Pdf;

            if (json.ReferenceTypeId === "Patent") {
                reference.patentNumber = json.Number;
            }

            if (json.Authors != null && json.Authors.length > 0) reference.authors = json.Authors[0].LastName;
            else if (json.Editors != null && json.Editors.length > 0) reference.authors = json.Editors[0].LastName;

            references.push(reference);
        }

        return references;
    }
}

class Reference {
    constructor(raw, importFormat) {
        this.authors = "";
        this.arxivId = "";
        this.asin = "";
        this.bibliography = [];
        this.bibliographyReferencesCount = 0;
        this.cover = "";
        this.doi = "";
        this.editors = "";
        this.eric_id = "";
        this.keywords = "";
        this.importFormat = importFormat;
        this.projectInfo = {}; //Wenn bereits in einem Projekt verhanden /exists:false / id:Id projectname: XYZ
        this.isbn = "";
        this.issn = "";
        this.journal = "";
        this.organization = "";
        this.patentNumber = "";
        this.publishers = "";
        this.placeOfPublication = "";
        this.pmid = "";
        this.pmcid = "";
        this.pii = "";
        this.pdf = "";
        this.upwChecked = false;
        this.raw = raw;
        this.source = "";
        this.title = "";
        this.volume = "";
        this.year = "";
        this.id = guid();
        this.completeTitledataAfterImport = false;
        this.htmlToPdfUrl = "";
        this.s2PaperId = "";//SemanticScolarId
        this.oai = "";
        this.url = "";
    }

    async validate() {
        try {
            var identifiers = [];
            if (!isNullOrEmpty(this.arxivId)) {
                identifiers.push({
                    type: ReferenceIdentifierType.Arxiv, value: this.arxivId.replace("arXiv:", "")
                });
            }
            if (!isNullOrEmpty(this.doi)) {
                if (this.doi.indexOf("https://doi.org/") == 0) {
                    this.doi = this.doi.replace("https://doi.org/", "");
                }
                identifiers.push({
                    type: ReferenceIdentifierType.Doi, value: this.doi
                });
            }
            if (!isNullOrEmpty(this.pmcid)) {
                identifiers.push({
                    type: ReferenceIdentifierType.PmcId, value: this.pmcid
                });
            }
            if (!isNullOrEmpty(this.pmid)) {
                identifiers.push({
                    type: ReferenceIdentifierType.PubMedId, value: this.pmid
                });
            }
            if (!isNullOrEmpty(this.isbn)) {
                identifiers.push({
                    type: ReferenceIdentifierType.Isbn, value: this.isbn
                });
            }

            if (identifiers.length == 0) return true;

            var result = await citaviPicker.identifiersExists(identifiers);
            if (result != null &&
                result.length) {
                for (var check of result) {
                    if (check.exists) {
                        this.projectInfo = check;
                        return false;
                    }
                }
            }
        }
        catch (e) {
            telemetry.error(e);
        }
        return true;
    }

    async lookupCover() {
        return coverLookup.lookup(this);
    }

    async lookupPdf() {
        return pdfLookup.lookup(this);
    }

    prettify() {

        if (!isNullOrEmpty(this.authors)) {
            this.authors = this.authors.replace(/;$/g, "");
            this.authors = this.authors.replace(";", "; ");
        }
        else if (!isNullOrEmpty(this.editors)) {
            this.authors = this.editors.replace(/;$/g, "");
            this.authors = this.authors.replace(";", "; ");
        }

        if (!isNullOrEmpty(this.title)) {
            this.title = this.title.replace(/\<\</g, "");
            this.title = this.title.replace(/\>\>/g, "");
            this.title = this.title.replace(/\.$/g, "");
        }

        if (!isNullOrEmpty(this.year)) {
            this.year = this.year.replace(/\[\]/g, "");
        }

        if (isNullOrEmpty(this.title)) {
            this.title = "[No Title]";
        }

        if (isNullOrEmpty(this.source)) {
            if (!isNullOrEmpty(this.authors)) {
                this.source = this.authors;
                if (!isNullOrEmpty(this.year)) this.source += " (" + this.year + ")";
            }
            else if (!isNullOrEmpty(this.journal)) {
                this.source = this.journal;
                if (!isNullOrEmpty(this.issn)) this.source += " (" + this.issn + ")";
            }
            else if (!isNullOrEmpty(this.publishers)) {
                this.source = this.publishers;
                if (!isNullOrEmpty(this.placeOfPublication)) {
                    this.source += ": " + this.placeOfPublication;
                }
                if (!isNullOrEmpty(this.year)) {
                    this.source += " (" + this.year + ")";
                }
                if (!isNullOrEmpty(this.volume)) {
                    this.source += " " + this.volume + " vol.";
                }
            }
            else if (!isNullOrEmpty(this.publishers)) {
                this.source = this.publishers;
                if (!isNullOrEmpty(this.year)) {
                    this.source += " (" + this.year + ")";
                }
                if (!isNullOrEmpty(this.volume)) {
                    this.source += " " + this.volume + " vol.";
                }
            }
            else if (!isNullOrEmpty(this.doi)) {
                this.source = this.doi;
            }
            else if (!isNullOrEmpty(this.pmid)) {
                this.source = "PMID: " + this.pmid;
            }
            else if (!isNullOrEmpty(this.pmcid)) {
                this.source = "PMCID: " + this.pmcid;
            }
            else if (!isNullOrEmpty(this.year)) {
                this.source = this.year;
            }
            else {
                this.source = "---";
            }
        }

        if (!isNullOrEmpty(this.doi)) {
            this.id = this.doi;
        }
        else if (!isNullOrEmpty(this.isbn)) {
            this.id = this.isbn;
        }
        else if (!isNullOrEmpty(this.pmcid)) {
            this.id = this.pmcid;
        }
        else if (!isNullOrEmpty(this.pmid)) {
            this.id = this.pmid;
        }
        else {
            this.id = this.title + this.year + this.authors + this.source;
        }
    }

    toString() {
        return this.title;
    }
}