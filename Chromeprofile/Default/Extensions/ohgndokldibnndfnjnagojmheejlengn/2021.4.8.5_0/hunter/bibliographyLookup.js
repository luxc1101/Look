//https://www.ncbi.nlm.nih.gov/pubmed/31463009

class BibliographyLookup {
    constructor() {
        this.crossRefUrl = "https://api.crossref.org/v1/works/";
        this.semanticscholarUrl = "http://api.semanticscholar.org/v1/paper/";
        this.cache = {};
        this.cache_ieee = {};
        
        this.parser = new SimpleParser();
    }

    async getBibliographyReferencesCount(reference) {
        try {

            if (!settings.lookupBibliography) {
                reference.bibliographyReferencesCount = 0;
                return;
            }

            if (isNullOrEmpty(reference.doi)) {
                reference.bibliographyReferencesCount = 0;
                return;
            }

            if (this.cache[reference.doi] !== undefined) {
                reference.bibliographyReferencesCount = this.cache[reference.doi].length;
                return;
            }

            if (this.cache_ieee[reference.doi] !== undefined) {
                reference.bibliographyReferencesCount = this.cache_ieee[reference.doi].length;
                return;
            }

            var url = this.crossRefUrl + reference.doi + "?mailto=support@citavi.com";
            var response = await fetch(url);
            if (!response.ok) {
                //404 wenn DOI nicht vorhanden
                reference.bibliographyReferencesCount = 0;
                return;
            }
            var result = await response.json();
            if (isNullOrEmpty(result)) {
                telemetry.error(response.statusText, { crUrl: url });
                reference.bibliographyReferencesCount = 0;
                return;
            }
            if (isNullOrUndefined(result.message.reference)) {

                if (result.message.member === "78") {
                    var references = await this.lookupScienceDirect(reference.doi);
                    reference.bibliographyReferencesCount = references.length;
                }
                else if (result.message.member === "38") {
                    var references = await this.lookupScienceDirect(reference.doi);
                    reference.bibliographyReferencesCount = references.length;
                }

                if (reference.bibliographyReferencesCount === 0) {
                    var references = await this.lookupSemanticScholar(reference.doi);
                    reference.bibliographyReferencesCount = references.length;
                }

                if (reference.bibliographyReferencesCount === 0) {
                    telemetry.log("bibliography not found: " + reference.doi + " (" + result.message.publisher + ")");
                }
                else {
                    telemetry.log("bibliography found: " + reference.bibliographyReferencesCount + " references");
                }
            }
            else {
                var count = 0;
                for (var cited of result.message.reference) {
                    if (cited.DOI === undefined) {
                        if (this.parseUnstructedCrossRefReferences(cited) !== null) {
                            count++;
                        }
                    }
                    else {
                        count++;
                    }
                }

                reference.bibliographyReferencesCount = count;
                telemetry.log("bibliography found: " + count + " (" + result.message.reference.length + ") references");
            }
        }
        catch (e) {
            reference.bibliographyReferencesCount = 0;
            telemetry.error(e);
        }
    }

    async lookup(reference, tab) {
        if (!settings.lookupBibliography) {
            return;
        }
        if (isNullOrEmpty(reference.doi)) {
            return;
        }
        var cancelRequested = false;
        var onMessageListener = null;
        try {

            onMessageListener = chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
                if (data.jobId === MessageKeys.lookupBibliography + reference.id) {
                    telemetry.log("cancel lookup bibliography");
                    cancelRequested = true;
                }
            });

            if (this.cache[reference.doi] !== undefined) {
                for (var bib_reference of this.cache[reference.doi]) {
                    reference.bibliography.push(bib_reference);
                }
                return true;
            }

            telemetry.log("lookup bibliography for: " + reference.doi);

            var progress = "";
            var index = 0;
            this.cache[reference.doi] = [];
            var references = [];
            var count = 0;

