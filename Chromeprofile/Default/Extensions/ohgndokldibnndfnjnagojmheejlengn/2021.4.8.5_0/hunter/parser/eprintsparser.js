class EPrintsParser
{
    constructor() {
        this._doi = "";
        this._isbn = "";
        this._success = false;
    }

    get DOI() {
        return this._doi;
    }
    get ISBN() {
        return this._isbn;
    }

    get Success() {
        return this._success;
    }

   parse(html, url) {
        this._doi = "";
        this._isbn = "";
        this._success = false;

        if (html == "") return "";
       
        var recordText = "";
        try {
            var metaElements = [];
            var rgx = /<meta name=\"(.+?)\".+?content=(.+?)\/?>/g;
            var match;
            do {
                match = rgx.exec(html);
                if (match) {
                    metaElements.push({
                        name: match[1].replace(/\"/g, "").trim().toLocaleLowerCase(),
                        content: match[2].replace(/\"/g, "").trim(),
                    });
                }
            } while (match);

            for (var metaElement of metaElements) {
                recordText += "\r\n";
                
                switch (metaElement.name) {
                    case "eprints.type":
                        recordText += `TY  - ${metaElement.content}\r\n`;
                        break;

                    case "eprints.creators_name":
                        recordText += `AU  - ${metaElement.content}\r\n`;
                        break;

                    case "eprints.title":
                        recordText += `TI  - ${metaElement.content}\r\n`;
                        this._success = true;
                        break;

                    case "eprints.date":
                        recordText += `PY  - ${metaElement.content}\r\n`;
                        break;

                    case "eprints.publisher":
                        recordText += `PB  - ${metaElement.content}\r\n`;
                        break;

                    case "eprints.place_of_pub":
                        recordText += `CY  - ${metaElement.content}\r\n`;
                        break;

                    case "eprints.pages":
                        recordText += `PG  - ${metaElement.content}\r\n`;
                        break;

                    case "eprints.isbn":
                        recordText += `IS  - ${metaElement.content}\r\n`;
                        break;

                    default:
                        continue;

                }
            }

            recordText += "UR  - " + url + "\r\n";
            var matches = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
            recordText += "TS  - " + matches[1] + "\r\n";

            var r = recordText.split('\r\n');
            recordText = "";
            for (var l of r) {
                if (l == "") continue;
                recordText += l + "\r\n";
            }
        }
        catch (e) {
            console.error(e);
        }
        //console.log("EPrints: \r\n" + recordText);
        return recordText;
    }
}