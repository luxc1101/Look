class Analyser {
    constructor() {
        this.huntersCount = -1;
        this.img_css = "border: 0px none!important;width: 16px!important;height: 16px!important;margin-left:1px !important;margin-right:1px !important;";
        this.img_css_green = "border: 0px none!important;width: 24px!important;height: 16px!important;margin-left:1px !important;margin-right:1px !important;";
        this.img_css_green_pdf = "border: 0px none!important;width: 41px!important;height: 16px!important;margin-left:1px !important;margin-right:1px !important;";
        this.icon_gray = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAARpJREFUeNpiZEAD1zX4E4BUPBA7oEkdAOKFmjc+LkAWZETSqACk1gOxAb/lLwZegz8MTJz/wXL/vjMyfL7AwvDxOBuIewGIA4EGPYAbANV8nkP2r4Bk/HcGdpm/DNjAzyfMDM8XcjL8eMz8Acg1BBnCBJVbD9IsV/QVp2YQAMmB1IDUQl3LwAT1swHIZpiT8QGQGpBakB6QXpAL4kF+xmczNpeA9ID0ggxwAAUYqQCqx4EJ5ixSAUwP2ABmLtINgBsEIn6/ZSJZIyhtwAw4AEokpAKongMgAxaCUhgokRALQGqhqXIhEzRtXwClMJizCDkdpBakB6QX5vlAUPJ81MeN1yUgOZAaaFIOJCozgWIIFMh4MxMl2RkgwACxPIMc1tjE2wAAAABJRU5ErkJggg==";
        this.icon_green = "data:image/svg+xml,%3Csvg id='picker_inserted' xmlns='http://www.w3.org/2000/svg' width='24.802' height='16' viewBox='0 0 24.802 16'%3E%3Cg id='Group_103' data-name='Group 103'%3E%3Cpath id='Path_107' data-name='Path 107' d='M8,15.5A7.5,7.5,0,1,1,15.5,8,7.508,7.508,0,0,1,8,15.5Z' fill='%23fff'/%3E%3Cpath id='Path_108' data-name='Path 108' d='M8,1A7,7,0,1,1,1,8,7.008,7.008,0,0,1,8,1M8,0a8,8,0,1,0,8,8A8,8,0,0,0,8,0Z' fill='%23d52b1e'/%3E%3C/g%3E%3Cpath id='Path_109' data-name='Path 109' d='M6.745,12.589a1.75,1.75,0,0,1-.684.247c-.318,0-.5-.164-.5-.452,0-.207.14-.375.595-.622A4.611,4.611,0,0,0,8.749,8.041c0-.825-.227-1.119-.681-1.119-.135,0-.32.219-.636.219H7.157A1.851,1.851,0,0,1,5.333,5.23a2.091,2.091,0,0,1,2.28-2.006c1.777,0,3.053,1.373,3.053,3.43a6.673,6.673,0,0,1-3.921,5.935' fill='%23d52b1e'/%3E%3Cg id='Path_1429' data-name='Path 1429' transform='translate(5.445 -2.124)' fill='%235dd95d'%3E%3Cpath d='M 9.249787330627441 17.17169380187988 L 4.762476921081543 12.68437480926514 L 7.214956283569336 10.23189544677734 L 9.015677452087402 12.03262424468994 L 9.369227409362793 12.38618469238281 L 9.722777366638184 12.03262424468994 L 16.32264709472656 5.432744979858398 L 18.65010833740234 7.760213375091553 L 9.249787330627441 17.17169380187988 Z' stroke='none'/%3E%3Cpath d='M 9.249578475952148 16.46436309814453 L 17.94319725036621 7.760422229766846 L 16.32264709472656 6.139865875244141 L 10.07633686065674 12.38618469238281 L 9.369227409362793 13.09329414367676 L 8.662117004394531 12.38618469238281 L 7.214955806732178 10.93901634216309 L 5.469596385955811 12.68437480926514 L 9.249578475952148 16.46436309814453 M 9.249997138977051 17.87900352478027 L 4.05537748336792 12.68437385559082 L 7.214957237243652 9.524794578552246 L 9.369227409362793 11.67907428741455 L 16.32264709472656 4.725644111633301 L 19.35699653625488 7.76000452041626 L 9.249997138977051 17.87900352478027 Z' stroke='none' fill='%23fff'/%3E%3C/g%3E%3C/svg%3E%0A";
        this.icon_green_pdf = "data:image/svg+xml,%3Csvg id='picker_inserted_PDF' xmlns='http://www.w3.org/2000/svg' width='40.802' height='16' viewBox='0 0 40.802 16'%3E%3Cg id='Group_103' data-name='Group 103'%3E%3Cpath id='Path_107' data-name='Path 107' d='M8,15.5A7.5,7.5,0,1,1,15.5,8,7.508,7.508,0,0,1,8,15.5Z' fill='%23fff'/%3E%3Cpath id='Path_108' data-name='Path 108' d='M8,1A7,7,0,1,1,1,8,7.008,7.008,0,0,1,8,1M8,0a8,8,0,1,0,8,8A8,8,0,0,0,8,0Z' fill='%23d52b1e'/%3E%3C/g%3E%3Cpath id='Path_109' data-name='Path 109' d='M6.745,12.589a1.75,1.75,0,0,1-.684.247c-.318,0-.5-.164-.5-.452,0-.207.14-.375.595-.622A4.611,4.611,0,0,0,8.749,8.041c0-.825-.227-1.119-.681-1.119-.135,0-.32.219-.636.219H7.157A1.851,1.851,0,0,1,5.333,5.23a2.091,2.091,0,0,1,2.28-2.006c1.777,0,3.053,1.373,3.053,3.43a6.673,6.673,0,0,1-3.921,5.935' fill='%23d52b1e'/%3E%3Cg id='Group_788' data-name='Group 788' transform='translate(-648 -91)'%3E%3Crect id='Rectangle_515' data-name='Rectangle 515' width='12.5' height='6.5' transform='translate(661 98)' fill='%23fff'/%3E%3Cpath id='Path_1430' data-name='Path 1430' d='M0,0,3.962,4H0Z' transform='translate(672.288 91)' fill='%23fff'/%3E%3Cg id='picto-support-e-books' transform='translate(661 91)'%3E%3Cg id='Group_699' data-name='Group 699' transform='translate(2.445 8.827)'%3E%3Cg id='Group_698' data-name='Group 698' transform='translate(2.625)'%3E%3Cpath id='Path_1267' data-name='Path 1267' d='M34.475,35.928V35.4H32.732V38.27h.647V37.114H34.4v-.529H33.379v-.657Z' transform='translate(-29.619 -35.373)' fill='%23d52b1e'/%3E%3Cpath id='Path_1268' data-name='Path 1268' d='M22.32,35.615a1.829,1.829,0,0,0-1.168-.307,5.693,5.693,0,0,0-.871.06V38.19a5.482,5.482,0,0,0,.732.043,2.036,2.036,0,0,0,1.315-.37A1.462,1.462,0,0,0,22.8,36.7,1.28,1.28,0,0,0,22.32,35.615Zm-1.168,2.111a1.18,1.18,0,0,1-.224-.013V35.832a1.315,1.315,0,0,1,.293-.025.821.821,0,0,1,.9.912A.888.888,0,0,1,21.152,37.726Z' transform='translate(-20.281 -35.308)' fill='%23d52b1e'/%3E%3C/g%3E%3Cpath id='Path_1269' data-name='Path 1269' d='M11.521,35.539a1.36,1.36,0,0,0-.87-.23,5.138,5.138,0,0,0-.871.06v2.836h.638V37.177a1.66,1.66,0,0,0,.22.013,1.311,1.311,0,0,0,.926-.3.923.923,0,0,0,.262-.683A.841.841,0,0,0,11.521,35.539Zm-.888,1.152a1.075,1.075,0,0,1-.216-.016v-.849a1.064,1.064,0,0,1,.266-.026c.323,0,.5.158.5.422C11.187,36.516,10.976,36.691,10.633,36.691Z' transform='translate(-9.78 -35.309)' fill='%23d52b1e'/%3E%3C/g%3E%3Cpath id='Path_1270' data-name='Path 1270' d='M15.228,3.552,11.686.027V0H4.53l-1.345,0v7.02H0v6.529H3.185V16H15.247l0-12.448Zm-3.6,9.252H.744V7.776H11.626Zm.061-9.252V.991L14.26,3.552Z' fill='%23d52b1e'/%3E%3C/g%3E%3C/g%3E%3Cg id='Path_1429' data-name='Path 1429' transform='translate(21.445 -2.124)' fill='%235dd95d'%3E%3Cpath d='M 9.249787330627441 17.17169380187988 L 4.762476921081543 12.68437480926514 L 7.214956283569336 10.23189544677734 L 9.015677452087402 12.03262424468994 L 9.369227409362793 12.38618469238281 L 9.722777366638184 12.03262424468994 L 16.32264709472656 5.432744979858398 L 18.65010833740234 7.760213375091553 L 9.249787330627441 17.17169380187988 Z' stroke='none'/%3E%3Cpath d='M 9.249578475952148 16.46436309814453 L 17.94319725036621 7.760422229766846 L 16.32264709472656 6.139865875244141 L 10.07633686065674 12.38618469238281 L 9.369227409362793 13.09329414367676 L 8.662117004394531 12.38618469238281 L 7.214955806732178 10.93901634216309 L 5.469596385955811 12.68437480926514 L 9.249578475952148 16.46436309814453 M 9.249997138977051 17.87900352478027 L 4.05537748336792 12.68437385559082 L 7.214957237243652 9.524794578552246 L 9.369227409362793 11.67907428741455 L 16.32264709472656 4.725644111633301 L 19.35699653625488 7.76000452041626 L 9.249997138977051 17.87900352478027 Z' stroke='none' fill='%23fff'/%3E%3C/g%3E%3C/svg%3E%0A";
        this.icon_red = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iRWJlbmVfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiIHdpZHRoPSIxNnB4IiBoZWlnaHQ9IjE2cHgiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMTYgMTYiIHhtbDpzcGFjZT0icHJlc2VydmUiPjxnPjxnPjxwYXRoIGZpbGw9IiNGRkZGRkYiIGQ9Ik04LjAwMSwxNS41QzMuODY0LDE1LjUsMC41LDEyLjEzNiwwLjUsOGMwLTQuMTM1LDMuMzY1LTcuNSw3LjUwMS03LjVTMTUuNSwzLjg2NCwxNS41LDhTMTIuMTM3LDE1LjUsOC4wMDEsMTUuNXoiLz48cGF0aCBmaWxsPSIjRDUyQjFFIiBkPSJNOC4wMDEsMUMxMS44NiwxLDE1LDQuMTQxLDE1LDhzLTMuMTM5LDctNi45OTksN0M0LjE0LDE1LDEsMTEuODU5LDEsOFM0LjE0LDEsOC4wMDEsMSBNOC4wMDEsMEMzLjU4MiwwLDAsMy41ODIsMCw4czMuNTgyLDgsOC4wMDEsOEMxMi40MTgsMTYsMTYsMTIuNDE4LDE2LDhTMTIuNDE4LDAsOC4wMDEsMEw4LjAwMSwweiIvPjwvZz48cGF0aCBmaWxsPSIjRDUyQjFFIiBkPSJNNi43NDUsMTIuNTg5Yy0wLjIyNywwLjEyMi0wLjQ5NywwLjI0Ny0wLjY4NCwwLjI0N2MtMC4zMTgsMC0wLjUwMS0wLjE2NC0wLjUwMS0wLjQ1MmMwLTAuMjA3LDAuMTQtMC4zNzUsMC41OTUtMC42MjJjMS41NDktMC45MDQsMi41OTQtMi4yNzIsMi41OTQtMy43MjFjMC0wLjgyNS0wLjIyNy0xLjExOS0wLjY4MS0xLjExOWMtMC4xMzUsMC0wLjMyLDAuMjE5LTAuNjM2LDAuMjE5SDcuMTU3QzYuMTAyLDcuMTQzLDUuMzMzLDYuMjY0LDUuMzMzLDUuMjNjMC0xLjE1MiwwLjk1OC0yLjAwNiwyLjI4LTIuMDA2YzEuNzc3LDAsMy4wNTMsMS4zNzMsMy4wNTMsMy40M0MxMC42NjYsOS4yMTUsOS4yMDMsMTEuMjcsNi43NDUsMTIuNTg5Ii8+PC9nPjwvc3ZnPg";
        this.pendingNodesToCheck = new Array();
        this.showHunterMenu = true;
        this.detectIsbnDoi = true;
        this.isC5 = false;
        this.pmidCheck = false;
        this.hasIsbnLabel = false;
        this.identifiers = [];
        this.identifiersInternal = []; //Only Ids...
        this.identifiersChecked = [];
        this.identifiersImported = [];
        this.duplicateCheckPending = false;
        this.observeTimeout = null;
        this.activehunter = null;

        this.initalize();
    }

    initalize() {
        if (document.body === null) return;
        if (document.URL.indexOf("chrome-extension://") !== -1) return;
        if (document.URL.indexOf("moz-extension://") !== -1) return;
        if (typeof MessageKeys === 'undefined') return;

        chrome.runtime.sendMessage({ action: MessageKeys.getAnalyserOptions, value: document.URL }, (response) => {

            if (!isNullOrUndefined(chrome.runtime.lastError)) {
                console.error(chrome.runtime.lastError.message);
                return;
            }
            if (response.isBlacklisted) {
                return;
            }

            if (document.URL.indexOf("wikipedia") !== -1) {
                if (document.URL.indexOf("action=edit") !== -1) {
                    analyser.detectIsbnDoi = false;
                    analyser.showHunterMenu = response.hunterEnabled;
                    analyser.onPageLoad(true);
                    return;
                }
            }
            if (document.body.childElementCount == 1 &&
                document.body.childNodes[0].nodeName == "PRE" &&
                document.body.childNodes[0].style.cssText == "overflow-wrap: break-word; white-space: pre-wrap;") {
                //Pure JSON
                analyser.detectIsbnDoi = false;
                analyser.showHunterMenu = false;
                return;
            }
            if (document.URL.indexOf("hogrefe.com") !== -1) {
                response.detectIsbnDoi = false;
            }
            
            analyser.isC5 = response.version === 5;
            analyser.connected = response.connected;
            analyser.detectIsbnDoi = response.detectIsbnDoi;
            analyser.showHunterMenu = response.hunterEnabled;
            analyser.supportsDuplCheck = response.supportsDuplCheck;
            
            window.setTimeout(() => {
                    analyser.onPageLoad(true);
                },
                response.delay);

        });
        chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
            if (msg.action == MessageKeys.downloadPdf) {
                if (document.URL.startsWith("https:") && msg.url.startsWith("http:")) {
                    msg.url = msg.url.replace("http:", "https:");
                }
                this.downloadPdf(msg.url, msg.asBase64, sendResponse);
                return true;
            }
            else if (msg.action === MessageKeys.huntersRun) {
                this.runHunters(0);
                return true;
            }
            else if (msg.action === MessageKeys.updateDuplicateState) {
                this.identifiersChecked = [];
                this.duplicateCheck();
                return true;
            }
            return false;
        });

        this.info =
            {
                isPubMed: document.URL.indexOf("pubmed.ncbi.nlm.nih.gov") !== -1
            };
    }

    downloadPdf(url, asBase64, sendResponse) {
        var before = new Promise(r => {

            if (url.toLowerCase().indexOf("sciencedirect.com") != -1) {
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function (data) {
                    if (xhr.readyState == 4) {
                        try {
                            url = /window.location\s*=\s*'(.+?)'/.exec(xhr.responseText)[1];
                        }
                        catch (e) {
                            console.error(e);
                        }
                        r();
                    }
                };
                xhr.open('GET', url, true);
                xhr.send();
            }
            else {
                r();
            }
        });
        before.then(r => {
            try {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.responseType = 'arraybuffer';
                xhr.onerror = function (e) {
                    sendResponse({ data: null, fileType: "unknown" });
                };
                xhr.onload = function (e) {
                    try {
                        if (this.status == 200) {

                            if (decodeURI(xhr.responseURL) !== decodeURI(url)) {
                                sendResponse({ action: "redirect", url: xhr.responseURL });
                                return;
                            }
                            var fileType = this.getResponseHeader('content-type');

                            var uInt8Array = new Uint8Array(this.response);

                            if ((uInt8Array[0] == 0x25 &&
                                uInt8Array[1] == 0x50 &&
                                uInt8Array[2] == 0x44 &&
                                uInt8Array[3] == 0x46)) {
                                fileType = "PDF";
                            }

                            if (asBase64) {
                                var i = uInt8Array.length;
                                var binaryString = new Array(i);
                                while (i--) {
                                    binaryString[i] = String.fromCharCode(uInt8Array[i]);
                                }
                                var data = binaryString.join('');
                                var base64 = window.btoa(data);
                                sendResponse({ data: base64, fileType: fileType });
                            }
                            else {
                                sendResponse({ data: Array.from(uInt8Array), fileType: fileType });
                            }
                        }
                        else {
                            sendResponse({ data: null, fileType: "unknown" });
                        }
                    }
                    catch (e) {
                        sendResponse({ data: null, fileType: "unknown", error: e });
                    }
                };
                xhr.send();
            }
            catch (e) {
                sendResponse({ data: null, fileType: "unknown", error: e });
            }
        }).catch(ex => {
            sendResponse({ data: null, fileType: "unknown", error: ex });
        });
    }

    onPageLoad(subscibeEvents) {
        try {

            if (document.body == null || document.body.innerHTML == null) {
                return;
            }

            this.identifiers = [];

            if (this.showHunterMenu) {
                this.runHunters(0);
            }

            if (subscibeEvents) {
                this.observe();
            }

            this.checkPage();
            this.duplicateCheck();
        }
        catch (e) {
            console.warn(e);
        }
    }

    checkPage() {
        if (!this.detectIsbnDoi) {
            return;
        }

        for (var i = 0; i < document.body.childNodes.length; i++) {

            var child = document.body.childNodes[i];
            var innerHTML = child.innerHTML;

            if (innerHTML == undefined) {
                continue;
            }

            if (innerHTML.indexOf("PMID") === -1) {
                var match = this.getIdentifier(innerHTML, 0);
                if (match == null) {
                    continue;
                }
            }
            this.scanNode(child);
        }
    }

    duplicateCheck() {
        if (this.connected &&
            this.supportsDuplCheck &&
            this.identifiers.length > 0 &&
            !this.duplicateCheckPending) {

            var toCheck = [];

            for (var identifier of this.identifiers) {
                if (this.identifiersChecked.indexOf(identifier.value) == -1) {
                    toCheck.push(identifier);
                }
            }
            if (toCheck.length == 0) {
                return;
            }
            chrome.runtime.sendMessage({ action: MessageKeys.checkForDuplicates, identifier: toCheck }, (response) => {
                try {
                    if (response == null ||
                        response.value == "0") {
                        for (var i = 0; i < this.identifiers.length; i++) {
                            var item = this.identifiers[i];
                            var elements = document.querySelectorAll(".citavipicker[identifier='" + item.value + "']");
                            for (var j = 0; j < elements.length; j++) {
                                var img = elements[j];
                                img.setAttribute("src", this.icon_red);
                                img.style.width = "16px!important";
                                img.style.heigth = "16px!important";
                                img.setAttribute("existsInProject", "0");
                            }
                        }
                    }
                    else {
                        for (var i = 0; i < response.length; i++) {
                            var item = response[i];
                           
                            this.identifiersChecked.push(item.id);
                            var elements = document.querySelectorAll(".citavipicker[identifier='" + item.id + "']");

                            for (var j = 0; j < elements.length; j++) {
                                var img = elements[j];
                                img.setAttribute("existsInProject", item.exists ? "1" : "0");
                                if (img.src == this.icon_green) continue;

                                if (item.exists) {
                                    
                                    if (item.hasAttachment) {
                                        img.setAttribute("style", this.img_css_green_pdf);
                                        img.title = chrome.i18n.getMessage("ShowKindleReference");
                                        img.setAttribute("src", this.icon_green_pdf);
                                    }
                                    else {
                                        img.setAttribute("style", this.img_css_green);
                                        img.title = chrome.i18n.getMessage("ShowKindleReference");
                                        img.setAttribute("src", this.icon_green);
                                    }
                                }
                                else {
                                    img.setAttribute("src", this.icon_red);
                                    img.setAttribute("style", this.img_css);
                                }
                            }
                        }
                    }
                }
                catch (e) {

                }
                finally {
                    this.duplicateCheckPending = false;
                }
            });
        }
    }

    getIdentifier(isbn, startIndex) {
        try {

            if (isbn == null ||
                isbn == " ") {
                return null;
            }

            var patterns = [];
            patterns.push({ rgx: /(\s|\>|:|^|;|,)((978\-|979\-)(\d|\-){11,13})($|\D)/g, type: "ISBN13" });
            patterns.push({ rgx: /(\s|\>|:|^|;|,)((978\s|979\s)(\d|\s){11,13})($|\D)/g, type: "ISBN13" });
            patterns.push({ rgx: /(\s|\>|:|^|;|,)((978|979)(\-){0,1}(\d|\s){10})($|\D)/g, type: "ISBN13" });
            patterns.push({ rgx: /(\s|\>|:|^|;|,)((\d|x|X){10})($|\D)/g, type: "ISBN10" });
            patterns.push({ rgx: /(\s|\>|:|^|;|,)((\d|\-|\-|x|X){13})($|\D)/g, type: "ISBN10" });
            patterns.push({ rgx: /(\s|\>|:|^|;|,)((\d|\-|\-|x|X){12})($|\D)/g, type: "ISBN10" });
            patterns.push({ rgx: /(\s|\>|:|^|;|,)((\d|\-|\-|x|X){11})($|\D)/g, type: "ISBN10" });
            patterns.push({ rgx: /(\s|\>|:|^|;|,)((\d|\s|x|X){13})($|\D)/g, type: "ISBN10" });
            patterns.push({ rgx: /(\s|\>|:|^|;|,)((\d|\s|x|X){12})($|\D)/g, type: "ISBN10" });
            patterns.push({ rgx: /(\s|\>|:|^|;|,)((\d|\s|x|X){11})($|\D)/g, type: "ISBN10" });

            var isbnMatch = null;
            patterns.forEach((pattern) => {

                var rgx = pattern.rgx;
                rgx.lastIndex = startIndex;
                var match = rgx.exec(isbn);
                if (match != null) {
                    if (pattern.type == "ISBN13") {
                        if (Isbn.isISBN13(match[2])) {
                            if (isbnMatch == null ||
                                isbnMatch.index > match.index) {
                                isbnMatch = match;
                            }
                        }
                    }
                    else {

                        if (Isbn.isISBN10(match[2])) {
                            if (isbnMatch == null ||
                                isbnMatch.index > match.index) {
                                isbnMatch = match;
                            }
                        }
                    }
                }
            });
            if (isbnMatch != null) {
                return isbnMatch;
            }

            var doiReg = /(\s|\>|:|^|;|\/|,)(10\.\d\d\d+\/.+?)(\)\s|\s|\.\s|&nbsp;|\.$|\"|$)/g;
            doiReg.lastIndex = startIndex;
            var match = doiReg.exec(isbn);
            if (match != null) {
                return match;
            }

            if (isbn == "PMID:") {
                this.pmidCheck = true;
                return;
            }
            if (this.pmidCheck) {
                var pmidReg = /^(.*?)(\d+)$/g;
                pmidReg.lastIndex = startIndex;
                match = pmidReg.exec(isbn);
                if (match != null) {
                    match[2] = "PMID" + match[0];
                    match.diff = 4;
                    return match;
                }
                else {
                    this.pmidCheck = false;
                }
            }

            var pmidReg2 = /(PMID:\s*?)(\d+)/g;
            pmidReg2.lastIndex = startIndex;
            match = pmidReg2.exec(isbn);
            if (match != null) {

                var pmid = /\d+/.exec(match[0])[0];
                match[2] = "PMID:" + pmid;
                match.diff = 0;
                return match;
            }

            if (this.isC5) return null;

            var pmcRgx = /(PMC\d+)/g;
            pmcRgx.lastIndex = startIndex;
            match = pmcRgx.exec(isbn);
            if (match != null) {
                return match;
            }

            var arxivRgx = /(arXiv:\d{4}.\d{4,5}[v\d+]*)|(arXiv:\w+.\d+[v\d+]*)/g;
            arxivRgx.lastIndex = startIndex;
            match = arxivRgx.exec(isbn);
            if (match != null) {
                return match;
            }

            return null;
        }
        catch (e) {
            console.warn(e);
        }
    }

    getNodeMatch(node, regex, callback, excludeElements) {

        excludeElements || (excludeElements = ['script', 'style', 'iframe', 'cavas']);
        var child = node.firstChild;

        do {
            try {
                if (child == undefined) break;

                switch (child.nodeType) {
                    case 1:
                        if (excludeElements.indexOf(child.tagName.toLowerCase()) > -1) {
                            continue;
                        }
                        this.getNodeMatch(child, regex, callback, excludeElements);
                        break;
                    case 3:
                        child.data.replace(regex, function (all) {
                            var args = [].slice.call(arguments),
                                offset = args[args.length - 2],
                                newTextNode = child.splitText(offset);

                            newTextNode.data = newTextNode.data.substr(all.length);
                            callback.apply(window, [child].concat(args));
                            child = newTextNode;
                        });
                        break;
                }
            }
            catch (e) {

            }
        } while (child = child.nextSibling);

        return node;
    }

    observe() {
        if (!this.detectIsbnDoi) {
            return;
        }

        if (document.URL.indexOf("/science/article/") != -1) {
            //#1586, #2242
            document.addEventListener("DOMNodeRemoved", (event) => {
                try {

                    if (event.srcElement.innerHTML.indexOf("citavipicker") != -1) {
                        window.setTimeout(() => {
                            try {
                                this.identifiersChecked.length = 0;
                                this.scanNode(document.getElementsByClassName("doi")[0]);
                                this.duplicateCheck();
                            }
                            catch (e) {

                            }
                        }, 2000);
                    }
                }
                catch (e) {

                }
            });
        }

        var z3988TagInserted = false;
        
        document.addEventListener("DOMNodeInserted", (event) => {
            try {
                if (event.target.id == "citavipickerpanel") {
                    return;
                }
                if (event.target.id == "citaviPickerProgressDialog") {
                    return;
                }
                if (event.target.id === "citaviPickerTmpScript") {
                    return;
                }
                if (document.URL.indexOf("google") !== -1) {
                    return;
                }
                if (event.target.className == "Z3988") {
                    z3988TagInserted = true;
                }
                if (this.observeTimeout !== null) {
                    return;
                }

                window.clearTimeout(this.observeTimeout);

                this.observeTimeout = window.setTimeout(() => {
                    try {
                        if (window.activehunter != null && window.activehunter.supportsRefresh) {
                            this.runHunters(0);
                        }
                        else if (document.URL.indexOf("/r3/document") !== -1) {
                            this.runHunters(0);
                        }
                        else if (document.URL.indexOf("www.nzz.ch/") !== -1) {
                            this.runHunters(0);
                        }
                        else if (document.URL.indexOf("www.jstor.org/") !== -1) {
                            this.runHunters(0);
                        }
                        else if (z3988TagInserted) {
                            z3988TagInserted = false;
                            this.runHunters(0);
                        }

                        this.scanNode(document.body);
                        this.duplicateCheck();
                    }
                    catch (e) {

                    }
                    finally {
                        this.observeTimeout = null;
                    }
                }, 2000);
            }
            catch (e) {

            }
        });

        //#4148
        document.addEventListener("click", (event) => {
            try {
                if (event && event.target && event.target.className === "citavipicker") {

                    event.stopPropagation();

                    var identifier = {};
                    identifier.value = event.target.getAttribute("identifier");
                    identifier.type = event.target.getAttribute("identifiertype");
                    
                    if (identifier.type == ReferenceIdentifierType.Hunter) {
                        window.hunter.fetch3(identifier);
                        return;
                    }

                    var existsInProject = event.target.getAttribute("existsInProject") === "1";
                   
                    if (!existsInProject && this.identifiersImported[identifier.value] !== undefined) {
                        return;
                    }

                    this.identifiersImported[identifier.value] = identifier;
                    
                    var action;
                    if (identifier.type == ReferenceIdentifierType.Arxiv) {
                        if (this.activehunter !== null &&
                            this.activehunter !== undefined &&
                            this.activehunter.id == "BB724F35-13AF-4038-B7C9-9B416A389ACD") {
                            chrome.runtime.sendMessage({ action: MessageKeys.fetch, id: identifier, method: action, hunterId: this.activehunter.id }, (r) => {
                                this.duplicateCheck();
                            });
                            return;
                        }
                    }
                    chrome.runtime.sendMessage({ action: MessageKeys.fetch, id: identifier, method: action }, (r) => {
                        this.duplicateCheck();
                    });
                }
            }
            catch (e) {
                console.error(e);
            }
        });
    }

    scanNode(node) {
        try {

            if (node.childNodes == null) return;
            if (node.nodeName.toLowerCase() == "textarea") return;
            if (node.nodeName.toLowerCase() == "script") return;
            if (node.nodeName.toLowerCase() == "javascript") return;
            if (node.innerHTML == null) return;

            if (this.getIdentifier(node.innerHTML, 0) == null &&
                node.innerHTML.indexOf("PMID") === -1 && node.title !== "PubMed ID" && node.className !== "docsum-pmid") {
                return;
            }
            var isbn_counter = 0;
            for (var ii = 0; ii < node.childNodes.length; ii++) {

                var child = node.childNodes[ii];

                if (child.hasCitaviPickerIcon) {
                    continue;
                }
                if (child.noCitaviPicker) {
                    continue;
                }
                if (child.tagName != null) {

                    var tag = child.tagName.toLowerCase();
                    switch (tag) {
                        case "input":
                        case "script":
                        case "textarea":
                        case "style":
                        case "map":
                            continue;
                    }
                }
                if (child.classList != null &&
                    child.classList.contains("ace_editor")) continue;

                if (child.nodeType == 3) {

                    var searchIndex = 0;

                    while (true) {
                        var isbnMatch = this.getIdentifier(child.nodeValue, searchIndex);
                        
                        if (isbnMatch == null) {
                            if (node.title === "PubMed ID" || node.className === "docsum-pmid") {
                                isbnMatch = this.getIdentifier("PMID: " + child.nodeValue, searchIndex);
                                if (isbnMatch) {
                                    isbnMatch[2] = isbnMatch[2];
                                    isbnMatch.diff = 5;
                                }
                            }
                        }

                        var title = "";
                        if (isbnMatch != null) {
                            isbn_counter++;
                            var diff = 0;
                            var match = null;
                            title = chrome.i18n.getMessage("AddToCitaviProjectByISBN");
                            if (isbnMatch.length > 1 &&
                                isbnMatch[2] != null &&
                                isbnMatch[2].indexOf("10.") != -1) {
                                title = chrome.i18n.getMessage("AddToCitaviProjectByDOI");
                                match = isbnMatch[2];
                            }
                            else if (isbnMatch.length > 1 &&
                                isbnMatch[2] != null &&
                                isbnMatch[2].indexOf("PMID") != -1) {
                                title = chrome.i18n.getMessage("AddToCitaviProjectByPMID");
                                diff = isbnMatch.diff;
                                match = isbnMatch[2];
                            }
                            else if (isbnMatch[0].indexOf("PMC") != -1) {
                                title = chrome.i18n.getMessage("AddToCitaviProjectByPMCID");
                                match = isbnMatch[0];
                            }
                            else if (isbnMatch[0].indexOf("arXiv") != -1) {
                                title = chrome.i18n.getMessage("AddToCitaviProjectByArXiv");
                                match = isbnMatch[0];
                            }
                            else {
                                match = isbnMatch[2];
                            }

                            var insertIndex = isbnMatch.index + match.length - diff;

                            if (child.nodeValue.length > insertIndex) insertIndex++;

                            if (/tel\.|phon/ig.test(child.nodeValue) || /^\+\d\d\s/.test(child.nodeValue)) {
                                searchIndex = isbnMatch.index + match.length - diff;
                                continue;
                            }

                            var identifier = match;
                            identifier = identifier.replace(/\s/g, "");

                            var insertData = " %CITAVIPICKER£" + identifier + "£" + title + "£%";
                           
                            if (node.querySelector("img[identifier='" + identifier + "']") !== null) {
                                break;
                            }
                            if (node.parentNode.querySelector("img[identifier='" + identifier + "']") !== null) {
                                break;
                            }


                            child.insertData(insertIndex, insertData);

                            searchIndex = isbnMatch.index + match.length + insertData.length - diff;

                            node.hasCitaviPickerIcon = true;
                        }
                        else {
                            break;
                        }
                    }
                }

                this.scanNode(child);
            }

            var innerHtml = node.innerHTML;
            if (innerHtml == null) return;
            if (innerHtml.indexOf("%CITAVIPICKER") == -1) return;
            if (node.noCitaviPicker != undefined) return;
            for (var j = 0; j < isbn_counter; j++) {
                this.getNodeMatch(node, new RegExp("%CITAVIPICKER£(?:.+?)£(?:.+?)£%"), (node, match, offset) => {
                    var s = /%CITAVIPICKER£(.+?)£(.+?)£%/.exec(match);
                    var id = s[1];
                    var identifier = {};

                    if (id.indexOf("PMID") != -1) {
                        id = id.replace(/\D/g, "");
                        identifier.value = id;
                        identifier.type = ReferenceIdentifierType.PubMedId;
                    }
                    else if (id.indexOf("PMC") != -1) {
                        identifier.value = id;
                        identifier.type = ReferenceIdentifierType.PmcId;
                    }
                    else if (id.indexOf("arXiv") != -1) {
                        id = id.replace("arXiv:", "");
                        identifier.value = id;
                        identifier.type = ReferenceIdentifierType.Arxiv;
                    }
                    else if (id.indexOf("10.") != -1) {
                        identifier.value = id;
                        identifier.type = ReferenceIdentifierType.Doi;
                    }
                    else {
                        identifier.value = id;
                        identifier.type = ReferenceIdentifierType.Isbn;
                    }
                    identifier.title = s[2];
                    this.createPickerNode(node, identifier);
                });
            }
        }
        catch (e) {
            console.error(e);
        }
    }

    createPickerNode(previousNode, identifier, style, suppressDuplCheck) {
        try {

            var span = document.createElement("span");
            var a = document.createElement("a");
            var img = document.createElement("img");
            
            a.cref = "CitaviPicker" + identifier.value;
            a.href = "javascript:";

            img.className = "citavipicker";
            img.setAttribute("identifier", identifier.value);
            img.setAttribute("identifiertype", identifier.type);

            if (!suppressDuplCheck &&
                this.connected &&
                this.supportsDuplCheck) {
                if (this.identifiersInternal.indexOf(identifier.value) == -1) {
                    this.identifiersInternal.push(identifier.value);
                    this.identifiers.push(identifier);
                }
                img.setAttribute("src", this.icon_gray);
            }
            else {
                img.setAttribute("src", this.icon_red);
            }

            img.setAttribute("style", this.img_css);
            img.title = identifier.title;
            a.appendChild(img);
            span.appendChild(a);

            previousNode.parentNode.insertBefore(span, previousNode.nextSibling);
            if (this.info.isPubMed) {
                a.style.top = "4px";
                a.style.position = "relative";
                a.style.verticalAlign = "text-bottom";
            }
            else {
                if (style === null) {
                    var style = window.getComputedStyle(a);
                    if (style.lineHeight.replace("px", "") * 1 > 16) {
                        a.style.top = (style.lineHeight.replace("px", "") - 16) / 2 + "px";
                    }
                    else {
                        a.style.top = "0px";
                    }
                    a.style.position = "relative";
                    a.style.verticalAlign = "text-bottom";
                }
                else {
                    for (var prop in style) {
                        a.style[prop] = style[prop];
                    }
                }
            }
            previousNode.hasCitaviPickerIcon = true;
        }
        catch (e) {
            console.error(e);
        }
    }

    runHunters(hunterIndex) {
        try {

            window.activehunter = null;
            if (this.huntersCount == -1) {
                chrome.runtime.sendMessage({ action: MessageKeys.getHuntersCount }, (r1) => {
                    if (r1.value != -1) {
                        this.huntersCount = r1.value;
                        this.runHunters(hunterIndex);
                    }
                });
                return;
            }

            if (hunterIndex >= this.huntersCount) {
                window.activehunter = null;
                if (document.getElementById("citavipickerpanel") != null) {
                    chrome.runtime.sendMessage({ action: MessageKeys.refreshPanel });
                }
                return;
            }

            chrome.runtime.sendMessage({ action: MessageKeys.getHunter, value: hunterIndex }, (response) => {
                try {
                    if (response != null &&
                        response.result != null &&
                        response.result.count > 0) {
                        window.activehunter = response.result.activehunter;
                        window.activehunter.referencesCount = response.result.count;
                        this.activehunter = response.result.activehunter;
                        try {
                            if (window.hunter !== null &&
                                window.hunter.analyse !== undefined) {
                                window.hunter.analyse();
                            }
                        }
                        catch (e) {
                            console.error(e);
                        }

                        if (document.getElementById("citavipickerpanel") != null) {
                            chrome.runtime.sendMessage({ action: MessageKeys.hunterScan, id: window.activehunter.id });
                        }
                    }
                    else {

                        this.runHunters(hunterIndex + 1);
                    }
                }
                catch (e) {
                    console.error(e);
                }

            });
        }
        catch (e) {
            console.error(e);
        }
    }
}

var analyser = new Analyser();


