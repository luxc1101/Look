var hunter = new function () {
    this.fileName = "ldJson.js";
    this.name = "ldJson";
    this.id = "139B7385-1D76-4680-8DC8-52709524E64E";
    this.importFormat = "1bdc9da0-328c-4cdf-96de-b9fe2eaef9da";
    this.priority = 5;
    this.citaviVersion = 6;

    var REGEXPS = {
        unlikelyCandidates: /-ad-|ai2html|banner|breadcrumbs|combx|comment|community|cover-wrap|disqus|extra|footer|gdpr|header|legends|menu|related|remark|replies|rss|shoutbox|sidebar|skyscraper|social|sponsor|supplemental|ad-break|agegate|pagination|pager|popup|yom-remote/i,
        okMaybeItsACandidate: /and|article|body|column|content|main|shadow/i,
    };

    this.identifyUrl = url => true;

    this.identify = function () {
        if (this.getLdJson() != null) return 1;
        
        return 0;
    };

    this.allowWebPageJsonTags = function () {
        if (document.URL.indexOf("scholarlykitchen.sspnet.org") !== -1) {
            return true;
        }
        return false;
    }

    this.getLdJson = function () {
        try {
            var result = this.getLdJsons();

            var allowWebPageType = this.allowWebPageJsonTags();
            for (var l of result) {
                var type = l["@type"];
                if (type && type.indexOf("Article") != -1) {
                    return l;
                }
                if (type && type.indexOf("NewsArticle") != -1) {
                    return l;
                }
                if (type && type.indexOf("Dataset") != -1) {
                    return l;
                }
                if (allowWebPageType && type && type.indexOf("WebPage") != -1) {
                    return l;
                }
            }
        }
        catch (e) {
            //JSON.parse: bad control character in string literal at line
            console.error(e);
        }
        return null;
    };

    this.getLdJsons = function () {
        var ldJsons = document.querySelectorAll("script[type='application/ld+json']");

        var result = [];
        if (ldJsons) {
            for (var ldJson of ldJsons) {
                var inner = ldJson.innerHTML;
                inner = inner.replace(/\r|\n/g, "");
                var ldJson = JSON.parse(inner);
                var ldJsonItems = [];
                if (Array.isArray(ldJson)) {
                    ldJsonItems = ldJson;
                }
                else {
                    ldJsonItems.push(ldJson);
                }
                for (var item of ldJsonItems) {
                    if (item["@graph"] !== undefined && item["@graph"].length > 0) {
                        for (var graphItem of item["@graph"]) {
                            result.push(graphItem);
                        }
                    }
                    else {
                        result.push(item);
                    }
                }
            }
        }
        return result;
    }

    this.getLdJsonById = function (id) {
        try {
            var ldJsons = document.querySelectorAll("script[type='application/ld+json']");

            var result = [];
            if (ldJsons) {
                for (var ldJson of ldJsons) {
                    var ldJson = JSON.parse(ldJson.innerHTML);
                    var ldJsonItems = [];
                    if (Array.isArray(ldJson)) {
                        ldJsonItems = ldJson;
                    }
                    else {
                        ldJsonItems.push(ldJson);
                    }
                    for (var item of ldJsonItems) {
                        if (item["@graph"] !== undefined && item["@graph"].length > 0) {
                            for (var graphItem of item["@graph"]) {
                                result.push(graphItem);
                            }
                        }
                        else {
                            result.push(item);
                        }
                    }
                }
            }
            for (var l of result) {
                var ldJson_id = l["@id"];
                if (ldJson_id === id) {
                    return l;
                }
            }
        }
        catch (e) {
            //JSON.parse: bad control character in string literal at line
            //console.error(e);
        }
        return null;
    }

    this.getAbstract = function (ldJson) {
        if (ldJson.description) {
            return ldJson.description;
        }
        else {
            var abstract = document.querySelector("meta[name='description']");
            if (abstract) {
                return abstract.content;
            }
        }
        return null;
    };

    this.getAuthors = function (ldJson) {
        var persons = [];
        var personName;

        if (ldJson.creator && Array.isArray(ldJson.creator)) {
            for (var au of ldJson.creator) {
                personName = this.parsePerson(au);
                if (personName !== null) {
                    persons.push(personName);
                }
            }
            return persons;
        }

        if (ldJson.creator) {
            if (ldJson.creator["@type"] === "Person" || ldJson.creator["@type"] === undefined) {
                var au = ldJson.creator.name;
                personName = this.parsePerson(au);
                if (personName !== null) {
                    persons.push(personName);
                    return persons;
                }
            }
        }

        if (ldJson.author && Array.isArray(ldJson.author)) {
            for (var aut of ldJson.author) {
                var au = aut.name;
                if (aut["@type"] === "Person" || aut["@type"] === undefined) {
                    personName = this.parsePerson(au);
                    if (personName !== null) {
                        persons.push(personName);
                    }
                }
            }
            return persons;
        }

        if (ldJson.author) {
            if (ldJson.author["@type"] === "Person" || ldJson.author["@type"] === undefined) {
                var au = ldJson.author.name;
                personName = this.parsePerson(au);
                if (personName !== null) {
                    persons.push(personName);
                    return persons;
                }
            }
        }

        if (ldJson["@type"] != undefined && (ldJson["@type"] === "Person" || (ldJson["@type"].indexOf && ldJson["@type"].indexOf("Person") != -1))) {
            var au = ldJson.name;
            personName = this.parsePerson(au);
            if (personName !== null) {
                persons.push(personName);
            }
            return persons;
        }

        var authors = document.querySelectorAll("meta[name='author']");

        for (var author of authors) {
            var au = author.content;
            personName = this.parsePerson(au);
            if (personName !== null) {
                persons.push(personName);
            }
        }
        return persons;
    }

    this.getCover = function (ldJson) {

        var cover = document.querySelector("meta[name='twitter:image']");
        if (cover) {
            return cover.content;
        }
        cover = document.querySelector("meta[name='twitter:image:src']");
        if (cover) {
            return cover.content;
        }
        cover = document.querySelector("meta[property='og:image']");
        if (cover) {
            return cover.content;
        }
        if (ldJson.thumbnailUrl) {
            return ldJson.thumbnailUrl;
        }
        if (ldJson.image) {
            return ldJson.image.url;
        }

        return null;
    };

    this.getDatePublished = function (ldJson) {

        var pubtime = ldJson.datePublished;

        if (pubtime) {
            return this.parseDate(pubtime);
        }

        pubtime = ldJson.dateCreated;

        if (pubtime) {
            return this.parseDate(pubtime);
        }

        pubtime = document.querySelector("meta[property='article:published_time']");
        if (pubtime) {
            pubtime = pubtime.content;
            return this.parseDate(pubtime);
        }

        pubtime = document.querySelector("meta[name='date']");
        if (pubtime) {
            pubtime = pubtime.content;
            return this.parseDate(pubtime);
        }
        return null;
    };

    this.getKeywords = function (ldJson) {
        if (ldJson.keywords) {

            if (Array.isArray(ldJson.keywords)) {
                var l = [];
                for (var keyword of ldJson.keywords) {
                    l.push(keyword);
                }
                return l;
            }
            return ldJson.keywords.replace(/,/g, ";").split(';');
        }
        var keywords = document.querySelector("meta[name='news_keywords']");
        if (keywords) {
            return keywords.content.replace(/,/g, ";").split(';');
        }
        keywords = document.querySelector("meta[name='keywords']");
        if (keywords) {
            return keywords.content.replace(/,/g, ";").split(';');
        }
        return null;
    };

    this.getDateModified = function (ldJson) {

        var dateModified = ldJson.dateModified;
        if (dateModified) {
            return dateModified;
        }
        return null;
    };

    this.getNewspaperName = function (ldJson) {

        if (document.URL.indexOf("handelsblatt.com") != -1) {
            return "Handelsblatt";
        }
        if (document.URL.indexOf("nzz.ch") != -1) {
            return "Neue Zürcher Zeitung";
        }

        if (ldJson.publisher) {
            if (ldJson.publisher.name === undefined) {
                var id = ldJson.publisher["@id"];
                if (id !== undefined) {
                    var ldJson = this.getLdJsonById(id);
                    if (ldJson !== null) {
                        return this.parseNewsPaperName(ldJson.name);
                    }
                }
            }
            else {
                return this.parseNewsPaperName(ldJson.publisher.name);
            }
        }

        var name = document.querySelector("meta[name='application-name']");
        if (name) {
            return this.parseNewsPaperName(name.content);
        }
        name = document.querySelector("meta[property='al:android:app_name']");
        if (name) {
            return this.parseNewsPaperName(name.content);
        }



        return null;
    };

    this.getTitle = function (ldJson) {
        var title = null;
        if (ldJson.headline) {
            title = ldJson.headline;
        }
        else {
            var titleElement = document.querySelector("meta[property='og:title']");
            if (titleElement) {
                title = titleElement.content;
            }
        }

        if (title) {
            title = title.replace(" | NZZ", "");
        }

        return title;
    };

    this.getWebSiteOrganization = function (ldJson) {

        var ldJsons = this.getLdJsons();
        for (var ldJson of ldJsons) {
            if (ldJson["@type"] === "WebSite" &&
                ldJson["name"]) {
                return ldJson["name"];
            }
        }
        return null;
    };

    this.parseDate = function (dateString) {
        var date;
        try {
            if (dateString) {
                if (dateString.indexOf("CET") !== -1 || dateString.indexOf("CEST") !== -1) {
                    var pt = dateString.replace("CET", "").replace("CEST", "");
                    date = new Date(pt).toLocaleDateString();
                    if (date !== "Invalid Date") {
                        return date;
                    }
                    return dateString;
                }

                date = new Date(dateString).toLocaleDateString();
                if (date !== "Invalid Date") {
                    return date;
                }
            }
        }
        catch (e) {
            console.error(e);
        }
        return dateString;
    };

    this.parseNewsPaperName = function (name) {
        if (name === "ZEIT ONLINE") {
            return "Die Zeit";
        }
        return name;
    };

    this.parsePerson = function (personString) {
        try {
            var fullname = "";
            personString = personString.replace("/ AP", "");
            personString = personString.trim();
            personString = personString.replace(" and ", ";").replace(" und ", ";");

            if (document.URL.indexOf("nzz.ch") !== -1 && personString.indexOf(",") !== -1) {
                //Peter Winkler, Washington
                personString = personString.substr(0, personString.indexOf(","));
            }
            else if (document.URL.indexOf("tagesanzeiger.ch") !== -1 && personString.indexOf(",") !== -1) {
                //Silke Bigalke, Mujnak
                personString = personString.substr(0, personString.indexOf(","));
            }

            var personNames = personString.split(';');
            
            for (var p of personNames) {
                var nameParts = p.split(' ');
                var personFullName = "";
                if (nameParts.length === 2) {
                    var firstName = toTitleCase(nameParts[0]);
                    var lastName = toTitleCase(nameParts[1]);
                    personFullName = `${lastName}, ${firstName}`;
                }
                else if (nameParts.length === 3) {
                    var firstName = toTitleCase(nameParts[0]);
                    var middleName = toTitleCase(nameParts[1]);
                    var lastName = toTitleCase(nameParts[2]);
                    personFullName = `${lastName}, ${firstName} ${middleName}`;
                }
                else {
                    personFullName = p;
                }
                personFullName = personFullName.replace(",,", ",");

                if (fullname !== "") {
                    fullname += ";";
                }

                fullname += personFullName;
            }
            if (fullname === "Frankfurter Allgemeine Zeitung GmbH") {
                fullname = "Frankfurter Allgemeine Zeitung";
            }
            return fullname;
        }
        catch (e) {
            return null;
        }
    }

    this.scanAsync = async function (info) {
        var records = [];
        try {
            var record = "TY  - NEWS\r\n";
            var isNewspaper = true;
            var referenceType = ReferenceType.NewspaperArticle;
            var ldJson = this.getLdJson();
            var ldJsons = this.getLdJsons();

            if (ldJson["@type"] === "WebPage") {
                record = "TY  - WEB\r\n";
                isNewspaper = false;
                referenceType = ReferenceType.Webpage;
            }
            if (ldJson["@type"] === "Dataset") {
                record = "TY  - WEB\r\n";
                isNewspaper = false;
                referenceType = ReferenceType.Dataset;
            }

            var authors = this.getAuthors(ldJson);
            if (authors.length > 0) {
                for (var au of authors) {
                    record += `AU  - ${au}\r\n`;
                }
            }
            else {
                for (var personLdJson of ldJsons) {
                    authors = this.getAuthors(personLdJson);
                    if (authors.length > 0) {
                        for (var au of authors) {
                            record += `AU  - ${au}\r\n`;
                        }
                        break;
                    }
                }
            }

            var title = this.getTitle(ldJson);
            if (title) {
                record += `TI  - ${title}\r\n`;
            }

            var abstract = this.getAbstract(ldJson);
            if (abstract) {
                record += `AB  - ${abstract}\r\n`;
            }

            var keywords = this.getKeywords(ldJson);
            if (keywords) {
                for (var keyword of keywords) {
                    var text = keyword.trim();
                    if (text.startsWith("ISIN_")) {
                        //FAZ
                        continue;
                    }
                    record += `KW  - ${text}\r\n`;
                }
            }

            var cover = this.getCover(ldJson);
            if (cover) {
                record += `QX  - ${cover}\r\n`;
            }

            var pubtime = this.getDatePublished(ldJson);
            
            if (pubtime) {
                
                if (isNewspaper) {
                    record += `DA  - ${pubtime}\r\n`;
                }
                else {
                    record += `PY  - ${pubtime}\r\n`;
                }
            }

            if (referenceType !== ReferenceType.NewspaperArticle) {
                pubtime = this.getDateModified(ldJson);
                if (pubtime) {
                    pd = new Date(pubtime).toLocaleDateString();
                    if (pd !== "Invalid Date") {
                        record += `Y2  - ${pd}\r\n`;
                    }
                    else {
                        record += `Y2  - ${pubtime}\r\n`;
                    }
                }
                var organization = this.getWebSiteOrganization();
                if (organization !== null) {
                    record += `IN  - ${organization}\r\n`;
                }
            }

            if (referenceType === ReferenceType.NewspaperArticle) {
                var newspaper = this.getNewspaperName(ldJson);
                if (newspaper) {
                    record += `JF  - ${newspaper}\r\n`;
                }
            }

            record += `UR  - ${document.URL}\r\n`;

            if (this.citaviVersion === 5) {
                record += `Y3  - ${new Date().toLocaleDateString()}\r\n`;
            }
            else {
                record += `Y3  - ${new Date().toISOString()}\r\n`;
            }

            if (referenceType !== ReferenceType.Dataset &&
                this.supportsWebPageAsPdf(document.URL)) {
                record += "QW  - " + document.URL + "\r\n";
            }

            records.push(record);
        }
        catch (e) {
            console.warn(e);
        }
        return records;
    };

    this.supportsWebPageAsPdf = function (url) {

        if (url.indexOf("wirtschaftslexikon.gabler.de") !== -1) {
            return false; //#3676
        }

        var nodes = document.querySelectorAll("p, pre");
        var brNodes = document.querySelectorAll("div > br");

        if (brNodes.length) {
            var set = new Set(nodes);
            [].forEach.call(brNodes, function (node) {
                set.add(node.parentNode);
            });
            nodes = Array.from(set);
        }

        var score = 0;
        return [].some.call(nodes, function (node) {
            if (!isNodeVisible(node))
                return false;

            var matchString = node.className + " " + node.id;
            if (REGEXPS.unlikelyCandidates.test(matchString) &&
                !REGEXPS.okMaybeItsACandidate.test(matchString)) {
                return false;
            }

            if (node.matches("li p")) {
                return false;
            }

            var textContentLength = node.textContent.trim().length;
            if (textContentLength < 140) {
                return false;
            }

            score += Math.sqrt(textContentLength - 140);

            if (score > 20) {
                return true;
            }
            return false;
        });
    };
};
if (typeof hunters !== 'undefined') {
    hunters.add(hunter);
}




