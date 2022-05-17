class _PDFDocSettings {
    constructor() {
        this.margin_left = 30;
        this.margin_right = 30;
        this.margin_top = 25;
        this.margin_bottom = 25;

        this.width = 595.28;
        this.fontSize = 14;
        this.paragraph_height = 30;
        this.height = 841.89;

        this.textcolor = "#000000";
        this.linkcolor = "#0068CC";
        this.headerLineColor = "#00539f";

        this.imageAltColor = "#6e6e7e";
        this.imageAltFontSize = 10;

        this.listBullet = '\u2022';
        this.listMarginBottom = 20;
    }

    get height_page() {
        return this.height - this.margin_top - this.margin_bottom;
    }

    get width_page() {
        return this.width - this.margin_left - this.margin_right;
    }
}
const PDFDocSettings = new _PDFDocSettings();

class _PDFInfo {
    constructor() {
        this.images = [];
    }
}
const PDFInfo = new _PDFInfo();

class Html2Pdf {

    //http://raw.githack.com/MrRio/jsPDF/master/docs/
    //https://github.com/MrRio/jsPDF/blob/master/examples/js/basic.js
    constructor() {
        this.url = "";
        this.domain;
        this.reference = null;
        this.pdf = new jsPDF('p', 'pt', [PDFDocSettings.width, PDFDocSettings.height]);

        this.y = PDFDocSettings.margin_top * 2;

        try {
            var fonts = [RobotoRegularNormal, RobotoRegularItalic, RobotoRegularBold, RobotoRegularBoldItalic];
            for (var font of fonts) {
                telemetry.log("add font to pdf: " + font.name);
                this.pdf.addFileToVFS(font.name + ".ttf", font.base64);
                this.pdf.addFont(font.name + ".ttf", font.name, font.style);
            }
            var fontlist = this.pdf.getFontList();
            telemetry.log(fontlist);
            this.pdf.setFont(RobotoRegularItalic.name);
        }
        catch (e) {
            telemetry.error(e);
        }
    }

    addImage(run) {
        if (isNullOrEmpty(run.image.base64)) {
            return;
        }
        try {
            var image_x = (PDFDocSettings.width_page - run.image.width) / 2;

            if (image_x < 0) {
                image_x = PDFDocSettings.margin_left;
                var ratio = PDFDocSettings.width_page / run.image.width;
                run.image.width = PDFDocSettings.width_page;
                run.image.height = run.image.height * ratio;
            }

            if (this.y > PDFDocSettings.margin_top + PDFDocSettings.fontSize) {
                //Imgs näher an previous element
                this.y -= PDFDocSettings.paragraph_height / 2 + 2;
            }

            if (this.y + run.image.height > PDFDocSettings.height_page) {
                this.addPage();
            }

            this.pdf.addImage(run.image.base64, run.image.type, image_x, this.y, run.image.width, run.image.height, "", "NONE");
            this.y += run.image.height;
            if (!isNullOrUndefined(run.image.alt) &&
                !isNullOrEmpty(run.image.alt)) {
                var image_alt_run = new PdfRun(this.pdf);
                image_alt_run.fontSize = PDFDocSettings.imageAltFontSize;
                image_alt_run.appendText(run.image.alt);
                image_alt_run.setTextColor(PDFDocSettings.imageAltColor);
                this.addLine(PDFDocSettings.fontSize);
                this.addText(image_alt_run);
            }
            this.addParagraph();
        }
        catch (e) {
            console.error(e);
        }
        run.reset();
    }

