class YoutubeParser {

    constructor() {
        this.example = "https://www.youtube.com/watch?v=6Gf7jVkhejk";
        this.video_details_rgx = new RegExp(/ytplayer.config\s*=\s*(.+?)};/);
        this.responseContext_details_rgx = new RegExp(/window["ytInitialData"] =\s*(.+?)};/);
    }

    getVideoDetails(html){
        if (this.video_details_rgx.test(html)) {
            var details = this.video_details_rgx.exec(html)[1];
            var json = JSON.parse(details + "}");
            var details = JSON.parse(json.args.player_response).videoDetails;
            return details;
        }
        else {
            return null;
        }
    }

    async scanAsync(url, html) {
        try {
            var details = this.getVideoDetails(html);
            if (details == null) return "";

            var record = "TY  - WEB\r\n";
            record += `ED  - ${details.author}\r\n`;
            record += `TI  - ${details.title}\r\n`;

            if (details.keywords) {
                for (var keyword of details.keywords) {
                    record += `KW  - ${keyword}\r\n`;
                }
            }
            record += `AB  - ${details.shortDescription}\r\n`;
            record += `UR  - ${url}\r\n`;
            var response = await fetch("https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=" + details.videoId + "&format=json");
            var json = await response.json();
            //record += `IN  - ${json.provider_name}\r\n`;
            record += `QX  - ${json.thumbnail_url}\r\n`;

            var pubDate = /subscriberCountText.+?dateText.+?simpleText(.+?)}/g.exec(html)[1];
            pubDate = pubDate.replace(/[^\d.,-\s]/g, "").trim();
            record += `Y2  - ${pubDate}\r\n`;

            return record;
        }
        catch (e) {
            console.error(e);
        }
        return "";
    }
}
