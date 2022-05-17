class MsgBox {
    constructor() {

    }
    showMessageBanner(text, type) {
        var textSpan = document.getElementById("messageBannerText");
        textSpan.innerText = text;
        var messageBar = document.getElementById("messageBanner");
        messageBar.classList.remove("fadeout");
        messageBar.classList.add("alert-" + type);
        messageBar.classList.add("fadein");
        messageBar.style.display = "block";
        window.setTimeout(() => {
            messageBar.classList.remove("fadein");
            messageBar.classList.add("fadeout");
        }, 5000);
    }

    show(msg, closePanelAfterMsg) {
        if (msg == "") return;
        
        if (runtimeInfo.isChrome) {
            window.setTimeout(() => {
                alert(chrome.i18n.getMessage(msg));
                if (closePanelAfterMsg) {
                    panel.close();
                }
            }, 500);
            return;
        }
        var alertWindow = 'alert(chrome.i18n.getMessage(\'' + msg + '\'))';
        //Damit die die aufrufende Funktion noch abgeschlossen werden kann.
        //Bsp. Importmeldung und ClearProgress
        window.setTimeout(() => {
            chrome.tabs.executeScript({ code: alertWindow });
            if (closePanelAfterMsg) {
                panel.close();
            }
        }, 500);
    }

    confirm(msg, callback) {
        if (msg == "") return;
        if (runtimeInfo.isChrome) {
            var result = confirm(chrome.i18n.getMessage(msg));
            callback(result);
            return;
        }
        var confirmWindow = 'confirm(chrome.i18n.getMessage(\'' + msg + '\'))';
        chrome.tabs.executeScript(null, { code: confirmWindow }, function (result) {
            callback(result);
        });

    }
}
