class AbstractLookup {

    constructor() {
        //http://api.semanticscholar.org/corpus/
        this.semanticscholarUrl = "http://api.semanticscholar.org/v1/paper/";
    }

    async lookup(reference) {
        try {

            if (!isNullOrEmpty(reference.doi)) {
                var semanticscholar_response = await fetch(this.semanticscholarUrl + reference.doi);

                if (!semanticscholar_response.ok) {
                    return false;
                }

                var json = await semanticscholar_response.json();
                if (json.abstract) {
                    return json.abstract;
                }
                if (json.paperAbstract) {
                    return json.paperAbstract;
                }
            }
        }
        catch (e) {
            telemetry.error(e);
        }
        return false;
    }
}
