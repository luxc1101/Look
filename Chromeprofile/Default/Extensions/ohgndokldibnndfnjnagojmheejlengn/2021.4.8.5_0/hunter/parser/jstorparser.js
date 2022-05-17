class JStorParser
{
    constructor() {
        this._success = false;
    }

    get Success() {
        return this._success;
    }

    fetch2(url) {
        return new Promise(async resolve => {
            if (url.indexOf(".google.") != -1) {
                resolve("");
                return;
            }
            chrome.runtime.sendMessage({ action: MessageKeys.fetchText, value: url }, (source) => {
                if (source == "") {
                    console.error(url);
                }
                resolve(source);
            });
        });
    };

    async parse(url, isCrossRequest) {
        this._success = false;
        var recordText = "";
        try {
            if (!/jstor.org\/stable\/(.+?)(\?|$)/.test(url)) return "";
            var responseText = "";
            var response;
            if (isCrossRequest) {
                responseText = await this.fetch2(url);
            }
            else {
                response = await fetch(url);
                responseText = await response.text();
            }

            var jstorId = /jstor.org\/stable\/(.+?)(\?|$)/.exec(url)[1];

            var rgx = /<meta name="ST.discriminator" content="(.+?)"/g;
            var doi = rgx.exec(responseText)[1];
            var url = `https://www.jstor.org/citation/ris/${doi}`;
            if (isCrossRequest) {
                responseText = await this.fetch2(url);
            }
            else {
                response = await fetch(url);
                responseText = await response.text();
            }
            responseText = responseText.replace("\r\nER  - ", "\r\nQZ  - https://www.jstor.org/stable/pdf/" + jstorId + ".pdf\r\nER  - ");
            responseText = responseText.substr(responseText.indexOf("TY  - "));
            
            this._success = true;
            return responseText;
        }
        catch (e) {
            console.error(e);
            return "";
        }
        return recordText;
    }
}