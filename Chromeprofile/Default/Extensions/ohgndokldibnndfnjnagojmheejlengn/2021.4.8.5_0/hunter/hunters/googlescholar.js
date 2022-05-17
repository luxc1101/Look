var hunter = new function () {
    this.fileName = "googlescholar.js";
    this.name = "Google Scholar";
    this.id = "044F98A9-4E37-4b3f-99BF-93834347DD39";
    this.importFormat = "ris";
    this.priority = 10;
    this.requiredParsers = [
        "CitationMetaTagParser",
        "CrossRefParser",
        "EPrintsParser",
        "JStorParser"
    ];

    this.references = [];
    this.references_flds = {};

    this.analyse_complete = false;
    this.busy = false;

    this.identify = function () {

        if (document.URL.indexOf("scholar.google") == -1) return 0;
        var count = 0;
        for (var metaField of document.querySelectorAll('.gs_ri')) {
            if (!metaField.childNodes[0].classList.contains("gs_rt")) continue;
            count++;
        }
        if (count > 0) {
            window.hunter = this;
        }
        return count;
    };

    this.identifyUrl = function (url) {
        if (url.indexOf("scholar.google", 0) == -1) {
            return false;
        }
        return true;
    };

    this.fetch2 = function (url) {
        return new Promise(async resolve => {
            if (url.indexOf(".google.") != -1) {
                resolve("");
                return;
            }
            chrome.runtime.sendMessage({ action: MessageKeys.fetchText, value: url }, (source) => {
                if (source == "") {
                    console.error(url);
                }
                resolve(source);
            });
        });
    };

    this.scanAsync = async function () {
        if (this.references.length > 0) {
            return this.references;
        }

        try {
            var tasks = [];
            for (var fullField of document.querySelectorAll('.gs_r.gs_or.gs_scl')) {
                var metaField = fullField.querySelector('.gs_ri');

                var fetch = this.fetchReference(fullField, metaField);
                tasks.push(fetch);
            }
            var references = await Promise.all(tasks);
            for (var reference of references) {
                if (reference == null) {
                    continue;
                }
                var ris = this.referenceToRIS(reference);
                this.references.push(ris);
                
                this.references_flds[reference.Id] = ris;
            }
        }
        catch (e) {
            console.error(e);
        }
        
        return this.references;
    };

    this.analyse = async function () {
        try {

            if (this.analyse_complete) {
                return;
            }

            var style =
            {
                top: "2px",
                position: "relative"
            };

            var title = chrome.i18n.getMessage("ImportButton");
            for (var fullField of document.querySelectorAll('.gs_r.gs_or.gs_scl')) {
                var containers = fullField.querySelectorAll('.gs_fl');
                var container = containers.item(containers.length - 1);
                var identifier = {
                    value: fullField.getAttribute("data-cid"),
                    type: ReferenceIdentifierType.Hunter,
                    title: title
                };
                analyser.createPickerNode(container.children.item(container.children.length - 1), identifier, style, true);
            }
        }
        catch (e) {
            telemetry.error(e);
        }
        finally {
            this.analyse_complete = true;
        }
    };

    this.fetch3 = async function (identifier) {

        if (this.busy) {
            return;
        }

        try {
            this.busy = true;

            var msg = {
                action: MessageKeys.setImportProgress,
            };
            chrome.runtime.sendMessage(msg);

            var fullField = document.querySelector(`div[data-cid="${identifier.value}"]`);
            var metaField = fullField.querySelector('.gs_ri');
            var ris = this.references_flds[identifier.value];
            if (ris == undefined) {
                var reference = await this.fetchReference(fullField, metaField);
                ris = this.referenceToRIS(reference);
            }

            msg = {
                action: MessageKeys.hunterDirectImport,
                value: ris,
                importFormat: "ris"
            };
            chrome.runtime.sendMessage(msg);
        }
        catch (e) {
            console.error(e);
        }
        finally {
            this.busy = false;
        }
    };

    this.fetchReference = function (fullField, metaField) {
        return new Promise(async resolve => {
            var reference = {};

            try {
                var citationMetaTagParser = new CitationMetaTagParser();
                var crossRefParser = new CrossRefParser();
                var eprintsParser = new EPrintsParser();
                var jstorParser = new JStorParser();
                var parsers = [
                    citationMetaTagParser,
                    eprintsParser,
                    jstorParser
                ];

                reference.fld = fullField;
                reference.Authors = [];
                reference.Id = metaField.parentNode.getAttribute("data-cid");

                var title = metaField.childNodes[0].textContent;
                title = title.replace(/^(\[.+?\])*/g, "");
                title = title.replace(/^\s+/g, "");
                title = title.replace(/<.+?>/g, "");

                reference.Title = title;

                reference.Source = metaField.childNodes[1].textContent;

                var pdfField = fullField.querySelector('.gs_rt,.gs_or_ggsm');
                if (pdfField != null &&
                    pdfField.textContent.indexOf("[PDF]") != -1) {
                    var pdfLink = pdfField.querySelector("a");
                    if (pdfLink != null) {
                        reference.Pdf = pdfLink.href;
                    }
                }

                var titleSupplementField = fullField.querySelector('.gs_a');
                if (titleSupplementField != null) {
                    var ts = titleSupplementField.textContent;
                    if (/\d{4}/.test(ts)) {
                        reference.Year = /\d{4}/.exec(ts)[0];
                    }
                }

                var linkToPublisher = metaField.querySelector('a');
                if (linkToPublisher != null) {
                    reference.Url = linkToPublisher.href.toLocaleLowerCase();

                    if (/ncbi.nlm.nih.gov\/pmc\/\articles\/pmc(\d+)/.test(reference.Url)) {
                        var m = /ncbi.nlm.nih.gov\/pmc\/\articles\/pmc(\d+)/.exec(reference.Url);
                        var pmcRISUrl = `https://www.ncbi.nlm.nih.gov/pmc/utils/ctxp/?ids=PMC${m[1]}&report=ris&format=ris`;
                        var response = await fetch(pmcRISUrl);
                        reference.Raw = await response.text();
                        reference.Raw = reference.Raw.replace("ER  -", `PC  - PMC${m[1]}\r\nER  - `);
                        reference.checked = true;
                    }
                    else if (/books.google./.test(reference.Url)) {
                        reference.Url = linkToPublisher.href;
                        var googleBooksId = /id=(.+?)&/.exec(reference.Url)[1];
                        var googleBookApiUrl = "https://www.googleapis.com/books/v1/volumes/" + googleBooksId;

                        try {
                            var text = await this.fetch2(googleBookApiUrl);
                            var item = JSON.parse(text);

                            var ris = "";
                            ris += `TI  - ${item.volumeInfo.title}\r\n`;
                            if (item.volumeInfo.publishedDate) {
                                ris += `PY  - ${item.volumeInfo.publishedDate}\r\n`;
                            }
                            if (item.volumeInfo.subtitle) {
                                ris += `TI  - ${item.volumeInfo.subtitle}\r\n`;
                            }
                            if (item.volumeInfo.description) {
                                ris += `AB  - ${item.volumeInfo.description}\r\n`;
                            }
                            if (item.volumeInfo.publisher) {
                                ris += `PB  - ${item.volumeInfo.publisher}\r\n`;
                            }
                            if (item.volumeInfo.industryIdentifiers) {
                                for (var id of item.volumeInfo.industryIdentifiers) {
                                    if (id.type == "ISBN_13") {
                                        ris += `SN  - ${id.identifier}\r\n`;
                                    }
                                }
                            }
                            if (item.volumeInfo.authors) {
                                for (var author of item.volumeInfo.authors) {
                                    if (author.indexOf(",") == -1) {
                                        var personNameArray = author.split(' ');
                                        personName = personNameArray[personNameArray.length - 1] + ", ";
                                        for (var j = 0; j < personNameArray.length - 1; j++) {
                                            personName += personNameArray[j] + " ";
                                        }
                                        ris += `AU  - ${personName}\r\n`;
                                    }
                                    else {
                                        ris += `AU  - ${author}\r\n`;
                                    }
                                }
                            }
                            if (item.volumeInfo.language) {
                                ris += `LA  - ${item.volumeInfo.language}\r\n`;
                            }
                            if (item.volumeInfo.pageCount) {
                                ris += `PG  - ${item.volumeInfo.pageCount}\r\n`;
                            }
                            if (item.volumeInfo.imageLinks &&
                                item.volumeInfo.imageLinks.medium) {
                                ris += `QX  - ${item.volumeInfo.imageLinks.medium}\r\n`;

                            }
                            if (item.pdf &&
                                item.pdf.downloadLink) {
                                ris += `QZ  - ${item.pdf.downloadLink}\r\n`;
                            }
                            ris += "TS  - Google Books";
                            reference.Raw = ris;
                            reference.checked = true;
                        }
                        catch (e) {
                            console.error("failed: " + googleBookApiUrl, e);
                        }
                    }
                    else if (reference.Url.indexOf(".pdf") != -1 &&
                        reference.Url.indexOf("www.researchgate.net") != -1 &&
                        reference.Url.indexOf("/links/") != -1) {
                        var url = reference.Url.substring(0, reference.Url.indexOf("/links/"));
                        var html = await this.fetch2(url);
                        if (html !== "") {
                            var raw = await citationMetaTagParser.parse(html, url);
                            if (citationMetaTagParser.Success) {
                                reference.Raw = raw;
                            }
                            else {
                                reference.Pdf = reference.Url;
                            }
                            reference.checked = true;
                        }
                        else {
                            reference.Pdf = reference.Url;
                        }
                    }
                    else if (reference.Url == "javascript:void(0)") {
                        reference.Url = "";
                    }
                    else if (reference.Url.indexOf("https://www.academia.edu/download/") !== -1) {
                        //#3441
                        //Nur als PDF-Download-URL verwenden
                        reference.Url = "";
                        reference.Pdf = reference.Url;
                    }
                    else if (reference.Url.indexOf(".pdf") === -1 &&
                            metaField.textContent.indexOf("[PDF]") === -1) {
                        try {
                            var html = await this.fetch2(reference.Url);
                            var raw = "";
                            for (var parser of parsers) {
                                if (parser == jstorParser) {
                                    raw = await parser.parse(reference.Url, true);
                                }
                                else {
                                    raw = await parser.parse(html, reference.Url);

                                }
                                if (parser.Success) {
                                    reference.checked = true;
                                    break;
                                }
                            }
                            if (!reference.checked) {
                                for (var parser of parsers) {
                                    if (parser.DOI != null &&
                                        parser.DOI != "") {
                                        reference.DOI = parser.DOI;
                                        break;
                                    }
                                }
                            }
                            if (reference.checked) {
                                reference.Raw = raw;
                            }
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                }
                if (!reference.checked) {
                    var crQuery = reference.Title + " " + reference.Source;
                    crQuery = crQuery.replace("&", "");
                    try {
                        var crossRefUrl = "";
                        if (reference.DOI != undefined) {
                            crQuery = reference.DOI;
                            crossRefUrl = "https://api.crossref.org/works/" + reference.DOI + "?mailto=support@citavi.com";
                        }
                        else {
                            crossRefUrl = "https://api.crossref.org/works?rows=1&query=" + crQuery + "&mailto=support@citavi.com";
                        }
                        var response = await fetch(crossRefUrl);
                        if (response.ok) {
                            var json = await response.json();
                            var item;
                            if (json.message.items) {
                                if (json.message.items.length == 1) {
                                    item = json.message.items[0];
                                }
                            }
                            else if (json.message.DOI) {
                                item = json.message;
                            }
                            if (item) {
                                var m1 = item.title[0].replace(/[^a-z0-9]/gi, "").toLowerCase();
                                var m2 = reference.Title.replace(/[^a-z0-9]/gi, "").toLowerCase();
                                var ok = m1 == m2 || reference.DOI != undefined;
                                if (ok) {
                                    reference.completeTitledataAfterImport = true;
                                    reference.checked = true;
                                    reference.Raw = crossRefParser.parse(json);
                                    
                                }
                                else {
                                    //console.log('%cCrossR:' + item.title[0], 'color: blue');
                                    //console.log('%cGoogle:' + reference.Title, 'color: red');
                                    //console.table(json);
                                    //console.log('%c===========================', 'color: gray');
                                }
                            }
                        }
                    }
                    catch (e) {
                        console.error(e);
                    }
                }

                if (reference.Pdf != undefined && reference.Raw !== undefined) {
                    reference.Raw = reference.Raw.replace(/QZ  -.+?\r\n/g, "");
                    reference.Raw += "\r\nQZ  - " + reference.Pdf;
                }
            }
            catch (e) {
                console.error(e);
            }
            resolve(reference);
        });
    };

    this.referenceToRIS = function (reference) {
        if (reference.Raw) {
            return reference.Raw;
        }
        var ris = "";
        if (reference.Id) ris += `ID  - ${reference.Id}\r\n`;
        if (reference.Title) ris += `TI  - ${reference.Title}\r\n`;
        if (reference.ReferenceType) ris += `TY  - ${reference.ReferenceType}\r\n`;
        if (reference.Pdf) ris += `QZ  - ${reference.Pdf}\r\n`;
        if (reference.Year) ris += `Y1  - ${reference.Year}\r\n`;
        if (reference.Doi) ris += `DO  - ${reference.Doi}\r\n`;
        if (reference.Isbn) ris += `IB  - ${reference.Isbn}\r\n`;
        if (reference.Url) ris += `UR  - ${reference.Url}\r\n`;
        for (var author of reference.Authors) {
            ris += `AU  - ${author.Name}\r\n`;
        }

        return ris;
    };
};

if (typeof hunters !== 'undefined') {
    hunters.add(hunter);
}