    addText(r) {

        if (r.runs.length === 0) {
            return;
        }

        if (r.isHeader) {
            this.addLine(r.fontSize);
        }

        var x = PDFDocSettings.margin_left + r.margin_left;
        this.pdf.setFontSize(r.fontSize);

        for (var run of r.runs) {
            try {

                if (run.isNewLine) {
                    this.addLine(run.fontSize);
                    x = PDFDocSettings.margin_left + run.margin_left;
                }

                if (run.italic && run.bold) {
                    this.pdf.setFontType("bolditalic");
                }
                else if (run.italic) {
                    this.pdf.setFontType("italic");
                }
                else if (run.bold) {
                    this.pdf.setFontType("bold");
                }
                else {
                    this.pdf.setFontType("normal");
                }

                var text_w = this.pdf.getTextWidth(run.text);


                if (text_w + x >= PDFDocSettings.width_page) {
                    this.addLine(run.fontSize);
                    x = PDFDocSettings.margin_left + run.margin_left;
                }

                this.pdf.setTextColor(run.textcolor);

                if (!isNullOrEmpty(run.text_url)) {
                    this.pdf.textWithLink(run.text, x, this.y, { url: run.text_url });
                    x += this.pdf.getTextWidth(run.text);
                }
                else {

                    this.pdf.text(x, this.y, run.text);
                    x += this.pdf.getTextWidth(run.text);
                }

                if (run.addWhitespace) {
                    this.pdf.text(x, this.y, " ");
                    x += this.pdf.getTextWidth(" ");
                }
            }
            catch (e) {
                telemetry.error(e, run);
                throw e;
            }
        }
        if (r.isList) {
            this.addLine(PDFDocSettings.listMarginBottom);
        }
        else if (r.isParagraph || r.isHeader) {
            this.addParagraph();
        }

        r.reset();
    }

    async addList(ul_element) {
        for (var liElement of ul_element.getElementsByTagName("li")) {

            var li_run = new PdfRun(this.pdf);
            li_run.rootElement = ul_element;
            li_run.isList = true;
            li_run.margin_left = 20;
            await this.elementsToText(liElement, li_run);
            if (li_run.text === "") {
                //Nur Bullet - kein Text
                continue;
            }
            var bullet_run = new PdfRun(this.pdf);
            bullet_run.margin_left = 5;
            bullet_run.appendText(PDFDocSettings.listBullet);
            this.addText(bullet_run);


            this.addText(li_run);
        }
        this.addLine(2);
    }

    addLine(fontSize) {

        var line_height = fontSize + 4;
        this.y += line_height;
        if (this.y > PDFDocSettings.height_page) {
            this.addPage();
        }
    }
    addParagraph() {
        this.y += PDFDocSettings.paragraph_height;
        if (this.y > PDFDocSettings.height_page - 2 * PDFDocSettings.paragraph_height) {
            this.addPage();
        }
    }

    addPage() {
        this.pdf.addPage();
        this.y = PDFDocSettings.margin_top + PDFDocSettings.fontSize;
    }

    drawLine() {
        var x = PDFDocSettings.margin_left;
        this.pdf.line(x, this.y, PDFDocSettings.width_page + PDFDocSettings.margin_left, this.y);
    }

    async convert(title, article) {

        var html = "";
        var leadingImage = null;
        var parser = new DOMParser();

        if (article.content) {
            html = article.content;
            leadingImage = this.reference.cover;
        }
        else {
            html = article;
        }

        var htmlDoc = parser.parseFromString(html, 'text/html');

        this.cleanUpDocument(htmlDoc);

        //if (htmlDoc.getElementsByTagName("img").length > 0) {
        //    var img = htmlDoc.getElementsByTagName("img").item(0);
        //    if (img.src.indexOf("redaktion") === -1) { //Bilder von FAZ Autoren
        //        leadingImage = null;
        //    }
        //}

        if (!isNullOrEmpty(this.reference.journal) ||
            !isNullOrEmpty(this.reference.organization)) {
            this.y = PDFDocSettings.margin_top + PDFDocSettings.margin_top / 2;
            var headerRun = new PdfRun(this.pdf);
            headerRun.fontSize = 16;
            if (!isNullOrEmpty(this.reference.journal)) {
                headerRun.appendText(this.reference.journal);
            }
            else {
                headerRun.appendText(this.reference.organization);
            }

            this.addText(headerRun);
            this.pdf.setDrawColor(PDFDocSettings.headerLineColor);
            this.y += 10;
            this.drawLine();
            this.addLine(36);
        }

        var titleRun = new PdfRun(this.pdf);
        titleRun.isParagraph = true;
        titleRun.fontSize = 24;
        titleRun.appendText(title);

        this.addText(titleRun);

        this.addLine(5);

        if (!isNullOrUndefined(leadingImage) && leadingImage != "") {
            var img = document.createElement("img");
            img.src = leadingImage;
            var imgRun = new PdfRun(this.pdf);
            if (await imgRun.addImage(img)) {
                if (this.validateImage(imgRun.image.url)) {
                    this.addImage(imgRun);
                }
            }
        }

        await this.elementsToText(htmlDoc.documentElement, new PdfRun(this.pdf));

        this.setDocumentProperties();

        return this.pdf.output('arraybuffer');
    }

