let _pdfLookupCache = {
    dois: {},
    pmcids: {},
    websites:{ }
};

class PdfLookup {

    constructor() {
        this._proxy = null;
    }

    get proxy() {
        return this._proxy;
    }
    set proxy(val) {
        this._proxy = val;
    }

    async getPdfLinkFromWebsite(url, html) {
        try {
            if (_pdfLookupCache[url] !== undefined) {
                return _pdfLookupCache[url];
            }
            
            if (isNullOrUndefined(html)) {
                var response = await fetch2(url);
                if (response.ok) {
                    var contentType = response.headers.get("content-type");
                    if (contentType.indexOf("application/pdf") !== -1) {
                        _pdfLookupCache[url] = url;
                        return url;
                    }
                    html = await response.text();
                }
            }
            var parsers = [
                new CitationMetaTagParser(),
                new EPrintsParser()
            ];
            for (var parser of parsers) {
                await parser.parse(html, url, true);
                if (parser.Success && !isNullOrEmpty(parser.PDFUrl)) {
                    _pdfLookupCache[url] = parser.PDFUrl;
                    return parser.PDFUrl;
                }
            }
            if (url.indexOf("ieeexplore.ieee.org") !== -1) {
                //IEEE zeigt das PDF in einem IFrame an
                var pattern = /iframe src="(https:\/\/ieeexplore.ieee.org\/.+?.pdf.+?)\" frameborder/;
                if (pattern.test(html)) {
                    var pdfFromIEEE = pattern.exec(html)[1];
                    _pdfLookupCache[url] = pdfFromIEEE;
                    return pdfFromIEEE;
                }
            }
            if (/\/doi\/pdfdirect\/10.+?download=true/.test(html)) {
                var pdfUrl = /\/doi\/pdfdirect\/10.+?download=true/.exec(html)[0];
                var hostname = (new URL(url)).hostname;
                _pdfLookupCache[url] = "https://" + hostname + pdfUrl;
                return _pdfLookupCache[url];
            }
            _pdfLookupCache[url] = null;
        }
        catch (e) {
            telemetry.error(e);
        }
        return null;
    }

    async getDoi(reference) {
        try {
            if (reference.pii != "") {
                var url = `https://api.elsevier.com/content/article/PII:${reference.pii}?httpAccept=application/json`;
                var response = await fetch(url);
                if (!response.ok) return;

                var result = JSON.parse(await response.text());
                return result[0].core["prism:doi"];
            }
        }
        catch (e) {
            telemetry.error(e);
        }
        return null;
    }

