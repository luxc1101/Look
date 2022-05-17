var pageInfo = {
    "title": document.title,
    "url": window.location.href,
    "source": document.head == undefined ? "" : document.head.innerHTML,
    "body": document.body.innerHTML,
    "lastModified": document.lastModified
};

try {
    var lastModified = document.querySelector("meta[name='last-modified']");
    if (lastModified != null) {
        pageInfo.lastModified = lastModified.getAttribute("content");
    }
}
catch (e) {
}

pageInfo;
