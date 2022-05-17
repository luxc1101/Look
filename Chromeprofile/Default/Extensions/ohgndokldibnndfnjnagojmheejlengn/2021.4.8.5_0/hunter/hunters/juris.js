var hunter = new function () {
	this.fileName = "juris.js";
	this.name = "Juris";
	this.id = "B04F06BC-088C-49CC-889F-A3A6ABE9F6D8";
    this.importFormat = "1bdc9da0-328c-4cdf-96de-b9fe2eaef9da";
    this.priority = 10;
    this.supportsRefresh = true;

    this.identifyUrl = function (url) {

        if (url.indexOf("r3/document") == -1 &&
            url.indexOf("r3/search") == -1) {
            return false;
        }
        return true;
    };

    this.identify = function () {
        try {

            if (document.URL.indexOf("r3/document") == -1) {
                return 0;
            }
            var links = document.getElementsByTagName("span");
            for (var i = 0; i < links.length; i++) {

                if (links[i].className == "Z3988") {
                    return 1;
                }
            }
        }
        catch (e) {

        }
        return 0;
    };

    this.replaceAll = function (source, a, b) {
        while (source.indexOf(a) != -1) {
            source = source.replace(a, b);
        }

        return source;
    };

    this.scanAsync = async function (info) {
        var records = [];
        var recordText = "";

        try {

            var fields = [];

            var links = document.getElementsByTagName("span");
            var coinsString = "";
            for (var i = 0; i < links.length; i++) {
                if (links[i].className == "Z3988") {
                    coinsString = links[i].title;
                    var a = coinsString.split('&');
                    recordText = "";
                    var doctype = "";

                    for (var i = 0; i < a.length; i++) {
                        var field = a[i].split('=')[0].replace("rft.", "");
                        var value = a[i].split('=')[1];
                        value = decodeURIComponent(value);
                        fields.push({ Name: field, Value: value });
                        if (field == "type") {
                            doctype = value;
                        }
                        if (field == "genre") {
                            doctype = value;
                        }
                    }
                    break;
                }
            }

            var jurisImport = new JurisImport();

            recordText = jurisImport.import(doctype, fields);

            if (recordText != "") {

                recordText = this.replaceAll(recordText, "+", " ");
                recordText = this.replaceAll(recordText, "&nbsp;", " ");
                recordText = this.replaceAll(recordText, "&amp;", ";");
                recordText = this.replaceAll(recordText, "%21", "!");
                recordText = this.replaceAll(recordText, "%23", "#");
                recordText = this.replaceAll(recordText, "%24", "$");
                recordText = this.replaceAll(recordText, "%25", "%");
                recordText = this.replaceAll(recordText, "%26", "&");
                recordText = this.replaceAll(recordText, "%27", "'");
                recordText = this.replaceAll(recordText, "%28", "(");
                recordText = this.replaceAll(recordText, "%29", ")");
                recordText = this.replaceAll(recordText, "%2A", "*");
                recordText = this.replaceAll(recordText, "%2B", "+");
                recordText = this.replaceAll(recordText, "%2F", "/");
                recordText = this.replaceAll(recordText, "%2C", ",");
                recordText = this.replaceAll(recordText, "%3C", "<");
                recordText = this.replaceAll(recordText, "%3D", "=");
                recordText = this.replaceAll(recordText, "%3E", ">");
                recordText = this.replaceAll(recordText, "%3F", "?");
                recordText = this.replaceAll(recordText, "%3B", ";");
                recordText = this.replaceAll(recordText, "%3A", ":");
                recordText = this.replaceAll(recordText, "%40", "@");
                recordText = this.replaceAll(recordText, "%5B", "[");
                recordText = this.replaceAll(recordText, "%5D", "]");

                var pdfLinks = document.getElementsByTagName("a");
                for (var j = 0; j < pdfLinks.length; j++) {
                    var l = pdfLinks[j];
                    if (l.href.indexOf("/jportal/recherche3doc/") != -1 &&
                        l.href.indexOf(".pdf") != -1) {
                        recordText += "\r\nQZ  - " + l.href;
                    }
                }
            }

            records.push(recordText);
        }
        catch (e) {
            console.error(e);
        }

        return records;
    };

    function JurisImport() {
        this.jurisLabels = [];
    }

    JurisImport.prototype.jurisLabels = [];

    JurisImport.prototype.getFieldValue = function (fldName) {

        if (this.jurisLabels.length == 0) {
            try {
                var tbl = document.getElementsByClassName("documentHeader")[0];
                var labels = tbl.getElementsByTagName("td");
                for (var o = 0; o < labels.length - 1; o++) {
                    try {
                        if (labels[o].childNodes.length == 0) continue;

                        var label = labels[o];
                        if (!/.+?\:$/g.test(label.textContent)) continue;

                        var name = decodeURIComponent(label.textContent).trim();
                        name = name.replace(/\s/g, " ");
                        var child = labels[o + 1];
                        this.jurisLabels.push({ Name: name, Value: decodeURIComponent(child.textContent) });

                    }
                    catch (e) {

                    }
                }
            }
            catch (e) {

            }
        }
        for (var l = 0; l < this.jurisLabels.length; l++) {
            var item = this.jurisLabels[l];
            if (item.Name == fldName) return item.Value;
        }
        return "";
    }

    JurisImport.prototype.getFieldValue2 = function (fldName) {

        if (this.jurisLabels.length == 0) {
            try {
                var tbl = document.getElementsByClassName("docheader__header")[0];
                var labels = tbl.getElementsByTagName("td");
                for (var o = 0; o < labels.length; o++) {
                    try {
                        var label = labels[o].previousElementSibling;
                        if (!/.+?\:$/g.test(label.textContent)) continue;

                        var name = decodeURIComponent(label.textContent).trim();
                        name = name.replace(/\s/g, " ");
                        this.jurisLabels.push({ Name: name, Value: decodeURIComponent(labels[o].textContent) });
                    }
                    catch (e) {

                    }
                }
            }
            catch (e) {

            }
        }
        for (var l = 0; l < this.jurisLabels.length; l++) {
            var item = this.jurisLabels[l];
            if (item.Name == fldName) {
                return item.Value;
            }
        }
        return "";
    };

    JurisImport.prototype.import = function (docType, fields) {

        switch (docType) {
            case "case":
                return this.importCourtDecision(fields);

            case "article":
                return this.importArticle(fields);

            case "book":
                return this.importBook(fields);

            default:
                return this.importSTAT(fields);
        }
    }

    JurisImport.prototype.getTitle = function () {
        var sp = document.getElementsByTagName("div");

        for (var j = 0; j < sp.length; j++) {
            var t = sp[j];
            if (t.className == "docLayoutTitel") {
                var title = "";
                for (var jj = 0; jj < t.childElementCount; jj++) {
                    title += decodeURIComponent(t.childNodes[jj].textContent + ". ");
                }
                title = title.replace(/\.\s$/g, "");
                title = title.replace(/\s+/g, " ");
                title = title.trim();
                return title;
            }
        }

        for (var j = 0; j < sp.length; j++) {
            var t = sp[j];
            if (t.className == "docLayoutText") {
                var title = decodeURIComponent(t.childNodes[0].textContent + ". ");
                title = title.replace(/\.\s$/g, "");
                title = title.replace(/\s+/g, " ");
                title = title.trim();
                return title;
            }
        }

        return "";
    };

    JurisImport.prototype.importCourtDecision = function (fields) {

        var recordText = "";

        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            var value = field.Value;
            switch (field.Name) {
                case "type":
                    recordText += "\r\nTY  - CourtDecision";
                    break;
                case "creator": //Gericht
                    recordText += "\r\nAU  - " + value.replace(/\d+\.\sSenat$/g, ""); //#3061
                    break;

                case "date"://Entscheidungsdatum 2015-03-09
                    var date = value.split('-');
                    recordText += "\r\nY2  - " + date[2] + "." + date[1] + "." + date[0];
                    break;

                case "title":
                    recordText += "\r\nN6  - " + value;//Aktenzeichen
                    break;

                case "description":
                    recordText += "\r\nN7  - " + value;//Dokumenttyp (Beschluss)
                    break;

                case "rft_id": //URL
                    //recordText += "\r\nL1  - " + value;
                    break;

                case "language":
                    recordText += "\r\nLA  - " + value;
                    break;
            }
        }
        var title = this.getTitle();
        if (title == "") {
            title = this.getFieldValue("Zitiervorschlag:");
        }
        for (var img of document.getElementsByTagName("img")) {
            if (img.alt == "Abkürzung Fundstelle") {
                var fundstelle = img.nextSibling.textContent.trim();

                var pattern1 = /(\w+)\s(\d+),\s(\d+)(-\d+)*/;
                var pattern2 = /(\w+)\s(\w+)\s(\d+),\s(\d+)(-\d+)*/;
                if (pattern1.test(fundstelle)) {
                    var match = pattern1.exec(fundstelle);
                    recordText += "\r\nJF  - " + match[1];
                    if (match[2] > 1800) {
                        recordText += "\r\nPY  - " + match[2];
                    }
                    else {
                        recordText += "\r\nVL  - " + match[2];
                    }
                    recordText += "\r\nSP  - " + match[3];
                    if (match[4] !== undefined) {
                        recordText += "\r\nEP  - " + match[4];
                    }
                }
                else if (pattern2.test(fundstelle)) {
                    var match = pattern2.exec(fundstelle);
                    recordText += "\r\nJF  - " + match[1];
                    recordText += "\r\nVL  - " + match[2];
                    if (match[3] > 1800) {
                        recordText += "\r\nPY  - " + match[3];
                    }
                    recordText += "\r\nSP  - " + match[4];
                    if (match[5] !== null) {
                        recordText += "\r\nEP  - " + match[5];
                    }
                }
                else {
                    recordText += "\r\nJF  - " + fundstelle;
                }
                var tilteSupplement = img.parentNode.innerText.trim();
                tilteSupplement = tilteSupplement.substring(fundstelle.length).trim();
                recordText += "\r\nT5 - " + tilteSupplement.replace(/\n/g, ";");
                break;
            }
            
        }

        var ecli = this.getFieldValue("ECLI:");
        if (ecli != "") {
            recordText += "\r\nN8  - " + ecli;
        }
        recordText += "\r\nT1  - " + title;
        return recordText;
    }

    JurisImport.prototype.importSTAT = function (fields) {
        var recordText = "";

        recordText += "\r\nTY  - STAT";

        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            var value = field.Value;
            switch (field.Name) {

                case "creator":
                    recordText += "\r\nAU  - " + value;
                    break;

                case "date":
                    var date = value.split('-');
                    recordText += "\r\nY2  - " + date[2] + "." + date[1] + "." + date[0];
                    break;

                case "description":
                    break;

                case "rft_id": //URL
                    //recordText += "\r\nL1  - " + value;
                    break;

                case "language":
                    recordText += "\r\nLA  - " + value;
                    break;
            }
        }

        var title = this.getTitle();
        if (title == "") {
            title = this.getFieldValue2("Zitiervorschlag:");
        }
        if (title == "") {
            title = this.getFieldValue2("juris-Abkürzung:");
        }
        if (title == "") {
            title = this.getFieldValue2("Amtliche Abkürzung:");
        }
        recordText += "\r\nT1  - " + title;
        recordText += "\r\nY3  - " + this.getFieldValue2("Fassung vom:"); //Fassung
        recordText += "\r\nN6  - " + this.getFieldValue2("FNA:"); //Fundstellennachweis
        recordText += "\r\nT2  - " + this.getFieldValue2("Amtliche Abkürzung:"); //Abkürzung
        recordText += "\r\nT2  - " + this.getFieldValue2("juris-Abkürzung:"); //Abkürzung
        recordText += "\r\nT2  - " + this.getFieldValue2("Vorschrift:"); //Abkürzung
        recordText += "\r\nAU  - " + this.getFieldValue2("Normgeber:"); //Normgeber

        

        return recordText;
    };

    JurisImport.prototype.importArticle = function (fields) {
        var recordText = "";
        // Ausgewählte Fragen des Medien- und Persönlichkeitsrechts im Lichte der aktuellen Rechtsprechung des VI. Zivilsenats
        recordText += "\r\nTY  - JOUR";

        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            var value = field.Value;
            switch (field.Name) {

                case "date":
                    recordText += "\r\nY1  - " + value;
                    break;

                case "rft_id": //URL
                    //recordText += "\r\nL1  - " + value;
                    break;

                case "language":
                    recordText += "\r\nLA  - " + value;
                    break;

                case "title":
                    recordText += "\r\nT2  - " + value;
                    break;

                case "atitle":
                    recordText += "\r\nT1  - " + value;
                    break;

                case "stitle":
                    recordText += "\r\nJA  - " + value;
                    break;

                case "au":
                    recordText += "\r\nAU  - " + value;
                    break;

                case "spage":
                    recordText += "\r\nSP  - " + value;
                    break;

                case "epage":
                    recordText += "\r\nEP  - " + value;
                    break;
            }
        }

        return recordText;
    }

    JurisImport.prototype.importBook = function (fields) {
        var recordText = "";
        // Ausgewählte Fragen des Medien- und Persönlichkeitsrechts im Lichte der aktuellen Rechtsprechung des VI. Zivilsenats
        recordText += "\r\nTY  - Book";
        var hasTitle = false;
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            var value = field.Value;
            switch (field.Name) {

                case "date":
                    recordText += "\r\nY1  - " + value;
                    break;

                case "rft_id": //URL
                    //recordText += "\r\nL1  - " + value;
                    break;

                case "language":
                    recordText += "\r\nLA  - " + value;
                    break;

                case "btitle":
                    recordText += "\r\nT1  - " + value;
                    hasTitle = true;
                    break;

                case "au":
                    recordText += "\r\nAU  - " + value;
                    break;

                case "pub":
                    recordText += "\r\nCY  - " + value;
                    break;

                case "edition":
                    recordText += "\r\nET  - " + value;
                    break;
            }
        }

        if (!hasTitle) {
            var title = this.getTitle();
            recordText += "\r\nT1  - " + title;
        }

        return recordText;
    }
}


if (typeof hunters !== 'undefined') {
    hunters.add(hunter);
}