    cleanUpDocument(htmlDoc) {
        if (this.url.startsWith("https://www.nzz.ch")) {
            var figures = htmlDoc.getElementsByTagName("figure");
            if (figures.length > 0) {
                figures[figures.length - 1].parentNode.removeChild(figures[figures.length - 1]);
            }
        }
        else if (this.url.startsWith("https://www.tagesanzeiger.ch")) {

            var feedbackbox = htmlDoc.getElementById("feedbackBox");
            if (feedbackbox !== null) {
                feedbackbox.parentNode.removeChild(feedbackbox);
            }

            var ratebox = htmlDoc.getElementById("rateBox");
            if (ratebox !== null) {
                ratebox.parentNode.removeChild(ratebox);
            }

            var mainColRight = htmlDoc.getElementById("mainColRight");
            if (mainColRight !== null) {
                mainColRight.parentNode.removeChild(mainColRight);
            }

            var mainColBottomDiashow = htmlDoc.getElementById("mainColBottomDiashow");
            if (mainColBottomDiashow !== null) {
                mainColBottomDiashow.parentNode.removeChild(mainColBottomDiashow);
            }
        }
        else if (this.url.startsWith("https://www.faz.net")) {
            //Erste tabelle entfernen. Da stehen die Börsenkurse
            var ul = htmlDoc.getElementsByTagName("ul");
            if (ul.length > 0) {

                var ul_first = ul[0];
                var next = ul_first.nextElementSibling;
                if (next !== null && next.innerHTML.indexOf("DAX") !== -1 && next.innerHTML.indexOf("DOW JONES") !== -1) {
                    ul_first.parentNode.removeChild(ul_first);

                    if (next.nextElementSibling !== null && next.nextElementSibling.innerHTML.indexOf("ALLE KURSE") !== -1) {
                        next.nextElementSibling.parentNode.removeChild(next.nextElementSibling);
                    }
                    next.parentNode.removeChild(next);
                }
            }
            //Letztes Bild entfernen - gehört nicht zum Artikel
            var last = htmlDoc.body.lastElementChild;
            if (last != null && last.tagName === "IMG") {
                last.parentElement.removeChild(last);
            }
            //Letztes UL entfernen - Veröffentlicht/Aktualisiert: 
            last = htmlDoc.body.lastElementChild;
            if (last != null && last.tagName === "UL" && last.textContent && last.textContent.indexOf("Aktualisiert") != -1) {
                last.parentElement.removeChild(last);
            }
        }
    }

    async elementsToText(element, run) {
        for (var child of element.childNodes) {
            await this.elementToText(child, run);
        }
    }

