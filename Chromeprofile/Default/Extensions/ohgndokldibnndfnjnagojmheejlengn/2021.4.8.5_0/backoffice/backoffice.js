class BackOffice {

    constructor() {
    }

    async getOpenUrlInfo(id) {
        return await fetch(`https://backoffice6.citavi.com/api/openurl/get?id=${id}`);
    }

    async search(identifier) {
        var format = citaviPicker.activeRepo.isWeb ? "json" : "xml";
        var boVersion = citaviPicker.activeRepo.version_major;
        var fetcher = new Fetcher(boVersion, format);
        var result = null;
       
        if (identifier.type == ReferenceIdentifierType.Isbn) {
            var transformers = await citaviPicker.getIsbnTransformers();
            if (transformers.find(t => t.Id == "b7978129-4fcd-2075-a462-26bfed698a9f") == null) {
                transformers.push(
                    {
                        Checked: false,
                        DisplayName: "WorldCat",
                        Id: "b7978129-4fcd-2075-a462-26bfed698a9f",
                        Name: "WorldCat"
                    });
            }
            for (var transformer of transformers) {
                result = await fetcher.fetchByIsbn(identifier.value, transformer.Id, transformer.Username, transformer.Password, transformer.Group);
                if (result != null) {
                    return result;
                }
            }
        }
        else if (identifier.type == ReferenceIdentifierType.Doi) {
            result = await fetcher.fetchByDoi(identifier.value);
        }
        else if (identifier.type == ReferenceIdentifierType.PubMedId) {
            
            result = await fetcher.fetchByPMID(identifier.value);
        }
        else if (identifier.type == ReferenceIdentifierType.PmcId) {
            result = await fetcher.fetchByPMCID(identifier.value);
        }
        else if (identifier.type == ReferenceIdentifierType.Arxiv) {
            result = await fetcher.fetchByArXiv(identifier.value);
        }

        return result;
    }
}