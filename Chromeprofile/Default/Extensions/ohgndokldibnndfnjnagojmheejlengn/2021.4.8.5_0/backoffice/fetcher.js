class Fetcher
{
    constructor(backOfficeVersion, format) {
        this.format = format;
        this.baseUrl = "https://backoffice" + backOfficeVersion + ".citavi.com/api/onlinesearch/";
    }

    async fetchByArXiv(arxivId) {
        try {
            var url = this.baseUrl + "FetchArXiv?format=" + this.format + "&arXivId=" + encodeURIComponent(arxivId);
            return await this.fetchBackOffice(url, arxivId);
        }
        catch (e) {
            telemetry.error(e);
        }
    }

    async fetchByIsbn(isbn, transformerId, user, pass, group) {
        try {
            isbn = isbn.replace(/-/g, "");
            if (user == undefined) user = "";
            if (pass == undefined) pass = "";
            if (group == undefined) group = "";

            var url = this.baseUrl + "FetchByIsbn?format=" + this.format + "&isbn=" + isbn + "&transformerId=" + transformerId + "&username=" + user + "&password=" + pass + "&group=" + group;
            return await this.fetchBackOffice(url, isbn);
        }
        catch (e) {
            telemetry.error(e);
        }
    }

    async fetchByDoi(doi) {
        try {
            var url = this.baseUrl + "FetchByDoi?format=" + this.format + "&doi=" + encodeURIComponent(doi);
            return await this.fetchBackOffice(url, doi);
        }
        catch (e) {
            telemetry.error(e);
        }
    }

    async fetchByPMID(doi) {
        try {
            var url = this.baseUrl + "FetchPubMed?format=" + this.format + "&pubmedIdOrDoi=" + encodeURIComponent(doi.replace("PMID", ""));
            return await this.fetchBackOffice(url, doi);
        }
        catch (e) {
            telemetry.error(e);
        }
    }

    async fetchByPMCID(pmcId) {
        try {
            var url = this.baseUrl + "FetchPMC?format=" + this.format + "&pmcId=" + encodeURIComponent(pmcId);
            return await this.fetchBackOffice(url, pmcId);
        }
        catch (e) {
            telemetry.error(e);
        }
    }

    async fetchBackOffice(url, id) {
        var response = await fetch(url);
        var json = await response.json();
        if (json == null || json.length == 0) {
            return null;
        }

        var result = json;
        if (this.format == "xml") {
            result = json[0].Xml;
        }
        return result;
    }
}