    async elementToText(element, run) {

        if (element.tagName === "H1" || element.tagName === "H2" || element.tagName === "H3" || element.tagName === "H4") {
            if (this.validateText(element.textContent)) {
                var div_h = new PdfRun(this.pdf);
                div_h.isParagraph = true;
                div_h.isHeader = true;
                div_h.setStyle(element);
                await this.elementsToText(element, div_h);
                this.validateWhitespaces(div_h);
                this.addText(div_h);
            }
        }
        else if (element.tagName === "DIV") {
            if (this.validateText(element.textContent)) {
                var div_run = new PdfRun(this.pdf);
                div_run.isParagraph = true;
                div_run.setStyle(element);
                div_run.rootElement = element;
                await this.elementsToText(element, div_run);
                this.validateWhitespaces(div_run);
                this.addText(div_run);
            }
        }
        else if (element.tagName === "P" || element.tagName === "BR") {
            
            if (this.validateText(element.textContent)) {
                var div_p = new PdfRun(this.pdf);
                div_p.setStyle(element);
                div_p.rootElement = element;
                await this.elementsToText(element, div_p);
                this.validateWhitespaces(div_p);
                div_p.isParagraph = true;

                if (element.tagName === "BR" && div_p.runs.length === 0) {
                    var div_run = new PdfRun(this.pdf);
                    div_run.isNewLine = true;
                    run.runs.push(div_run);
                }

                this.addText(div_p);
                
            }
        }
        else if (element.tagName === "UL") {
            if (this.validateText(element.textContent)) {
                await this.addList(element);
            }
        }
        else if (element.nodeType === NodeType.TEXT_NODE) {
            run.setStyle(element);
            run.appendText(element);
        }
        else if (element.tagName === "FIGURE") {
            //https://www.nzz.ch/schweiz/die-neuen-erobern-das-bundeshaus-aber-wo-ist-bloss-die-dusche-ld.1525872
            //Wg. Img-Alt Attribute vs Custom Caption in Figure-Tag
            for (var img of element.querySelectorAll("img, picture")) {
                await this.elementToText(img, run);
            }
        }
        else if (element.tagName === "IMG" ||
                 element.tagName === "PICTURE") {
            if (await run.addImage(element)) {
                if (this.validateImage(run.image.url)) {
                    this.addImage(run);
                }
            }
        }
        else if (element.tagName === "BUTTON"){
            return;
        }
        else {
            await this.elementsToText(element, run);
        }
    }

    async saveWebPageAsPdf(tab, asBase64, reference) {
        this.reference = reference;
        this.url = tab.url;
        this.domain = new URL(this.url).host;
        telemetry.log("saveWebPageAsPdf domain: " + this.domain);
        return new Promise(async resolve => {
            try {
                chrome.tabs.executeScript(tab.id, { file: "pdf/readability/Readability.js" }, (r1) => {
                    if (chrome.runtime.lastError != null) {
                        resolve(null);
                        return;
                    }
                    var code = "var documentClone = document.cloneNode(true);"
                    code += "var article = new Readability(documentClone).parse();";
                    code += "article.head = document.head;";
                    code += "JSON.stringify(article);";

                    if (chrome.runtime.lastError != null) {
                        telemetry.error(chrome.runtime.lastError);
                        resolve(null);
                        return;
                    }
                    telemetry.log("Parse document");
                    chrome.tabs.executeScript(tab.id, { code: code }, async (r2) => {
                        if (chrome.runtime.lastError != null) {
                            telemetry.error(chrome.runtime.lastError);
                            resolve(null);
                            return;
                        }
                        telemetry.log("Document parsed");
                        try {
                            var res = JSON.parse(r2[0]);
                            var title = res.title;

                            telemetry.log("create pdf from artice: " + title);
                            var arrayBuffer = await this.convert(title, res);
                            telemetry.log("done");
                            var bytes = new Uint8Array(arrayBuffer);
                            if (asBase64) {
                                var i = bytes.length;
                                var binaryString = new Array(i);
                                while (i--) {
                                    binaryString[i] = String.fromCharCode(bytes[i]);
                                }
                                var data = binaryString.join('');
                                var base64 = window.btoa(data);
                                resolve(base64);
                            }
                            else {
                                resolve(Array.from(bytes));
                            }

                        }
                        catch (e) {
                            telemetry.error(e);
                            resolve(null);
                        }
                    });
                });
            }
            catch (e) {
                telemetry.error(e);
                resolve(null);
            }
        });
    }

    setDocumentProperties() {
        try {
            var props = {};
            
            props.creator = 'Citavi Picker ' + runtimeInfo.pickerVersion;
            if (this.reference != null) {
                if (this.reference.title != "") {
                    props.title = this.reference.title;
                }
                if (this.reference.authors !== "") {
                    props.author = this.reference.authors;
                }
                if (this.reference.keywords !== "") {
                    props.keywords = this.reference.keywords;
                }
            }
            this.pdf.setProperties(props);
        }
        catch (e) {
            telemetry.error(e);
        }
    }