            var response = await fetch(this.crossRefUrl + reference.doi + "?mailto=support@citavi.com");
            var result = await response.json();
            if (!response.ok || isNullOrEmpty(result)) {
                telemetry.error(response.statusText, { crUrl: url });
                reference.bibliographyReferencesCount = 0;
                return;
            }
            if (isNullOrUndefined(result.message.reference)) {

                if (tab) {
                    progress = chrome.i18n.getMessage("BibliographyReferencesProgressText");
                    panel.sendProgress(tab, { type: ProgressType.bibliographyReferencesImport, text: progress, text2: "" });
                }

                if (result.message.member === "263") {
                    if (this.cache_ieee[reference.doi] !== undefined) {
                        count = this.cache_ieee[reference.doi].length;
                        for (var ieee_ref of this.cache_ieee[reference.doi]) {
                            index++;
                            if (cancelRequested) {
                                delete this.cache[reference.doi];
                                return false;
                            }
                            var bib_reference = null;
                            if (ieee_ref.links !== undefined && ieee_ref.links.crossRefLink !== undefined) {
                                var doi = ieee_ref.links.crossRefLink.replace("https://doi.org/", "");

                                if (tab) {
                                    progress = chrome.i18n.getMessage("BibliographyReferencesProgressText") + ` (${index}/${count})`;
                                    panel.sendProgress(tab, { type: ProgressType.bibliographyReferencesImport, text: progress, text2: doi });
                                }

                                var ref = await referenceLookup.lookup({
                                    doi: doi
                                });

                                if (ref === null) {
                                    continue;
                                }

                                bib_reference = ref;
                            }
                            else if (ieee_ref.title) {
                                var ris = "TY  - JOUR\r\n";
                                if (ieee_ref.title) {
                                    ris += "TI  - " + ieee_ref.title + "\r\n";
                                }
                                var year = /,\s(\d+\d+\d+\d+)\./.exec(ieee_ref.text);
                                if (year != null && year.length === 2) {
                                    ris += "PY  - " + year[1] + "\r\n";
                                }
                                var vol = /vol\.\s(\d+)/.exec(ieee_ref.text);
                                if (vol != null && vol.length === 2) {
                                    ris += "VL  - " + vol[1] + "\r\n";
                                }
                                var pp = /pp\.(\d+-\d+)/.exec(ieee_ref.text);
                                if (pp != null && pp.length === 2) {
                                    ris += "SP  - " + pp[1] + "\r\n";
                                }
                                ris += "N1  - " + ieee_ref.text.replace(/<.+?>/g, "");
                                bib_reference = this.parser.parseRIS([ris])[0];
                            }

                            if (bib_reference !== null) {
                                bib_reference.prettify();
                                references.push(bib_reference);
                                reference.bibliography.push(bib_reference);
                            }
                        }

                        this.cache[reference.doi] = references;
                        return true;
                    }
                }
                else if (result.message.member === "78") {
                    var pii = "";
                    var external_links = {};

                    for (var link of result.message.link) {
                        if (/PII:(S.+?)\?/.test(link.URL)) {
                            pii = /PII:(S.+?)\?/.exec(link.URL)[1];
                        }
                    }
                    if (pii != "") {
                        try {
                            var r = await fetch("https://www.sciencedirect.com/sdfe/arp/pii/" + pii + "/references/external-links/148");
                            if (r.ok) {
                                var external_links_response = await r.json();
                                for (var external_links_response_item of external_links_response) {
                                    external_links[external_links_response_item.refId] = external_links_response_item;
                                }
                            }
                        }
                        catch (e) {
                            telemetry.error("failed to fetch external links from science direct");
                            telemetry.error(e);
                        }
                    }

                    var sd_references = await this.lookupScienceDirect(reference.doi);

                    for (var sd_reference of sd_references) {
                        index++;

                        if (cancelRequested) {
                            delete this.cache[reference.doi];
                            return false;
                        }

                        if (isNullOrEmpty(sd_reference.doi) && external_links[index] !== undefined) {
                            sd_reference.doi = external_links[index].crossRefDoi;
                        }
                        if (!isNullOrEmpty(sd_reference.doi)) {
                            if (tab) {
                                progress = chrome.i18n.getMessage("BibliographyReferencesProgressText") + ` (${index}/${sd_references.length})`;
                                panel.sendProgress(tab, { type: ProgressType.bibliographyReferencesImport, text: progress, text2: sd_reference.doi });
                            }
                            var ref = await referenceLookup.lookup(sd_reference);
                            if (ref !== null) {
                                ref.prettify();
                                reference.bibliography.push(ref);
                                continue;
                            }
                        }
                        else if (!isNullOrEmpty(sd_reference.arxivId)) {
                            var ref = await referenceLookup.lookup(sd_reference);
                            if (ref !== null) {
                                ref.prettify();
                                reference.bibliography.push(ref);
                                continue;
                            }
                        }
                        else if (sd_reference.sciencedirect_bad) {
                            var ref = await referenceLookup.fuzzy(sd_reference.title);
                            if (ref !== null) {
                                ref.prettify();
                                reference.bibliography.push(ref);
                                continue;
                            }
                        }

                        reference.bibliography.push(sd_reference);

                        if (cancelRequested) {
                            return false;
                        }

                    }
                    this.cache[reference.doi] = reference.bibliography;
                    return true;
                }
                else {
                    var ss_bibReferences = await this.lookupSemanticScholar(reference.doi);
                    count = ss_bibReferences.length;
                    
                    for (var cited of ss_bibReferences) {

                        index++;
                        if (cancelRequested) {
                            delete this.cache[reference.doi];
                            return false;
                        }

                        if (cited.doi) {
                            if (tab) {
                                progress = chrome.i18n.getMessage("BibliographyReferencesProgressText") + ` (${index}/${count})`;
                                panel.sendProgress(tab, { type: ProgressType.bibliographyReferencesImport, text: progress, text2: cited.doi });
                            }

                            var ref = await referenceLookup.lookup({
                                doi: cited.doi
                            });

                            if (ref === null) {
                                continue;
                            }

                            bib_reference = ref;
                            bib_reference.prettify();
                            references.push(bib_reference);
                            reference.bibliography.push(bib_reference);
                        }
                        else {
                            references.push(cited);
                            reference.bibliography.push(cited);
                        }
                    }

                    if (reference.bibliography.length > 0) {
                        this.cache[reference.doi] = reference.bibliography;
                        return true;
                    }
                    telemetry.log("no bibliography found");
                    return false;
                }
            }
            else {
                for (var cited of result.message.reference) {
                    if (cited.DOI === undefined) {
                        if (this.parseUnstructedCrossRefReferences(cited) !== null) {
                            count++;
                        }
                    }
                    else {
                        count++;
                    }
                }

                telemetry.log("bibliography found: " + count + " references");
                telemetry.log(result.message.reference);

                for (var cited of result.message.reference) {

                    if (cancelRequested) {
                        delete this.cache[reference.doi];
                        return false;
                    }
                    
                    var bib_reference;
                    if (cited.DOI === undefined) {

                        bib_reference = this.parseUnstructedCrossRefReferences(cited);
                        if (bib_reference === null) continue;

                        references.push(bib_reference);
                        reference.bibliography.push(bib_reference);
                        continue;
                    }

                    index++;
                    if (tab) {
                        progress = chrome.i18n.getMessage("BibliographyReferencesProgressText") + ` (${index}/${count})`;
                        panel.sendProgress(tab, { type: ProgressType.bibliographyReferencesImport, text: progress, text2: cited.DOI });
                    }

                    var ref = await referenceLookup.lookup({
                        doi: cited.DOI
                    });

                    if (ref === null) {
                        continue;
                    }

                    bib_reference = ref;
                    bib_reference.prettify();
                    references.push(bib_reference);
                    reference.bibliography.push(bib_reference);
                }

                this.cache[reference.doi] = references;

                return true;
            }
        }
        catch (e) {
            telemetry.error(e);
        }
        finally {
            if (onMessageListener !== null) {
                try {
                    chrome.runtime.onMessage.removeListener(onMessageListener);
                }
                catch (e) {
                    //ignore
                    //Invalid listener for runtime.onMessage.
                }
            }
        }
        return false;
    }

    async lookupPubmed(pubmedId) {
        var references = [];
        try {
            //Nicht gut - sind nur Pubmed-Titel enthalten:
            //https://www.ncbi.nlm.nih.gov/pubmed/28013377
            var response = await fetch("http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=PUBMED&retmode=file&rettype=XML&id=" + pubmedId);
            var xml = new DOMParser().parseFromString(await response.text(), "text/xml");
            var bibliography = xml.querySelector("ReferenceList");
            for (var pubmed_reference of bibliography) {
                var reference = new Reference("", SimpleParser.PubMed_ID);
                var pmid = pubmed_reference.querySelector("ArticleId [IdType='pubmed']");
                reference.pmid = pmid;
                references.push(pmid);
            }
        }
        catch (e) {
            telemetry.error(e);
        }
        return references;
    }

    async lookupScienceDirect(doi) {
        var references = [];
        try {
            var response = await fetch("https://api.elsevier.com/content/article/doi/" + doi);
            var xml = new DOMParser().parseFromString(await response.text(), "text/xml");
            var bibliography = xml.querySelector("bibliography");
            var parser = new SimpleParser();
            if (bibliography !== null) {
                for (var sd_bib_reference of bibliography.querySelectorAll("bib-reference")) {

                    var badContent = false;
                    var hasIdentifier = false;
                    var ris = "";
                    var bib_reference = sd_bib_reference.querySelector("reference");
                    var links = sd_bib_reference.getElementsByTagName("ce:inter-ref");

                    for (var link of links) {
                        if (link.textContent.indexOf("arXiv:") !== -1) {
                            ris += "AX  - " + link.textContent.replace("arXiv:", "") + "\r\n";
                            hasIdentifier = true;
                        }
                        else if (link.textContent.indexOf("doi.org") !== -1) {
                            ris += "DO  - " + link.textContent.substr(link.textContent.indexOf("10.")) + "\r\n";
                            hasIdentifier = true;
                        }
                        else {
                            ris += "L2  - " + link.textContent + "\r\n";
                        }
                    }

                    
                    if (bib_reference === null) {
                        var otherText = sd_bib_reference.querySelector("textref");
                        if (otherText === null) {
                            otherText = sd_bib_reference.querySelector("source-text");
                            if (otherText === null) {
                                telemetry.warn(sd_bib_reference);
                                continue;
                            }
                        }
                        ris += "TY  - GEN\r\n";
                        ris += "TI  - " + otherText.textContent + "\r\n";
                        badContent = true;
                    }
                    else {
                        var title = bib_reference.querySelector("contribution>title>maintitle");
                        var hasTitle = false;
                        if (title != null) {
                            ris += "TI  - " + title.textContent + "\r\n";
                            hasTitle = true;
                        }

                        var authors = bib_reference.querySelectorAll("contribution>authors>author");
                        for (var author of authors) {
                            var givenName = author.querySelector("given-name");
                            var surname = author.querySelector("surname");

                            var fullname = "";
                            if (surname !== null) {
                                fullname = surname.textContent;
                            }
                            if (givenName !== null) {
                                fullname += ", " + givenName.textContent;
                            }
                            ris += "AU  - " + fullname + "\r\n";
                        }

                        var host = bib_reference.querySelector("host");
                        if (host !== null) {
                            var book = host.querySelector("book");
                            var edited_book = host.querySelector("edited-book");
                            var journal = host.querySelector("issue");
                            var ehost = host.querySelector("e-host");
                            if (book !== null) {
                                
                                var date = book.querySelector("date");
                                if (date !== null) {
                                    ris += "PY  - " + date.textContent + "\r\n";
                                }

                                var edition = book.querySelector("edition");
                                if (edition !== null) {
                                    ris += "ET  - " + edition.textContent + "\r\n";
                                }

                                var publisher = book.querySelector("publisher");
                                if (publisher !== null) {
                                    var pub_name = publisher.querySelector("name");
                                    if (pub_name != null) {
                                        ris += "PB  - " + pub_name.textContent + "\r\n";
                                    }

                                    var pub_location = publisher.querySelector("location");
                                    if (pub_location != null) {
                                        ris += "CY  - " + pub_location.textContent + "\r\n";
                                    }
                                }

                                var first_page = host.querySelector("pages>first-page");
                                if (first_page !== null) {
                                    ris += "SP  - " + first_page.textContent + "\r\n";
                                    ris += "TY  - CHAPTER\r\n";
                                }
                                else {
                                    ris += "TY  - BOOK\r\n";
                                }
                                var end_page = host.querySelector("pages>last-page");
                                if (end_page !== null) {
                                    ris += "EP  - " + end_page.textContent + "\r\n";
                                }
                            }
                            else if (journal !== null) {
                                ris += "TY  - JOUR\r\n";
                                var journalName = journal.querySelector("series>title>maintitle");
                                if (journalName !== null) {
                                    if (!hasTitle) {
                                        ris += "TI  - " + journalName.textContent + "\r\n";
                                    }
                                    else {
                                        ris += "JF  - " + journalName.textContent + "\r\n";
                                    }
                                }
                                var volume = journal.querySelector("series>volume-nr");
                                if (volume !== null) {
                                    ris += "VL  - " + volume.textContent + "\r\n";
                                }
                                var issue = journal.querySelector("issue-nr");
                                if (issue !== null) {
                                    ris += "IS  - " + issue.textContent + "\r\n";
                                }
                                var date = journal.querySelector("date");
                                if (date !== null) {
                                    ris += "PY  - " + date.textContent + "\r\n";
                                }

                                var first_page = host.querySelector("pages>first-page");
                                if (first_page !== null) {
                                    ris += "SP  - " + first_page.textContent + "\r\n";
                                }
                                var end_page = host.querySelector("pages>last-page");
                                if (end_page !== null) {
                                    ris += "EP  - " + end_page.textContent + "\r\n";
                                }
                                
                            }
                            else if (edited_book !== null) {
                                ris += "TY  - CHAPTER\r\n";

                                var editors = edited_book.querySelectorAll("editors>editor");
                                for (var editor of editors) {
                                    var givenName = editor.querySelector("given-name");
                                    var surname = editor.querySelector("surname");

                                    var fullname = "";
                                    if (surname !== null) {
                                        fullname = surname.textContent;
                                    }
                                    if (givenName !== null) {
                                        fullname += ", " + givenName.textContent;
                                    }
                                    ris += "ED  - " + fullname + "\r\n";
                                }

                                var parent_title = edited_book.querySelector("book-series>series>title>maintitle");
                                if (parent_title !== null) {
                                    ris += "T2  - " + parent_title.textContent + "\r\n";
                                }
                                else {
                                    parent_title = edited_book.querySelector("title>maintitle");
                                    if (parent_title !== null) {
                                        ris += "T2  - " + parent_title.textContent + "\r\n";
                                    }
                                }

                                var volume = edited_book.querySelector("book-series>series>volume-nr");
                                if (volume !== null) {
                                    ris += "VL  - " + volume.textContent + "\r\n";
                                }

                                var date = edited_book.querySelector("date");
                                if (date !== null) {
                                    ris += "PY  - " + date.textContent + "\r\n";
                                }

                                var publisher = edited_book.querySelector("publisher");
                                if (publisher !== null) {
                                    var pub_name = publisher.querySelector("name");
                                    if (pub_name != null) {
                                        ris += "PB  - " + pub_name.textContent + "\r\n";
                                    }

                                    var pub_location = publisher.querySelector("location");
                                    if (pub_location != null) {
                                        ris += "CY  - " + pub_location.textContent + "\r\n";
                                    }
                                }

                                var first_page = host.querySelector("pages>first-page");
                                if (first_page !== null) {
                                    ris += "SP  - " + first_page.textContent + "\r\n";
                                }
                                var end_page = host.querySelector("pages>last-page");
                                if (end_page !== null) {
                                    ris += "EP  - " + end_page.textContent + "\r\n";
                                }
                            }
                            else if (ehost !== null) {
                                ris += "TY  - WEB\r\n";
                                var url = ehost.querySelector("inter-ref");
                                if (url !== null) {
                                    ris += "UR  - " + url.textContent;
                                }
                            }
                            else {
                                telemetry.warn(host);
                            }

                            var source = bib_reference.querySelector("source-text");
                            if (source !== null) {
                                var source_text = source.textContent;
                                if (/\[online\] Available: (https:\/\/.+?),/.test(source_text)) {
                                    ris += "UR  - " + /[online] Available: (https:\/\/.+?),/.exec(source_text)[1] + "\r\n";
                                }
                            }

                            var doi = bib_reference.getElementsByTagName("ce:doi");
                            if (doi !== null && doi.length > 0) {
                                ris += "DO  - " + doi[0].textContent + "\r\n";
                            }
                        }
                    }
                    var reference = parser.parseRIS([ris])[0];
                    reference.prettify();
                    if (badContent && !hasIdentifier) {
                        reference.sciencedirect_bad = true;
                    }
                    references.push(reference);
                }
            }
        }
        catch (e) {
            telemetry.error(e);
        }
        return references;
    }

    async lookupSemanticScholar(doi) {
        //https://www.ncbi.nlm.nih.gov/pubmed/20215981
        var references = [];
        try {
            var response = await fetch(this.semanticscholarUrl + doi + "?include_unknown_references=true");
            if (!response.ok) {
                return references;
            }
            var json = await response.json();
            for (var cited of json.references) {
                var doc_type = "TY  - JOUR";
                var ris = "";

                if (cited.AX) {
                    ris += "\r\nAX   - " + cited.AX;
                }
                if (cited.title) {
                    ris += "\r\nTI  - " + cited.title;
                }
                if (cited.url) {
                    ris += "\r\nUR  - " + cited.url;
                }
                if (cited.venue) {
                    ris += "\r\nJF  - " + cited.venue;
                }
                if (cited.doi) {
                    ris += "\r\nDO  - " + cited.doi;
                }
                if (cited.year) {
                    ris += "\r\nPY  - " + cited.year;
                }
                for (var au of cited.authors) {
                    ris += "\r\nAU  - " + au.name;
                }
                if (ris === "") {
                    continue;
                }
                ris += "\r\n" + doc_type;
                var bib_reference = this.parser.parseRIS([ris])[0];

                if (cited.paperId) {
                    bib_reference.s2PaperId = cited.paperId;
                }

                bib_reference.prettify();
                references.push(bib_reference);
            }
        }
        catch (e) {
            telemetry.error(e);
        }
        return references;
    }

    parseUnstructedCrossRefReferences(cited) {
        var doc_type = "";
        var ris = "";

        if (cited.author) {
            ris += "\r\nAU  - " + cited.author;
        }
        if (cited.volume) {
            ris += "\r\nVL  - " + cited.volume;
        }
        if (cited.issue) {
            ris += "\r\nIS  - " + cited.issue;
        }
        if (cited["journal-title"]) {
            ris += "\r\nJF  - " + cited["journal-title"];
            doc_type = "TY  - JOUR\r\n";
        }
        if (cited["volume-title"]) {
            ris += "\r\nTI  - " + cited["volume-title"];
        }
        if (cited["article-title"]) {
            ris += "\r\nTI  - " + cited["article-title"];
            doc_type = "TY  - JOUR\r\n";
        }
        if (cited["first-page"]) {
            ris += "\r\nSP  - " + cited["first-page"];
        }
        if (cited.year) {
            ris += "\r\nPY  - " + cited.year;
        }
        else if (cited.unstructured) {
            var year = /(\d\d\d\d)/.exec(cited.unstructured);
            if (year != null) {
                ris += "\r\nPY  - " + year[0];
            }
        }
        if (!isNullOrUndefined(cited.unstructured)) {
            cited.unstructured = cited.unstructured.replace(/<.+?>/g, " ");
            cited.unstructured = cited.unstructured.replace(/\s+/g, " ");

            if (/http.+?(\s|$)/.test(cited.unstructured)) {

                var url = /http.+?(\s|$|<|\")/.exec(cited.unstructured)[0];
                if (doc_type === "") {
                    doc_type = "TY  - WEB\r\n"
                }
                ris += "\r\nUR  - " + url;
                ris += "\r\nTI  - " + url;
                ris += "\r\nNO  - " + cited.unstructured;
            }
            else if (cited.unstructured.trim().length > 0) {
                if (doc_type === "") {
                    doc_type = "TY  - GEN\r\n"
                }
                ris += "\r\nTI  - " + cited.unstructured;
            }
        }

        if (ris === "") {
            return null;
        }
        ris += "\r\n" + doc_type;
        var bib_reference = this.parser.parseRIS([ris])[0];
        bib_reference.prettify();
        return bib_reference;
    }
}

