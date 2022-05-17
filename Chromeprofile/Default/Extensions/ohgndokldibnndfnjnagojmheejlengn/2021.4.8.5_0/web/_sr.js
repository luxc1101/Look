chrome.runtime.sendMessage({ action: "updateAccessToken", obj: window.location.hash }, (r) => {
    if (chrome.runtime.lastError != null && chrome.runtime.lastError != undefined) {
        if (chrome.runtime.lastError.message == "Promised response from onMessage listener went out of scope") return;
        if (chrome.runtime.lastError.message == "The message port closed before a response was received.") return;
        console.warn(chrome.runtime.lastError.message);
    }
});