    validateImage(url) {
        if (url) {
            if (this.domain.indexOf("nytimes.com") != -1) {
                if (url.indexOf("-thumbLarge-v2.png") != -1) {
                    //https://www.nytimes.com/2019/10/02/us/politics/impeachment-white-house-subpoena.html?action=click&module=Top%20Stories&pgtype=Homepage
                    telemetry.log("skip url: " + url);
                    return false;
                }
            }
            if (url.indexOf("https://specials.pcwelt.de/") !== -1) {
                return false;
            }
        }

        return true;
    }

    validateText(text) {
        if (text) {

            var trimmed = text.trim();

            if (trimmed === "WERBUNG") return false;
            if (trimmed === "Anzeige") return false;
            if (trimmed === "ANZEIGE") return false;
            if (trimmed === "X") return false;
            if (trimmed === "Print this Page") return false;
            if (trimmed === "/") return false;
            if (trimmed === ":") return false;
            if (trimmed === ",") return false; //https://www.golem.de/news/nest-wenn-das-smart-home-zum-horrorhaus-wird-1909-144122.html

            if (this.domain.indexOf("handelsblatt") != -1) {
                if (trimmed === "Themen des Artikels") {
                    return false;
                }
                if (trimmed === "rtr") {
                    return false;
                }
            }
            if (this.domain.indexOf("nzz") != -1) {
                if (trimmed === "Hören") {
                    return false;
                }
                if (trimmed === "Denken") {
                    return false;
                }
                if (trimmed === "Sehen") {
                    return false;
                }
                if (trimmed === "Merken") {
                    return false;
                }
                if (trimmed === "Aktualisiert") {
                    return false;
                }
                if (trimmed === "Drucken") {
                    return false;
                }
                if (trimmed === "Teilen") {
                    return false;
                }
            }
            if (this.domain.indexOf("golem.de") != -1) {
                if (trimmed === "Artikel") {
                    return false;
                }
                if (trimmed === "veröffentlicht am") {
                    return false;
                }
                if (trimmed === "Stellenmarkt") {
                    return false;
                }
            }
            if (this.domain.indexOf("nytimes.com") != -1) {
                if (trimmed === "Advertisement") {
                    return false;
                }
                if (trimmed === "Image") {
                    return false;
                }
                if (trimmed === "Unlock more free articles.") {
                    return false;
                }
                if (trimmed === "Related coverage") {
                    return false;
                }
            }
        }

        return true;
    }

    validateWhitespaces(pdfRun) {
        //https://stackoverflow.com/questions/1425830/definition-of-html-whitespace-rules
        try {
            for (var i = 0; i < pdfRun.runs.length; i++) {
                var run = pdfRun.runs[i];
                if (!run.addWhitespace && run.text === '' && !run.isNewLine) {
                    pdfRun.runs.splice(i, 1);
                    i--;
                }
            }
            for (var i = 0; i < pdfRun.runs.length; i++) {
                var run = pdfRun.runs[i];
                if (i === 0 && run.text.startsWith(' ')) {
                    run.text = run.text.substr(1);
                }
                else if (i !== pdfRun.runs.length - 1) {
                    if (isNullOrUndefined(run.rootElement)) {
                        continue;
                    }

                    //if (run.text_url != "" &&
                    //    !run.text.endsWith(' ') &&
                    //    !run.addWhitespace &&
                    //    /^\w/.test(pdfRun.runs[i + 1].text)) {
                    //    pdfRun.runs[i + 1].text = ' ' + pdfRun.runs[i + 1].text;
                    //}
                }
            }
        }
        catch (e) {
            telemetry.error(e);
        }
    }
}

class PdfRun {
    constructor(pdf) {
        this.text = "";
        this.image = {};
        this.isHeader = false;
        this.isParagraph = false;
        this.fontSize = PDFDocSettings.fontSize;
        this.text_url = "";
        this.runs = [];
        this.pdf = pdf;
        this.italic = false;
        this.bold = false;
        this.isNewLine = false;
        this.textcolor = PDFDocSettings.textcolor;
        this.rootElement = null;
        this.isList = false;
        this.margin_left = 0;
        this.reset();
    }