    async lookupCrossRef(reference) {
        var url = `http://api.crossref.org/works/${reference.doi}`;
        var response = await fetch(url);
        if (!response.ok) {
            telemetry.warn(`Response not ok: ${url}`, "CrossRef");
            return false;
        }
        var result = JSON.parse(await response.text());
        if (result["message"] == null) return false;
        var msg = result["message"];
        if (msg["link"] == null) return false;
        var pdfUrlFromCrossRef = "";
        try {
            for (var link of msg["link"]) {
                if (link["intended-application"] == "text-mining") {
                    var pdfUrl = link.URL;
                    if (pdfUrl.indexOf("api.elsevier.com") != -1 &&
                        pdfUrl.endsWith("?httpAccept=text/xml")) {
                        //pdfUrlFromCrossRef = pdfUrl.replace("?httpAccept=text/xml", "?httpAccept=application/pdf");
                        
                        return true;
                    }
                    else if (link["content-type"] == "application/pdf") {
                        pdfUrlFromCrossRef = pdfUrl;
                        return true;
                    }
                }
            }
            for (var link of msg["link"]) {
                if (link["intended-application"] == "similarity-checking") {
                    var pdfUrl = link.URL;
                    if (pdfUrl.indexOf("api.elsevier.com") != -1 &&
                        pdfUrl.endsWith("?httpAccept=text/xml")) {
                        pdfUrlFromCrossRef = pdfUrl.replace("?httpAccept=text/xml", "?httpAccept=application/pdf");
                        return true;
                    }
                    else if (link["content-type"] === "unspecified" && !pdfUrl.endsWith(".pdf")) {
                        continue;
                    }
                    else {
                        pdfUrlFromCrossRef = pdfUrl;
                        return true;
                    }
                }
            }
        }
        finally {
            if (!isNullOrEmpty(pdfUrlFromCrossRef)) {
                reference.pdf = pdfUrlFromCrossRef;
            }
            else {
                telemetry.log("PDF not found", { reference: reference.title, provider: "CrossRef" });
            }
            _pdfLookupCache.dois[reference.doi] = pdfUrlFromCrossRef;
        }
    }
    async lookupCitationMetadata(reference) {
        if (isNullOrUndefined(reference.doi)) return false;

        var url = `https://dx.doi.org/${reference.doi}`;
        var response = await fetch2(url);
        if (Rgx.ScienceDirect.test(response.url)) {
            url = "https://www.sciencedirect.com/science/article/pii/" + Rgx.ScienceDirect.exec(response.url)[1];
            response = await fetch2(url);
        }
        if (!response.ok) {
            return false;
        }

        var pdfUrlFromCitationMetadata = "";
        try {
            var result = await response.text();

            if (response.url.startsWith("https://www.egms.de/static/")) {

                //s - Paramter wird von ESR 68 noch nicht unterstützt. Erst ab FF 78
                result = result.replace("\r", " ").replace("\n", " ");
                var egmsMatch = /class="format_pdf".+?href="(.+?)"/i.exec(result);
                if (egmsMatch && egmsMatch.length > 0) {
                    var pdfUrlFromCitationMetadata = "https://www.egms.de" + egmsMatch[1];
                    reference.pdf = pdfUrlFromCitationMetadata;
                    return true;
                }
            }

            var parser = new CitationMetaTagParser();
            parser.parse(result, url, true);
            pdfUrlFromCitationMetadata = parser.PDFUrl;
            if (!isNullOrEmpty(pdfUrlFromCitationMetadata)) {
                return true;
            }
        }
        finally {
            if (!isNullOrEmpty(pdfUrlFromCitationMetadata)) {
                reference.pdf = pdfUrlFromCitationMetadata;
                telemetry.log("PDF found", { reference: reference.title, provider: "CitationMetadata", pdf: reference.pdf });
            }
            else {
                telemetry.log("PDF not found", { reference: reference.title, provider: "CitationMetadata" });
            }
            _pdfLookupCache.dois[reference.doi] = pdfUrlFromCitationMetadata;
        }
        return false;
    }
    async lookupERIC(reference) {
        if (isNullOrEmpty(reference.eric_id)) {
            return false;
        }
        var url = `https://eric.ed.gov/?id=${reference.eric_id}`;
        var response = await fetch2(url);
        if (!response.ok) {
            telemetry.warn(`Response not ok: ${url}`, "ERIC");
            return false;
        }
        var pdfUrlFromERIC = "";
        try {
            var text = await response.text();
            var m  = /citation_pdf_url.+?content="(.+?)"/.exec(text);
            if (m != null && m.length == 2) {
                pdfUrlFromERIC = m[1];
            }
        }
        finally {
            if (!isNullOrEmpty(pdfUrlFromERIC)) {
                reference.pdf = pdfUrlFromERIC;
                telemetry.log("PDF found", { reference: reference.title, provider: "ERIC" });
            }
            else {
                telemetry.log("PDF not found", { reference: reference.title, provider: "ERIC" });
            }
        }
        return false;
    }
    async lookupUnpaywall(reference) {
        var url = `https://api.unpaywall.org/v2/${reference.doi}?email=support@citavi.com`;
        var response = await fetch(url);
        if (!response.ok) {
            telemetry.warn(`Response not ok: ${url}`, "Unpaywall");
            return false;
        }
       
        var pdfUrlFromUnPaywall = "";
        try {
            var result = JSON.parse(await response.text());
            if (result.best_oa_location != null &&
                result.best_oa_location.url_for_pdf != null &&
                result.best_oa_location.url_for_pdf != "") {
                pdfUrlFromUnPaywall = result.best_oa_location.url_for_pdf;
                return true;
            }
            else {
                for (var oa of result.oa_locations) {
                    if (oa.url_for_pdf != null &&
                        oa.url_for_pdf != "") {
                        pdfUrlFromUnPaywall = oa.url_for_pdf;
                        return true;
                    }
                }
            }
        }
        finally {
            if (!isNullOrEmpty(pdfUrlFromUnPaywall)) {
                reference.pdf = pdfUrlFromUnPaywall;
                telemetry.log("PDF found", { reference: reference.title, provider: "Unpaywall" });
            }
            else {
                telemetry.log("PDF not found", { reference: reference.title, provider: "Unpaywall" });
            }
            _pdfLookupCache.dois[reference.doi] = pdfUrlFromUnPaywall;
        }
        return false;
    }
    async lookupPMC(reference) {
        if (!isNullOrUndefined(_pdfLookupCache.pmcids[reference.pmcid])) {
            var pdf = _pdfLookupCache.pmcids[reference.pmcid];
            if (isNullOrEmpty(pdf)) return false;
            telemetry.log(`Pdf via Cache: ${reference.pmcid}`, { pdf: pdf });
            reference.pdf = pdf;
            return true;
        }

        var url = `https://www.ncbi.nlm.nih.gov/pmc/articles/${reference.pmcid}/`;
        var response = await fetch(url);
        if (!response.ok) {
            telemetry.warn(`Response not ok: ${url}`, "PubMed Central");
            return false;
        }

        var pmcFromPubmed = "";
        try {
            var html = await response.text();
            var rgx = /<a href=\"(.+?)\".+?<\/a>/g;
            var match;
            do {
                match = rgx.exec(html);
                if (match) {
                    if (match[1].indexOf(".pdf") == match[1].length - 4) {
                        pmcFromPubmed = "https://www.ncbi.nlm.nih.gov" + match[1];
                        return true;
                    }
                }
            } while (match);
        }
        finally {
            if (!isNullOrEmpty(pmcFromPubmed)) {
                reference.pdf = pmcFromPubmed;
                telemetry.log("PDF found", { reference: reference.title, provider: "Pubmed Central" });
            }
            else {
                telemetry.log("PDF not found", { reference: reference.title, provider: "Pubmed Central" });
            }
            _pdfLookupCache.pmcids[reference.pmcid] = pmcFromPubmed;
        }

        return false;
    }
    async lookupEOP(reference) {
        try {
            //Format of {patentNumber}: country-code + number + correction-code + kind-code
            //correction-code
            //https://www.epo.org/searching-for-patents/helpful-resources/first-time-here/definitions_de.html
            
            if (reference.source === "European Patent Office") {
                telemetry.log("Search pdf via EOP: " + reference.patentNumber);
                var number = reference.patentNumber.replace(/(?:\(|\)|\s)/g, "")
                var country = number.substr(0, 2);
                if (country === "EP") {
                    var docNumber = number.substr(2, number.length - 4);
                    var kc = number.substr(number.length - 2, 2);
                    var response = await fetch("https://data.epo.org/publication-server/rest/v1.2/patents/" + country + docNumber + "NW" + kc + "/document.pdf");
                    if (response.ok) {
                        var responseText = await response.text();
                        responseText = responseText.replace(/(?:\r\n|\r|\n)/g, " ");
                        reference.pdf = /iframe.+?documentCenter.+?src="(.+?)"/.exec(responseText)[1].replace(/&amp;/g, "&");
                        telemetry.log("Found pdf via EOP: " + reference.pdf);
                        return true;
                    }
                }
            }
        }
        catch (e) {
            telemetry.error(e);
        }
        return false;
    }
    async lookupCORE(reference) {
        try {
            if (reference.oai === "") {
                return false;
            }

            var response = await fetch("https://core.ac.uk:443/api-v2/search/identifiers:\"" + reference.oai + "\"?page=1&pageSize=10&apiKey=yphm81EqIjOZo67rBtPsR9XMxz5cafUG");
            if (!response.ok) {
                telemetry.warn(`Response not ok: ${url}`, "CORE");
                return false;
            }
            var json = await response.json();
            if (json.status === "OK" && json.titalHits > 0) {
                var url = json.data[0].source.downloadUrl;
                if (!isNullOrEmpty(url)) {
                    reference.pdf = url;
                    telemetry.log("Found pdf via CORE: " + reference.pdf);
                    return true;
                }
            }
        }
        catch (e) {
            telemetry.error(e);
        }
        return false;
    }

