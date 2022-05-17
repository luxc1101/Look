var Screenshot = function () {


    this.initalize = function (tab) {
        try {
            return new Promise(async resolve => {
                try {
                    chrome.tabs.executeScript(tab.id, { file: "screenshot/screenshot.js" }, (r2) => {
                        chrome.tabs.insertCSS(tab.id, { file: "screenshot/screenshot.css" }, (r2) => {
                            chrome.tabs.executeScript(tab.id, { code: "new Screenshot().take();" }, (r2) => {
                                resolve(true);
                            });
                        });
                    });
                }
                catch (e) {
                    telemetry.error(e);
                    resolve(null);
                }
            });
        }
        catch (e) {
            telemetry.error(e);
        }
    };

    this.take = function () {

        if (document.getElementById("citavipickerscreenshotoverlay") !== null) {
            return;
        }

        window.onscroll = () => { this.cancelDrag(); };

        var overlay = document.createElement("div");
        overlay.id = "citavipickerscreenshotoverlay";

        var body = document.body,
            html = document.documentElement;
        overlay.style.height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight) + "px";

        var overlay_top = document.createElement("div");
        overlay_top.id = "citavipickerscreenshotoverlaytop";
        overlay.appendChild(overlay_top);

        var overlay_left = document.createElement("div");
        overlay_left.id = "citavipickerscreenshotoverlayleft";
        overlay.appendChild(overlay_left);

        var overlay_bottom = document.createElement("div");
        overlay_bottom.id = "citavipickerscreenshotoverlaybottom";
        overlay.appendChild(overlay_bottom);

        var overlay_right = document.createElement("div");
        overlay_right.id = "citavipickerscreenshotoverlayright";
        overlay.appendChild(overlay_right);

        var acceptDrag = document.createElement("div");
        acceptDrag.id = "citavipickerscreenshotacceptDrag";
        acceptDrag.addEventListener("mousedown", (evt) => this.takeScreenshot(evt));
        overlay.appendChild(acceptDrag);

        var cancelDrag = document.createElement("div");
        cancelDrag.id = "citavipickerscreenshotcancelDrag";
        cancelDrag.addEventListener("mousedown", (evt) => this.cancelDrag(evt));
        overlay.appendChild(cancelDrag);

        this.dragger = document.createElement("div");
        this.dragger.id = "dragger";
        overlay.appendChild(this.dragger);

        document.body.appendChild(overlay);

        document.onmousedown = this.startDrag.bind(this);
        document.onmouseup = this.endDrag.bind(this);
        document.onmousemove = this.expandDrag.bind(this);

        this.updateDragger();
    };

    this.updateDragger = function () {
        document.getElementById("dragger").classList.add('visible');

        var top = Math.min(citavipickerDragBag.dragStart.y, citavipickerDragBag.dragEnd.y);
        var left = Math.min(citavipickerDragBag.dragStart.x, citavipickerDragBag.dragEnd.x);
        var height = Math.abs(citavipickerDragBag.dragStart.y - citavipickerDragBag.dragEnd.y);
        var width = Math.abs(citavipickerDragBag.dragStart.x - citavipickerDragBag.dragEnd.x);

        if (height < 10) {
            height = 10;
        }
        if (width < 10) {
            width = 10;
        }

        var s = document.getElementById("dragger").style;
        s.top = top + 'px';
        s.left = left + 'px';
        s.height = height + 'px';
        s.width = width + 'px';

        var border_w = 2;

        document.getElementById("citavipickerscreenshotoverlaytop").style.height = top + border_w + 'px';

        document.getElementById("citavipickerscreenshotoverlaybottom").style.top = top + height - border_w + "px";

        document.getElementById("citavipickerscreenshotoverlayleft").style.width = left + border_w + 'px';
        document.getElementById("citavipickerscreenshotoverlayleft").style.top = top + border_w + 'px';
        document.getElementById("citavipickerscreenshotoverlayleft").style.height = height - border_w * 2 + 'px';

        document.getElementById("citavipickerscreenshotoverlayright").style.left = left + width - border_w + 'px';
        document.getElementById("citavipickerscreenshotoverlayright").style.top = top + border_w + 'px';
        document.getElementById("citavipickerscreenshotoverlayright").style.height = height - border_w * 2 + 'px';

        document.getElementById("citavipickerscreenshotacceptDrag").style.top = top + height - border_w + 2 + "px";
        document.getElementById("citavipickerscreenshotacceptDrag").style.left = left + width - border_w - 22 + 'px';

        document.getElementById("citavipickerscreenshotcancelDrag").style.top = top + height - border_w + 2 + "px";
        document.getElementById("citavipickerscreenshotcancelDrag").style.left = left + width - border_w - 46 + 'px';
    };

    this.startDrag = function (evt) {
        if (citavipickerDragBag.element !== null) {
            return;
        }
        if (citavipickerDragBag.busy) {
            return;
        }

        evt.preventDefault();
        citavipickerDragBag.end = false;
        citavipickerDragBag.dragging = true;
        citavipickerDragBag.dragStart.x = citavipickerDragBag.dragEnd.x = evt.pageX;
        citavipickerDragBag.dragStart.y = citavipickerDragBag.dragEnd.y = evt.pageY;
        document.getElementById("citavipickerscreenshotacceptDrag").style.display = "none";
        document.getElementById("citavipickerscreenshotcancelDrag").style.display = "none";
        this.updateDragger();
    };

    this.expandDrag = function (evt) {
        if (citavipickerDragBag.busy) {
            return;
        }
        if (citavipickerDragBag.end) {
            return;
        }
        if (!citavipickerDragBag.dragging) {
            var elements = document.elementsFromPoint(evt.clientX, evt.clientY);
            for (var element of elements) {
                if (element.className &&
                    element.className.indexOf("citavipicker") !== -1) {
                    continue;
                }
                if (element.tagName === "IMG") {
                    var rect = element.getBoundingClientRect();

                    citavipickerDragBag.dragStart.y = rect.top + window.scrollY;
                    citavipickerDragBag.dragStart.x = rect.right + window.scrollX;

                    citavipickerDragBag.dragEnd.y = rect.bottom + window.scrollY;
                    citavipickerDragBag.dragEnd.x = rect.left + window.scrollX;

                    citavipickerDragBag.element = element;
                    this.updateDragger();
                    return;
                }
            }
            if (citavipickerDragBag.element != null) {
                //TODO Clear dragger
            }
            citavipickerDragBag.element = null;
            return;
        }
        if (citavipickerDragBag.element != null) {
            //TODO Clear dragger
        }
        citavipickerDragBag.element = null;
        citavipickerDragBag.dragEnd.x = evt.pageX;
        citavipickerDragBag.dragEnd.y = evt.pageY;
        this.updateDragger();
    };

    this.crop = function (canvas, offsetX, offsetY, width, height) {
        var buffer = document.createElement('canvas');
        var b_ctx = buffer.getContext('2d');
        buffer.width = width;
        buffer.height = height;
        b_ctx.drawImage(canvas, offsetX, offsetY, width, height, 0, 0, buffer.width, buffer.height);
        return buffer.toDataURL();
    };

    this.endDrag = function (evt) {
        if (citavipickerDragBag.busy) {
            return;
        }
        citavipickerDragBag.dragging = false;
        citavipickerDragBag.end = true;

        if (document.getElementById("citavipickerscreenshotacceptDrag") === null) {
            return;
        }
        document.getElementById("citavipickerscreenshotacceptDrag").style.display = "block";
        document.getElementById("citavipickerscreenshotcancelDrag").style.display = "block";
    };

    this.cancelDrag = function (evt) {
        document.getElementById("citavipickerscreenshotoverlay").remove();
        citavipickerDragBag.busy = false;
        document.getElementById("citavipickerscreenshotacceptDrag").style.display = "none";
        document.getElementById("citavipickerscreenshotcancelDrag").style.display = "none";
    };

    this.takeScreenshot = async function (evt) {
        citavipickerDragBag.busy = true;

        evt.preventDefault();

        var dragger = document.getElementById("dragger");

        var rect = dragger.getBoundingClientRect();
        if (rect.width < 10 || rect.height < 10) {
            return;
        }

        var border_w = 2;
        var self = this;

        var element = citavipickerDragBag.element;
        if (element !== null && element.currentSrc != null) {
            var data = await this.downloadImage(element.currentSrc);

            var bag = { data: data, title: document.title, attachmenType: "KnowledgeItemAttachment" };
            bag.contentType = "image/png";

            document.getElementById("citavipickerscreenshotoverlay").remove();
            citavipickerDragBag.busy = false;

            chrome.runtime.sendMessage({
                action: "sendScreenshotAsAttachment",
                bag: bag
            }, (r) => {});
        }
        else {
            //https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/captureTab
            chrome.runtime.sendMessage({ action: "captureVisibleTab" }, async (r) => {
                var image = new Image();
                image.onload = function () {
                    var canvas = document.createElement("canvas");
                    canvas.width = this.width;
                    canvas.height = this.height;
                    canvas.getContext('2d').drawImage(this, 0, 0);

                    var source = {
                        x: (rect.x + border_w),
                        y: (rect.y + border_w),
                        w: (rect.width - border_w * 3),
                        h: (rect.height - border_w * 3)
                    };

                    var data = self.crop(canvas, source.x, source.y, source.w, source.h);

                    var bag = { data: data, title: document.title, attachmenType: "KnowledgeItemAttachment" };
                    bag.contentType = "image/png";
                   
                    document.getElementById("citavipickerscreenshotoverlay").remove();
                    citavipickerDragBag.busy = false;

                    chrome.runtime.sendMessage({
                        action: "sendScreenshotAsAttachment",
                        bag: bag
                    }, (r) => {
                            
                    });
                };
                image.src = r;
            });
        }
    };

    this.downloadImage = async function (url) {
        var response = await fetch(url);
        if (!response.ok) {
            return false;
        }
        var contenttype = response.headers.get("Content-Type");

        var imgType = "png";
        if (contenttype == "image/jpeg") {
            imgType = "jpeg";
        }
        else if (contenttype == "image/webp") {
            imgType = "webp";
        }
        var buffer = await response.arrayBuffer();
        var binary = '';
        var bytes = [].slice.call(new Uint8Array(buffer));
        bytes.forEach((b) => binary += String.fromCharCode(b));
        var arrayBuffer = window.btoa(binary);
        return 'data:image/' + imgType + ';base64,' + arrayBuffer;
    };
};

var citavipickerDragBag = new function () {
    this.busy = false;
    this.dragging = false;
    this.dragStart = {
        x: -10,
        y: -10
    };
    this.dragEnd = {
        x: 0,
        y: 0
    };

    this.element = null;
}