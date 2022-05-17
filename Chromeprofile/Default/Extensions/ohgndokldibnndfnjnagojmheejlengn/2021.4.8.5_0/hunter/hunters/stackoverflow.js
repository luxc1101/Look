var hunter = new function () {
    this.fileName = "stackoverflow.js";
    this.name = "stackoverflow";
    this.id = "4B4A6D8B-9EE4-4158-9636-F897E678C7C5";
    this.importFormat = "1bdc9da0-328c-4cdf-96de-b9fe2eaef9da";
    this.priority = 10;
    this.example = "https://stackoverflow.com/questions/46515764/";
    

    this.identifyUrl = url => /https:\/\/stackoverflow.com\/questions\/\d+/.test(url);
    this.identify = function () {
        try {
            var alternateLink = document.querySelector("link[type='application/atom+xml'");
            if (alternateLink === null) return 0;

            return 1;
        }
        catch (e) {
            console.error(e);
        }
        return 0;
    };

    this.scanAsync = async function () {
        var references = [];

        try {
            var alternateLink = document.querySelector("link[type='application/atom+xml'");
            var response = await fetch(alternateLink.getAttribute("href"));
            var responseText = await response.text();
            var xml = new window.DOMParser().parseFromString(responseText, "text/xml");
            var record = "TY  - WEB\r\nUR  - " + document.URL + "\r\n";
            var entry = xml.getElementsByTagName("entry")[0];
            
            for (var childNode of entry.childNodes) {
                if (childNode.childNodes.length === 0) continue;

                var name = childNode.nodeName;
                var value = childNode.childNodes[0].nodeValue;

                switch (name) {
                    case "author":
                        record += "AU  - " + childNode.getElementsByTagName("name")[0].textContent;
                        break;

                    case "title":
                        record += "TI  - " + value;
                        break;

                    case "published":
                        record += "Y1  - " + new Date(value).getFullYear();
                        break;

                    case "updated":
                        record += "Y2  - " + new Date(value).toLocaleDateString();
                        break;

                    case "summary":
                        record += "AB  - " + value.replace(/<.+?>/g, "");
                        break;

                    default:
                        continue;
                }
                record += "\r\n";
            }

            var keywords = document.querySelectorAll("a[href^='/questions/tagged/']");
            for (var keyword of keywords) {
                record += "KW  - " + keyword.getAttribute("href").replace("/questions/tagged/", "") + "\r\n";
            }

            references.push(record);
        }
        catch (e) {
            console.error(e);
        }
        return references;
    };
}
if (typeof hunters !== 'undefined') {
    hunters.add(hunter);
}