    async lookup(reference) {
        if (!settings.importPdf) {
            return;
        }
        try {
            if (!isNullOrEmpty(reference.arxivId)) {
                reference.pdf = "https://arxiv.org/pdf/" + reference.arxivId;
                return;
            }
            if (!isNullOrEmpty(reference.eric_id)) {
                if (await this.lookupERIC(reference)) {
                    return;
                }
            }
            if (!isNullOrEmpty(reference.doi)) {
                try {

                    if (!isNullOrUndefined(_pdfLookupCache.dois[reference.doi])) {
                        var pdf = _pdfLookupCache.dois[reference.doi];
                        if (isNullOrEmpty(pdf)) return false;
                        telemetry.log(`Pdf via Cache: ${reference.doi}`, { pdf: pdf });
                        reference.pdf = pdf;
                        return true;
                    }

                    if (!isNullOrUndefined(this.proxy)) {
                        if (this.proxy.isHAN) {
                            var url = await this.proxy.fetchDoi(reference.doi);
                            if (url != null) {
                                var pdf = await this.getPdfLinkFromWebsite(url);
                                if (!isNullOrEmpty(pdf)) {
                                    reference.pdf = pdf;
                                    _pdfLookupCache.dois[reference.doi] = pdf;
                                    return;
                                }
                            }
                        }
                    }

                    if (await this.lookupUnpaywall(reference)) return;
                    if (await this.lookupCitationMetadata(reference)) return;
                    if (await this.lookupCrossRef(reference)) return;
                    if (await this.lookupCORE(reference)) return;
                }
                catch (e) {
                    telemetry.error(e);
                }
                finally {
                    reference.upwChecked = true;
                }
            }
            if (!isNullOrEmpty(reference.pmcid)) {
                if (await this.lookupPMC(reference)) {
                    return;
                }
            }
            if (!isNullOrEmpty(reference.patentNumber)) {
                if (await this.lookupEOP(reference)) {
                    return;
                }
            }
        }
        catch (e) {
            telemetry.error(e);
        }
        finally {
            reference.upwChecked = true;
        }
    }

