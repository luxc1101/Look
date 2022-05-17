class ReferenceLookup {

    constructor() {
        this.crossRefUrl = "https://api.crossref.org/v1/works/";
        this.semanticscholarUrl = "http://api.semanticscholar.org/v1/paper/";
    }

    async lookup(reference) {
        var parser = new SimpleParser();

        try {
            if (!isNullOrEmpty(reference.doi)) {
                var ris_response = await fetch("https://doi.org/" + reference.doi, {
                    headers: {
                        "Accept": "application/x-research-info-systems"
                    }
                });

                if (!ris_response.ok) {
                    return null;
                }

                var ris = await ris_response.text();
                var refs = parser.parseRIS([ris]);
                if (refs === null) {
                    return null;
                }
                return refs[0];
            }
        }
        catch (e) {
            telemetry.error(e);
        }
        return null;
    }

    async fuzzy(fullstring) {
        try {
            const response = await fetch("https://search.crossref.org/links", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify([fullstring])
            });
            if (response.ok) {
                var json = await response.json();
                if (json.query_ok && json.results[0].match) {
                    var doi = json.results[0].doi.replace("https://doi.org/", "");
                    return this.lookup({ doi: doi });
                }
            }
        }
        catch (e) {
            telemetry.error(e, { source: fullstring});
        }
        return null;
    }
}
