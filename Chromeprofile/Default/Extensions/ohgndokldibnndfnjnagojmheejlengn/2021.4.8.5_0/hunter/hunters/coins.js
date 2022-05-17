var hunter = new function () {
    this.fileName = "coins.js";
    this.name = "COInS";
    this.id = "161CA1A1-199D-4e89-8C16-C3CD163E5DED";
    this.importFormat = "coins";
    this.priority = 1;
    this.example = "https://www.worldcat.org/search?q=e-learning&qt=results_page";

    this.ignore = [
        /catalogo\.pusc\.it\/cgi-bin\/koha\/opac-detail\.pl\?biblionumber=(\d+)/,
        /www.fachportal-paedagogik.de/
    ];

    this.identifyUrl = function (url) {
        for (var pattern of this.ignore) {
            if (pattern.test(url)) return false;
        }
        return true;
    };

    this.identify = function () {
        var counter = 0;
        var checked = {};
        try {
            var links = document.getElementsByTagName("span");

            for (var i = 0; i < links.length; i++) {
                if (links[i].classList.contains("Z3988")) {

                    if (checked[links[i].title] != null) continue;

                    checked[links[i].title] = true;
                    counter++;
                }
            }
        }
        catch (e) {

        }
        return counter;
    };

    this.scanAsync = async function () {
        var coins = [];
        var links = document.getElementsByTagName("span");
        var checked = {};
        var index = 0;
        for (var i = 0; i < links.length; i++) {
            if(links[i].classList.contains("Z3988")) {
                if (checked[links[i].title] != null) continue;
                checked[links[i].title] = true;
                var source = decodeURIComponent(links[i].title);
                coins.push(source);
            }
        }
        return coins;
    }
}
if (typeof hunters !== 'undefined') {
    hunters.add(hunter);
}