    appendText(element) {
        var innerText = "";
        var addWhitespace_end = false;
        var addWhitespace_start = false;
        if (element.nodeValue) {
            innerText = element.nodeValue;

            innerText = innerText.replace(/\t+$/g, "");
            innerText = innerText.replace(/^\t+/g, "");
            innerText = innerText.replace(/(\r|\n)\t+/g, " ");
            innerText = innerText.replace(/\s+/g, " ");

            if (innerText.startsWith(" ")) {
                addWhitespace_start = true;
            }

            if (innerText.endsWith(" ") || innerText.endsWith(" \r") || innerText.endsWith(" \n")) {
                addWhitespace_end = true;
            }

            if (innerText.trim().length === 0 && (innerText.indexOf("\r") != -1 || innerText.indexOf("\n") != -1)) {
                if (this.text === "") {
                    return;
                }
                innerText = "";
                addWhitespace_start = false;
                addWhitespace_end = true;
                return;
            }
            else {
                innerText = innerText.trim();
                if (isNullOrEmpty(innerText)) {
                    return;
                }
            }
        }
        else {
            innerText = element;
        }

        var italic = false;
        var bold = false;
        var textcolor = PDFDocSettings.textcolor;
        var text_url = "";

        if (!isNullOrUndefined(element.parentElement)) {
            if (element.parentElement.tagName === "A" ||
                element.parentElement.parentElement.tagName === "A") {
                text_url = element.parentElement.parentElement.href;
                textcolor = PDFDocSettings.linkcolor;
            }
            if (element.parentElement.tagName === "I") {
                italic = true;
            }
            if (element.parentElement.tagName === "BUTTON") {
                return;
            }
            if (element.parentElement.tagName === "B" ||
                element.parentElement.tagName === "STRONG") {
                bold = true;
            }
            if (this.rootElement !== null &&
                this.rootElement.tagName === "DIV" &&
                (element.parentElement.tagName === "SPAN" ||
                 element.parentElement.tagName === "TIME")) {
                addWhitespace_end = true;
            }
        }

        if (addWhitespace_start) {
            innerText = " " + innerText;
        }
        if (addWhitespace_end) {
            innerText += " ";
        }

        innerText = this.cleanText(innerText);

        this.pdf.setFontSize(this.fontSize);
        var words = innerText.split(' ');
        var words_count = words.length;

        for (var i = 0; i < words_count; i++) {
            var word = words[i];

            if (i < words_count - 1) {
                word += ' ';
            }

            var textRuns = this.pdf.splitTextToSize(word, PDFDocSettings.width_page);
            for (var textRun of textRuns) {
                var run = new PdfRun();
                run.text = textRun;
                run.text_url = text_url;
                run.fontSize = this.fontSize;
                run.italic = italic;
                run.bold = bold;
                run.textcolor = textcolor;
                run.isList = this.isList;
                run.margin_left = this.margin_left;
                this.runs.push(run);
            }
        }

        this.text += innerText;
    }

