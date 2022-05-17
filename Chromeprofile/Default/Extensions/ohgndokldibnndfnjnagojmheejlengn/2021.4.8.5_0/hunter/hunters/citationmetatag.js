var hunter = new function () {
    this.fileName = "citationmetatag.js";
    this.name = "CitationMetaTag";
    this.id = "4FB9F145-806E-44E4-8863-C266F7A0DFD5";
    this.importFormat = "1bdc9da0-328c-4cdf-96de-b9fe2eaef9da";
    this.priority = 6;
    this.example = "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0011283";
    this.requiredParsers = ["CitationMetaTagParser"];
    
    this.identifyUrl = function (url) { return true; };

    this.identify = function () {
        try {

            var element = document.querySelector("meta[name='citation_title']");
            if (element != null) {
                return 1;
            }
            element = document.querySelector("meta[property='citation_title']"); //researchgate - toll! (hat auch LDJSON - CMT ist besser. Prio auf 6 gestellt
            if (element != null) {
                return 1;
            }
            element = document.querySelector("meta[name='citation_xml_url']"); //https://www.emerald.com/insight/content/doi/10.1108/AAOUJ-10-02-2015-B004/full/html
            if (element != null) {
                return 1;
            }
            element = document.querySelector("meta[name='citation_doi']"); //http://langsci-press.org/catalog/book/233  (hat nur citation_doi)
            if (element != null) {
                return 1;
            }
            element = document.querySelector("meta[name='DC.doi']"); //https://ueaeprints.uea.ac.uk/id/eprint/35494/ 
            if (element != null) {
                return 1;
            }
            element = document.querySelector("meta[name='prism.doi']"); //https://www.nature.com/articles/452919a
            if (element != null) {
                return 1;
            }
            element = document.querySelector("meta[name='eprints.title']");
            if (element != null) {
                return 1;
            }
        }
        catch (e) {
            console.error(e);
        }
        return 0;
    }

    this.scanAsync = async function () {
        var result = [];
        var recordText = "";
        

        try {
            var parser = new CitationMetaTagParser();
            recordText = await parser.parse(document.documentElement.innerHTML, document.location.toString(), false);
            result.push(recordText);
        }
        catch (e) {
            console.error(e);
        }

        return result;
    }
};
if (typeof hunters !== 'undefined') {
    hunters.add(hunter);
}