    resetCache(reference) {
        if (!isNullOrUndefined(reference)) {
            if (!isNullOrEmpty(reference.doi)) {
                telemetry.log("reset pdflookup cache. Doi: " + reference.doi);
                delete _pdfLookupCache.dois[reference.doi];
            }
            if (!isNullOrEmpty(reference.pmcid)) {
                telemetry.log("reset pdflookup cache. PMCID: " + reference.pmcid);
                delete _pdfLookupCache.pmcids[reference.pmcid];
            }
        }
        else {
            telemetry.log("reset pdflookup cache");
            _pdfLookupCache = {
                dois: {},
                pmcids: {}
            };
        }
    }

    async resolveUrl(url) {
        try {

            if (Rgx.WhileyPdf.test(url)) {
                url = url.replace("/pdf/", "/pdfdirect/");
                return resolveUrl(url);
            }

            var response = await fetch2(url);
            if (Rgx.ScienceDirect.test(response.url)) {
                url = "https://www.sciencedirect.com/science/article/pii/" + Rgx.ScienceDirect.exec(response.url)[1];
                response = await fetch2(url);
            }
            
            if (!response.ok) {
                return { url: url, isPdf: false };
            }
            var contenttype = response.headers.get("content-type");
            telemetry.log(`resolve pdfurl: responsetype is ${contenttype}`);

            if (contenttype !== null) {

                if (contenttype.indexOf("application/pdf") != -1) {
                    return { url: url, isPdf: true };
                }

                if (contenttype.indexOf("text/html") !== -1) {
                    if (Rgx.ScienceDirectPDFRedirect.test(response.url)) {
                        var sd_response = await response.text();
                        var sd_redirect = /window\.location\s*=\s*'(https:.+?X-Amz-Security-Token=.+?)'/.exec(sd_response)[1];
                        telemetry.log("ScienceDirect redirect: " + sd_redirect);
                        return { url: sd_redirect, isPdf: true };
                    }
                    else {
                        var parser = new DOMParser();
                        var html = await response.text();
                        var htmlDoc = parser.parseFromString(html, 'text/html');
                        var pdfEmbedObject = htmlDoc.querySelector("object[type='application/pdf']");
                        if (!isNullOrUndefined(pdfEmbedObject)) {
                            pdfEmbedObject = pdfEmbedObject.querySelector("embed[type='application/pdf']");
                            if (!isNullOrUndefined(pdfEmbedObject)) {
                                var pdfUrlEmbed = pdfEmbedObject.getAttribute("src");

                                if (pdfUrlEmbed.startsWith("/")) {
                                    pdfUrlEmbed = new URL(url).origin + pdfUrlEmbed;
                                }
                                telemetry.log(`PdfUrl via embeded object found: ${pdfUrlEmbed}`);
                                return { url: pdfUrlEmbed, isPdf: true };
                            }
                            telemetry.log(`object found but embed element missing`);
                        }

                        var iframeObject = htmlDoc.querySelector("iframe[type='application/pdf']");
                        if (!isNullOrUndefined(iframeObject)) {
                            var pdfUrlEmbed = iframeObject.getAttribute("src");
                            if (pdfUrlEmbed.startsWith("/")) {
                                pdfUrlEmbed = new URL(url).origin + pdfUrlEmbed;
                            }
                            if (pdfUrlEmbed == "") {
                                return { url: url, isPdf: false };
                            }
                            telemetry.log(`PdfUrl via embeded iframe found: ${pdfUrlEmbed}`);
                            return { url: pdfUrlEmbed, isPdf: true };
                        }

                        var fromWebpage = await this.getPdfLinkFromWebsite(url, html);
                        if (fromWebpage !== null) {
                            return { url: fromWebpage, isPdf: true };
                        } 
                    }
                }
            }

            telemetry.log(`resolve pdfurl - no pdf found`);
        }
        catch (e) {
            telemetry.error(e, {url: url});
        }
        return { url: url, isPdf: false };
    }
}

//Wenn ein PDF nicht gefunden wird: Prüfen ob https://dissemin.readthedocs.io/en/latest/api.html was ist.
//http://api.semanticscholar.org/corpus/