    async addImage(element) {
        var run = new PdfRun();
        try {
            var caption = "";

            if (element.parentElement) {
                //null bei leadingimage
                caption = element.parentElement.getElementsByTagName("figcaption");

                if (caption.length === 1) {
                    this.image.alt = caption[0].innerText;
                    this.image.alt = this.image.alt.replace(/\r|\n/g, " ");
                    this.image.alt = this.image.alt.replace(/\s+/g, " ");
                }
                else {
                    this.image.alt = element.alt;
                }

                if (element.tagName === "PICTURE") {
                    var source = element.getElementsByTagName("source");
                    if (source.length > 0) {
                        source = source[0];
                    }
                    else {
                        source = null;
                    }
                    if (source === null || isNullOrUndefined(source.srcset)) {
                        element = element.getElementsByTagName("img");
                        if (element.length > 0) {
                            element = element[0];
                        }
                        else {
                            element = null;
                        }
                        if (element === null) {
                            telemetry.log("image element not found");
                            return;
                        }
                    }
                    else {
                        element = source;
                    }
                }
            }

            var url = element.src;
            if (element.srcset || element.hasAttribute("data-srcset")) {
                //https://www.nzz.ch/schweiz/die-neuen-erobern-das-bundeshaus-aber-wo-ist-bloss-die-dusche-ld.1525872
                var sets;
                if (element.srcset) {
                    sets = element.srcset.split(',');
                }
                if (element.hasAttribute("data-srcset")) {
                    sets = element.getAttribute("data-srcset").split(',');
                }
                for (var src of sets) {
                    src = src.trim();
                    if (src.split(' ').length === 1) {
                        url = src.trim();
                    }
                    else {
                        var src_url = src.split(' ')[0].trim();
                        var src_w = src.split(' ')[1].trim().replace("w", "");
                        url = src_url;
                    }
                }
            }
            if (isNullOrUndefined("url")) {
                telemetry.log("image url is empty");
                telemetry.log(element);
                return false;
            }

            if (PDFInfo.images.indexOf(url) !== -1) {
                return null;
            }

            PDFInfo.images.push(url);
            var response = await fetch(url);
            if (!response.ok) {
                telemetry.warn("download image failed", { url: url, error: response.status });
                return false;
            }
            var buffer = await response.arrayBuffer();
            var contenttype = response.headers.get("Content-Type");
            
            var imgType = "png";
            if (contenttype == "image/jpeg") {
                imgType = "jpeg";
            }
            else if (contenttype == "image/webp") {
                imgType = "webp";
                telemetry.log("skip webp-image");
                return false;
            }

            var binary = '';
            var bytes = [].slice.call(new Uint8Array(buffer));
            bytes.forEach((b) => binary += String.fromCharCode(b));
            var arrayBuffer = window.btoa(binary);

            this.image.base64 = 'data:image/' + imgType + ';base64,' + arrayBuffer;
            await this.setImageDimensions(this.image);
            if (this.image.width === 1 && this.image.height === 1) {
                return false;
            }
            if (this.image.width <= 20 && this.image.height <= 20) {
                return false;
            }
            telemetry.log(this.image);
            this.image.type = imgType;
            this.image.url = url;
        }
        catch (e) {
            telemetry.error(e);
            return false;
        }

        this.runs.push(run);
        return true;
    }

    async setImageDimensions(image) {
        return new Promise(resolve => {
            try {
                var i = new Image()
                i.onload = function () {
                    image.width = i.width;
                    image.height = i.height;
                    resolve();

                };
                i.onabort = function () {
                    image.width = 0;
                    image.height = 0;
                    resolve();
                }
                i.onerror = function () {
                    image.width = 0;
                    image.height = 0;
                    resolve();
                };
                i.src = image.base64;
            }
            catch (e) {
                telemetry.error(e);
                image.width = 0;
                image.height = 0;
                resolve();
            }

        });
    }

    setTextColor(color) {
        this.textcolor = color;
        for (var run of this.runs) {
            run.textcolor = color;
        }
    }

    setStyle(element) {
        //besser machen
        var name = element.tagName;

        switch (name) {
            case "H1":
                this.fontSize = 24;
                break;
            case "H2":
                this.fontSize = 22;
                break;
            case "H3":
                this.fontSize = 20;
                break;
            case "H4":
                this.fontSize = 18;
                break;
            case "H5":
                this.fontSize = 16;
                break;
            case "I":
                this.italic = true;
                break;
        }
    }

    reset() {
        this.text = "";
        this.image = {
            base64: "",
            width: 0,
            height: 0,
            type: "",
            alt: "",
            url: "",
        };
        this.isParagraph = false;
        this.isHeader = false;
        this.italic = false;
        this.bold = false;
        this.fontSize = PDFDocSettings.fontSize;
        this.text_url = "";
        this.runs.length = 0;
        this.addWhitespace = false;
        this.rootElement = null;
        this.isList = false;
        this.margin_left = 0;
        this.textcolor = PDFDocSettings.textcolor;
        this.isNewLine = false;
    }

    cleanText(text) {
        if (text) {
            text = text.replace(" | NZZ", "");
        }
        return text;
    }
}

const NodeType = {
    ELEMENT_NODE: 1,
    TEXT_NODE: 3,
    CDATA_SECTION_NODE: 4,
    PROCESSING_INSTRUCTION_NODE: 7,
    COMMENT_NODE: 8,
    DOCUMENT_NODE: 9,
    DOCUMENT_TYPE_NODE: 10,
    DOCUMENT_FRAGMENT_NODE: 11
}

