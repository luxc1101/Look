var hunter = new function () {
    this.fileName = "pubmed.js";
    this.name = "PubMed";
    this.id = "D6E5D09C-1986-4e85-B64D-56B8132BBD78";
    this.importFormat = "3d2c0414-066b-4a30-b011-06136eb493f9";
    this.priority = 10;
    this.example = "https://www.ncbi.nlm.nih.gov/pubmed/29226531";

    this.getHTMLElementAttributeValue = function (element, attr) {
        if (element == undefined) return "";
        return element.getAttribute(attr);
    }

    this.identify = function () {
        var counter = 0;

        try {
            if (document.URL.indexOf("www.ncbi.nlm.nih.gov", 0) == -1) {
                return 0;
            }

            if (document.URL.indexOf("www.ncbi.nlm.nih.gov/pmc", 0) != -1) {

                //PUBMED Central (einbisschen anderes als PubMed)
                var titleElements = document.getElementsByTagName("div");
                for (var i = 0; i < titleElements.length; i++) {
                    if (this.getHTMLElementAttributeValue(titleElements[i], "class") == "title") {
                        counter++;
                    }
                }

                if (counter > 0) {
                    if (counter > 1) return 0;
                    return 1;
                }

                if (counter > 0) {
                    if (counter > 20) return 20;
                    return counter;
                }


                titleElements = document.getElementsByTagName("meta");
                for (var i = 0; i < titleElements.length; i++) {

                    //Ein Treffer gefunden (PMID steht in URL, dann gibt es dieses Element)
                    if (this.getHTMLElementAttributeValue(titleElements[i], "name") == "ncbi_pcid") {
                        return 1;
                    }
                }

            }
            else {
                //Liste von Treffern
                var titleElements = document.getElementsByTagName("p");
                for (var i = 0; i < titleElements.length; i++) {
                    if (this.getHTMLElementAttributeValue(titleElements[i], "class") == "title") {
                        counter++;
                    }
                }

                if (counter > 0) {
                    if (counter > 1) return 0;
                    return 1;
                }

                if (counter > 0) {
                    if (counter > 20) return 20;
                    return counter;
                }


                titleElements = document.getElementsByTagName("meta");
                for (var i = 0; i < titleElements.length; i++) {

                    //Ein Treffer gefunden (PMID steht in URL, dann gibt es dieses Element)
                    if (this.getHTMLElementAttributeValue(titleElements[i], "name") == "ncbi_uidlist") {
                        return 1;
                    }

                    //Ein Treffer gefunden (Die Query steht in URL)
                    if (this.getHTMLElementAttributeValue(titleElements[i], "name") == "ncbi_resultcount" &&
                        this.getHTMLElementAttributeValue(titleElements[i], "content") == "1") {
                        return 1;
                    }
                }
            }

        }
        catch (e) {
            //alert(e);
        }
        return counter;
    }

    this.identifyUrl = function (url) {
        if (url.indexOf("www.ncbi.nlm.nih.gov", 0) == -1) {
            return false;
        }
        return true;
    }

    this.scanAsync = async function () {
        try {

            var max = 20;

            if (document.URL.indexOf("www.ncbi.nlm.nih.gov/pmc", 0) != -1) {

                //PUBMED Central (einbisschen anderes als PubMed)
                var titleElements = document.getElementsByTagName("div");
                for (var i = 0; i < titleElements.length; i++) {
                    var titleElement = titleElements[i];
                    if (this.getHTMLElementAttributeValue(titleElement, "class") == "title") {

                        var linkElement = titleElement.getElementsByTagName("a")[0];
                        var title = titleElement.textContent;
                        var id = /PMC(\d+)/.exec(linkElement.href)[1];
                        return await this.getAsync(id);
                    }
                }

                titleElements = document.getElementsByTagName("meta");
                for (var i = 0; i < titleElements.length; i++) {

                    if (this.getHTMLElementAttributeValue(titleElements[i], "name") == "ncbi_pcid") {
                        return await this.getAsync(this.getHTMLElementAttributeValue(titleElements[i], "content"));
                    }
                }

                var pmidRgx = new RegExp(/PMCID:.+?(\d+)/);
                var text = document.body.innerText;
                if (text == undefined) text = document.body.textContent;
                var pmid = pmidRgx.exec(text)[1];
                return await this.getAsync(pmid);
            }
            else {

                var titleElements = document.getElementsByTagName("p");
                for (var i = 0; i < titleElements.length; i++) {
                    if (this.getHTMLElementAttributeValue(titleElements[i], "class") == "title") {

                        var title = titleElements[i].textContent;
                        var id = this.getHTMLElementAttributeValue(titleElements[i].getElementsByTagName("a")[0], "href").replace(/.+\//, "");
                        return await this.getAsync(id);
                    }
                }

                titleElements = document.getElementsByTagName("meta");
                for (var i = 0; i < titleElements.length; i++) {

                    if (this.getHTMLElementAttributeValue(titleElements[i], "name") == "ncbi_uidlist") {
                        return await this.getAsync(this.getHTMLElementAttributeValue(titleElements[i], "content"));
                    }
                }

                var pmidRgx = new RegExp(/PMID:.+?(\d+)/);
                var text = document.body.innerText;
                if (text == undefined) text = document.body.textContent;
                var pmid = pmidRgx.exec(text)[1];
                return await this.getAsync(pmid);
            }
        }
        catch (e) {
            console.error(e);
        }
        return null;
    }
    this.getAsync = async function (recordIds) {
        var result = [];
        try {

            var ids = recordIds.replace(/\n/g, ",");

            if (document.URL.indexOf("www.ncbi.nlm.nih.gov/pmc", 0) != -1) {

                var idList = ids.split(",");

                for (var i = 0; i < idList.length; i++) {

                    var response = await fetch("http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=PMC&retmode=file&rettype=MEDLINE&id=" + idList[i]);
                    var recordText = await response.text();

                    if (idList.length == 1) {
                        var linkElements = document.getElementsByTagName("a");
                        for (var j = 0; j < linkElements.length; j++) {
                            var linkElement = linkElements[j];
                            if (/\/pmc\/articles\/.+?\/pdf\/.+?\.pdf/.test(linkElement.href)) {
                                var pdfLink = "DoP - " + linkElement.href;
                                recordText += pdfLink;
                                break;
                            }
                        }
                    }
                    recordText += "\r\n";
                    result.push(recordText);
                }
            }
            else {
                var idList = ids.split(",");
                for (var i = 0; i < idList.length; i++) {
                    var response = await fetch("http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=PubMed&retmode=file&rettype=MEDLINE&id=" + ids);
                    result.push(await response.text());
                }
            }
        }
        catch (e) {
            console.error(e);
        }
        return result;
    }

}
if (typeof hunters !== 'undefined') {
    hunters.add(hunter);
}

