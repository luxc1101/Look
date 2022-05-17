var hunter = new function () {
    this.fileName = "newspapers.js";
    this.name = "Newspapers";
    this.id = "8E82CD90-6AB3-47C2-B6EB-DD6D33F81E01";
    this.importFormat = "1bdc9da0-328c-4cdf-96de-b9fe2eaef9da";
    this.priority = 11;
    this.newspaperType = "";

    this.identifyUrl = function (url) {
        //if (url.indexOf("aljazeera.com") != -1) {
        //    this.newspaperType = "aljazeera";
        //    return true;
        //}
        if (url.indexOf("bbc.com/news") != -1) {
            this.newspaperType = "bbc";
            return true;
        }
        if (url.indexOf("nytimes.com") != -1) {
            this.newspaperType = "nytimes";
            return true;
        }
        if (url.indexOf("reuters.com") != -1) {
            this.newspaperType = "reuters";
            return true;
        }
        if (url.indexOf("theguardian.com") != -1) {
            this.newspaperType = "theguardian";
            return true;
        }
        if (url.indexOf("washingtonpost.com") != -1) {
            this.newspaperType = "washingtonpost";
            return true;
        }
        return false;
    };

    this.identify = function () {
        this.identifyUrl(document.URL);
        switch (this.newspaperType) {
            case "aljazeera":
                {
                    var ldJson = this.getLdJson();
                    if (ldJson == null) return 0;
                    if (ldJson["@type"] !== "Article" &&
                        ldJson["@type"] !== "NewsArticle") return 0;
                    return 1;
                }
                break;
            case "bbc":
                {
                    var ldJson = this.getLdJson();
                    if (ldJson == null) return 0;
                    var type = ldJson["@type"];
                    if (type && type.indexOf("Article") != -1) {
                        return 1;
                    }
                }
                break;
            case "nytimes":
                {
                    var authors = document.querySelector("meta[data-rh=\"true\"][name='byl']");
                    if (authors) {
                        return 1;
                    }
                }
                break;
            case "reuters":
                {
                    var pubtime = document.querySelector("meta[property='og:article:published_time']");
                    if (pubtime) {
                        return 1;
                    }
                }
                break;

            case "theguardian":
                {
                    var pubtime = document.querySelector("meta[property='article:published_time']");
                    if (pubtime) {
                        return 1;
                    }
                }
                break;
            case "washingtonpost":
                {
                    var ldJson = this.getLdJson();
                    if (ldJson == null) return 0;
                    var type = ldJson["@type"];
                    if (type && type.indexOf("Article") != -1) {
                        return 1;
                    }
                }
                break;
        }
        return 0;
    };

    this.getLdJson = function () {
        var ldJsons = this.getLdJsons();
        if (ldJsons === null) return null;
        for (var ldJson of ldJsons) {
            var type = ldJson["@type"];
            if (type && type.indexOf("Article") != -1) {
                return ldJson;
            }
            if (type && type.indexOf("NewsArticle") != -1) {
                return ldJson;
            }
        }
        return null;
    }
    this.getLdJsons = function () {
        var ldJsons = document.querySelectorAll("script[type='application/ld+json']");
        var result = [];
        if (ldJsons) {
            for (var ldJson of ldJsons) {
                result.push(JSON.parse(ldJson.innerHTML));
            }
        }
        return result;
    }

    this.scanAsync = async function (info) {
        var records = [];
        try {
            this.identifyUrl(document.URL);
            var record = "TY  - NEWS\r\n";
            switch (this.newspaperType) {
                case "aljazeera":
                    {
                        var ldJson = this.getLdJson();
                        if (ldJson) {
                            var pubtime = ldJson.datePublished;
                            if (pubtime) {
                                record += `DA  - ${new Date(pubtime).toLocaleDateString()}\r\n`;
                            }
                            if (ldJson.author && ldJson.author["@type"] === "Person") {
                                var au = ldJson.author.name;
                                var firstName = au.split(' ')[0];
                                var lastName = au.split(' ')[1];
                                record += `AU  - ${lastName}, ${firstName}\r\n`;
                            }
                        }
                        
                        var title = document.querySelector("meta[property='og:title']");
                        if (title) {
                            record += `TI  - ${title.content.replace(" | NZZ", "")}\r\n`;
                        }
                        var abstract = document.querySelector("meta[name='description']");
                        if (abstract) {
                            record += `AB  - ${abstract.content}\r\n`;
                        }
                        var cover = document.querySelector("meta[name='twitter:image']");
                        if (cover) {
                            record += `QX  - ${cover.content}\r\n`;
                        }
                        
                        var keywords = document.querySelector("meta[name='news_keywords']");
                        if (keywords) {
                            record += `KW  - ${keywords.content.replace(",", ";")}\r\n`;
                        }
                        record += "JF  - Al Jazeera\r\n";
                    }
                    break;
                case "bbc":
                    {
                        var ldJson = this.getLdJson();
                        if (ldJson) {
                            var pubtime = ldJson.datePublished;
                            if (pubtime) {
                                record += `DA  - ${new Date(pubtime).toLocaleDateString()}\r\n`;
                            }
                        }
                        var title = document.querySelector("meta[property='og:title']");
                        if (title) {
                            record += `TI  - ${title.content}\r\n`;
                        }
                        var abstract = document.querySelector("meta[name='description']");
                        if (abstract) {
                            record += `AB  - ${abstract.content}\r\n`;
                        }
                        var cover = document.querySelector("meta[name='twitter:image:src']");
                        if (cover) {
                            record += `QX  - ${cover.content}\r\n`;
                        }

                        var keywords = document.querySelector("meta[property='article:section']");
                        if (keywords) {
                            record += `KW  - ${keywords.content.replace(",", ";")}\r\n`;
                        }
                        record += "JF  - BBC News\r\n";
                    }
                    break;
                case "nytimes":
                    {
                        var authors = document.querySelector("meta[data-rh=\"true\"][name='byl']");
                        if (authors) {
                            for (var au of authors.content.replace("By ", "").replace(" and ", ";").split(";")) {
                                if (au.indexOf("The ") != -1) {
                                    record += `AU  - ${au}\r\n`;
                                }
                                else {
                                    var firstName = au.split(' ')[0];
                                    var lastName = au.split(' ')[1];
                                    record += `AU  - ${lastName}, ${firstName}\r\n`;
                                }
                            }
                        }
                        else {
                            return 0;
                        }

                        var abstract = document.querySelector("meta[data-rh=\"true\"][property='og:description']");
                        if (abstract) {
                            record += `AB  - ${abstract.content}\r\n`;
                        }
                        var pubdate = document.querySelector("meta[data-rh=\"true\"][name='pdate']");
                        if (pubdate) {
                            var year = pubdate.content.substring(0, 4);
                            var month = pubdate.content.substring(4, 6);
                            var day = pubdate.content.substring(6, 8);
                            var date = new Date(year, month - 1, day);
                            record += `DA  - ${date.toLocaleDateString()}\r\n`;
                        }
                        var cover = document.querySelector("meta[data-rh=\"true\"][property='twitter:image']");
                        if (cover) {
                            record += `QX  - ${cover.content}\r\n`;
                        }
                        var keywords = document.querySelector("meta[data-rh=\"true\"][name='news_keywords']");
                        if (keywords) {
                            record += `KW  - ${keywords.content.replace(",", ";")}\r\n`;
                        }
                        record += `TI  - ${document.title.replace(" - The New York Times", "")}\r\n`;
                        record += "JF  - The New York Times\r\n";
                        record += "SN  - 1553-8095\r\n";
                    }
                    break;
                case "reuters":
                    {
                        var pubtime = document.querySelector("meta[property='og:article:published_time']");
                        if (pubtime) {
                            record += `DA  - ${new Date(pubtime.content).toLocaleDateString()}\r\n`;
                        }
                        var title = document.querySelector("meta[property='og:title']");
                        if (title) {
                            record += `TI  - ${title.content}\r\n`;
                        }
                        var abstract = document.querySelector("meta[name='description']");
                        if (abstract) {
                            record += `AB  - ${abstract.content}\r\n`;
                        }
                        var cover = document.querySelector("meta[property='og:image']");
                        if (cover) {
                            record += `QX  - ${cover.content}\r\n`;
                        }
                        for (var author of document.querySelectorAll("meta[property='og:article:author']")) {
                            var firstName = author.content.split(' ')[0];
                            var lastName = author.content.split(' ')[1];
                            record += `AU  - ${lastName}, ${firstName}\r\n`;
                        }
                        var keywords = document.querySelector("meta[name='keywords']");
                        if (keywords) {
                            record += `KW  - ${keywords.content.replace(",", ";")}\r\n`;
                        }
                        record += "JF  - Reuters Media\r\n";
                    }
                    break;
                case "theguardian":
                    {
                        var pubtime = document.querySelector("meta[property='article:published_time']");
                        if (pubtime) {
                            record += `DA  - ${new Date(pubtime.content).toLocaleDateString()}\r\n`;
                        }
                        var modtime = document.querySelector("meta[property='article:modified_time']");
                        if (modtime) {
                            record += `Y2  - ${new Date(modtime.content).toLocaleDateString()}\r\n`;
                        }
                        var title = document.querySelector("meta[property='og:title']");
                        if (title) {
                            record += `TI  - ${title.content}\r\n`;
                        }
                        var abstract = document.querySelector("meta[name='description']");
                        if (abstract) {
                            record += `AB  - ${abstract.content}\r\n`;
                        }
                        var cover = document.querySelector("meta[name='twitter:image']");
                        if (cover) {
                            record += `QX  - ${cover.content}\r\n`;
                        }
                        for (var author of document.querySelectorAll("meta[name='author']")) {
                            var firstName = author.content.split(' ')[0];
                            var lastName = author.content.split(' ')[1];
                            record += `AU  - ${lastName}, ${firstName}\r\n`;
                        }
                        var keywords = document.querySelector("meta[name='keywords']");
                        if (keywords) {
                            record += `KW  - ${keywords.content.replace(",", ";")}\r\n`;
                        }
                        record += "JF  - The Guardian\r\n";
                    }
                    break;
                case "washingtonpost":
                    {
                        var ldJson = this.getLdJson();
                        if (ldJson) {
                            var pubtime = ldJson.datePublished;
                            if (pubtime) {
                                record += `DA  - ${new Date(pubtime).toLocaleDateString()}\r\n`;
                            }
                            if (ldJson.description) {
                                record += `AB  - ${ldJson.description}\r\n`;
                            }
                            if (ldJson.headline) {
                                record += `TI  - ${ldJson.headline}\r\n`;
                            }
                            if (ldJson.image && ldJson.image.length > 0) {
                                record += `QX  - ${ldJson.image[0]}\r\n`;
                            }
                        }
                        var authors = document.querySelectorAll("div[data-authorname]");
                        
                        for (var au of authors) {
                            var name = au.attributes.getNamedItem("data-authorname").value;
                            var firstName = name.split(' ')[0];
                            var lastName = name.split(' ')[1];
                            record += `AU  - ${lastName}, ${firstName}\r\n`;
                        }
                        var keywords = document.querySelector("meta[name='news_keywords']");
                        
                        if (keywords) {
                            record += `KW  - ${keywords.content.replace(",", ";")}\r\n`;
                        }
                        record += "JF  - The Washington Post\r\n";
                    }
                    break;
            }

            if (this.supportsWebPageAsPdf(document.URL)) {
                record += "QW  - " + document.URL + "\r\n";
            }
            record += `UR  - ${document.URL}\r\n`;
            record += `Y3  - ${new Date().toLocaleDateString()}\r\n`;

            records.push(record);
        }
        catch (e) {
            console.warn(e);
        }
        return records;
    };

    this.supportsWebPageAsPdf = function (url) {

        if (url.indexOf("bbc.com/news") != -1) {
            return true;
        }
        if (url.indexOf("washingtonpost.com") != -1) {
            return true;
        }
        if (url.indexOf("nytimes.com") != -1) {
            return true;
        }
        if (url.indexOf("theguardian.com") != -1) {
            return true;
        }
        if (url.indexOf("reuters.com") != -1) {
            return true;
        }
        return false;
    };
};
if (typeof hunters !== 'undefined') {
    hunters.add(hunter);
}




