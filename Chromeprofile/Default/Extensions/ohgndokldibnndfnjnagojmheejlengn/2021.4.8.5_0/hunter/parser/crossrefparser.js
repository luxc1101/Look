class CrossRefParser
{
    constructor() {

    }

    parse(json) {
        var recordText = "";
        try {

            var reference;
            if (json.message.items) {
                if (json.message.items.length == 1) {
                    reference = json.message.items[0];
                }
            }
            else if (json.message.DOI) {
                reference = json.message;
            }

            switch (reference.type) {
                case "monograph":
                    recordText += `TY  - BOOK\r\n`;
                    break;

                case "book-chapter":
                    recordText += `TY  - Chapter\r\n`;
                    if (reference["container-title"]) {
                        var parent = reference['container-title'][0];
                        recordText += `T2  - ${parent}\r\n`;
                    }
                    if (reference.page != undefined) {
                        recordText += `SP  - ${reference.page}\r\n`;
                    }
                    break;

                case "proceedings-article":
                    recordText += `TY  - CPAPER\r\n`;
                    if (reference["container-title"]) {
                        var parent = reference['container-title'][0];
                        recordText += `BT  - ${parent}\r\n`;
                    }
                    if (reference.page != undefined) {
                        recordText += `SP  - ${reference.page}\r\n`;
                    }
                    break;
                case "journal-article":
                    recordText += `TY  - JOUR\r\n`;
                    if (reference["container-title"]) {
                        var parent = reference['container-title'][0];
                        recordText += `JF  - ${parent}\r\n`;
                    }
                    if (reference["short-container-title"]) {
                        var parent = reference['short-container-title'][0];
                        recordText += `JA  - ${parent}\r\n`;
                    }
                    if (reference.page != undefined) {
                        recordText += `SP  - ${reference.page}\r\n`;
                    }
                    break;
            }

            if (reference.DOI != undefined) {
                recordText += `DO  - ${reference.DOI}\r\n`;
            }
            if (reference.ISBN != undefined &&
                reference.ISBN.length > 0) {
                recordText += `SN  - ${reference.ISBN[0]}\r\n`;
            }
            else if (reference.ISSN != undefined &&
                reference.ISSN.length > 0) {
                var issn = reference.ISSN[0];
                recordText += `SN  - ${issn}\r\n`;
            }
            if (reference["edition-number"] != undefined) {
                var edition = reference["edition-number"];
                recordText += `ET  - ${edition}\r\n`;
            }
            if (reference.issue != undefined) {
                recordText += `IS  - ${reference.issue}\r\n`;
            }
            if (reference.language != undefined) {
                recordText += `LA  - ${reference.language}\r\n`;
            }

            if (reference.URL != undefined) {
                recordText += `UR  - ${reference.URL}\r\n`;
            }
            if (reference.publisher != undefined) {
                recordText += `PB  - ${reference.publisher}\r\n`;
            }
            if (reference["publisher-location"] != undefined) {
                var loc = reference["publisher-location"];
                recordText += `CY  - ${loc}\r\n`;
            }
            if (reference.title != undefined) {
                recordText += `TI  - ${reference.title}\r\n`;
            }
            if (reference.volume != undefined) {
                recordText += `VL  - ${reference.volume}\r\n`;
            }
            if (reference.issued != null) {
                var parts = reference.issued["date-parts"];
                if (parts != null && parts.length > 0) {
                    var year = parts[0][0];
                    recordText += `PY  - ${year}\r\n`;
                }
            }

            if (reference.author != undefined &&
                reference.author.length > 0) {
                for (var author of reference.author) {
                    var name = author.family;
                    if (author.given != undefined) name += ", " + author.given;
                    recordText += `AU  - ${name}\r\n`;
                }
            }
            if (reference.editor != undefined &&
                reference.editor.length > 0) {
                for (var editor of reference.editor) {
                    var name = editor.family;
                    if (editor.given != undefined) name += ", " + editor.given;
                    recordText += `ED  - ${name}\r\n`;
                }
            }
        }
        catch (e) {
            console.error(e);
        }
        return recordText;
    }
}