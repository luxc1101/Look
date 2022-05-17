//https://javascript.info/selection-range

class AnnotationMarker {

    constructor() {
        chrome.runtime.sendMessage({ action: MessageKeys.restoreAnnotations, url: document.URL }, (response) => {

        });

        this.eventHandlers = {};
        this.eventHandlers["added"] = [];
        this.eventHandlers["removed"] = [];

        this.annotations = [];
    }

    create() {
        try {
            var range = document.getSelection().getRangeAt(0);

            var annotation = {};

            annotation.url = document.location.origin + document.location.pathname;
            annotation.text = range.toString();

            annotation.startContainerPath = this.getElementXPath(range.startContainer);
            annotation.startOffset = range.startOffset;

            annotation.endContainerPath = this.getElementXPath(range.endContainer);
            annotation.endOffset = range.endOffset;

            annotation.collapsed = range.collapsed;

            return JSON.stringify(annotation);
        }
        catch (e) {
            console.error(e);
            return JSON.stringify({ exception: e });
        }
    }

    restore(annotation) {
        try {
            if (annotation) {
                var startContainer = this.getElementByXPath(annotation.startContainerPath);
                var endContainer = this.getElementByXPath(annotation.endContainerPath);
                let range = new Range();

                range.setStart(startContainer, annotation.startOffset);
                range.setEnd(endContainer, annotation.endOffset);

                if (range.collapsed) {
                    return;
                }
                var safeRanges = this.getSafeRanges(range);
                for (var i = 0; i < safeRanges.length; i++) {
                    var safeRange = safeRanges[i];
                    var newNode = document.createElement("mark");
                    newNode.dataset.annotationId = annotation.id;
                    newNode.dataset.annotationType = annotation.type;
                    //newNode.setAttribute(
                    //    "style",
                    //    "background-color: red; display: inline;"
                    //);
                    newNode.addEventListener("click", (e) => {
                        var node = e.target;
                        while (!node.dataset.annotationId) {
                            node = node.parentNode;
                            if (node == null) {
                                break;
                            }
                        }
                        console.log(node.dataset.annotationId);
                    });
                    try {
                        safeRanges[i].surroundContents(newNode);
                    }
                    catch (e) {
                        console.error(e);
                        console.log(safeRanges[i]);
                    }
                }

                this.annotations.push(annotation);

                for (var callback of this.eventHandlers["added"]) {
                    callback(annotation);
                }
            }
        }
        catch (e) {
            console.error(e);
            return JSON.stringify({ exception: e });
        }
        return JSON.stringify({ result: true });
    }

    getElementXPath(element) {
        if (element && element.id)
            return '//*[@id="' + element.id + '"]';
        else
            return this.getElementTreeXPath(element);
    };
    getElementTreeXPath(node) {
        let tests = [];
        for (; node && (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE); node = node.parentNode) {
            // node test predicates
            let predicates = [];

            // format node test for current node
            let test = (() => {
                switch (node.nodeType) {
                    case Node.ELEMENT_NODE:
                        // naturally uppercase. I forget why I force it lower.
                        return node.nodeName.toLowerCase();

                    case Node.TEXT_NODE:
                        return 'text()';

                    default:
                        console.error(`invalid node type: ${node.nodeType}`);
                }
            })();

            if (node.nodeType === Node.ELEMENT_NODE && node.id.length > 0) {
                // if the node is an element with a unique id within the *document*, it can become the root of the path,
                // and since we're going from node to document root, we have all we need.
                if (node.ownerDocument.querySelectorAll(`#${node.id}`).length === 1) {
                    // because the first item of the path array is prefixed with '/', this will become 
                    // a double slash (select all elements). But as there's only one result, we can use [1]
                    // eg: //span[@id='something']/div[3]/text()
                    tests.unshift(`/${test}[@id="${node.id}"]`);
                    break;
                }

                if (node.parentElement && !Array.prototype.slice
                    .call(node.parentElement.children)
                    .some(sibling => sibling !== node && sibling.id === node.id)) {
                    // There are multiple nodes with the same id, but if the node is an element with a unique id 
                    // in the context of its parent element we can use the id for the node test
                    predicates.push(`@id="${node.id}"`);
                }
            }

            if (predicates.length === 0) {
                // Get node index by counting previous siblings of the same name & type
                let index = 1;

                for (let sibling = node.previousSibling; sibling; sibling = sibling.previousSibling) {
                    // Skip DTD,
                    // Skip nodes of differing type AND name (tagName for elements, #text for text),
                    // as they are indexed by node type
                    if (sibling.nodeType === Node.DOCUMENT_TYPE_NODE ||
                        node.nodeType !== sibling.nodeType ||
                        sibling.nodeName !== node.nodeName) {
                        continue;
                    }

                    index++;
                }

                // nodes at index 1 (1-based) are implicitly selected
                if (index > 1) {
                    predicates.push(`${index}`);
                }
            }

            // format predicates
            tests.unshift(test + predicates.map(p => `[${p}]`).join(''));
        } // end for

        // return empty path string if unable to create path
        return tests.length === 0 ? "" : `/${tests.join('/')}`;
    };

    getElementByXPath(path) {
        return (new XPathEvaluator())
            .evaluate(path, document.documentElement, null,
                XPathResult.FIRST_ORDERED_NODE_TYPE, null)
            .singleNodeValue;
    }
    getAllTextNodes(node) {
        var list = [];
        if (node) {
            if (node.firstChild == null && node.nodeType === Node.TEXT_NODE) {
                list[list.length] = node;
            }
            node = node.firstChild;
            while (node != null) {

                if (node.nodeType == Node.TEXT_NODE) {

                    if (node.parentNode.tagName == "SCRIPT" || node.parentNode.tagName == "STYLE") {
                        node = node.nextSibling;
                        continue;
                    }
                    list[list.length] = node;
                }
                else {
                    list = list.concat(this.getAllTextNodes(node));
                }
                node = node.nextSibling;
            }
        }
        return list;
    }

    getSafeRanges(dangerous) {
        //https://stackoverflow.com/questions/304837/javascript-user-selection-highlighting

        var a = dangerous.commonAncestorContainer;
        // Start
        var s = new Array(0), rs = new Array(0);
        if (dangerous.startContainer != a)
            for (var i = dangerous.startContainer; i != a; i = i.parentNode)
                s.push(i)
                    ;
        if (0 < s.length) for (var i = 0; i < s.length; i++) {
            var xs = document.createRange();
            if (i) {
                xs.setStartAfter(s[i - 1]);
                xs.setEndAfter(s[i].lastChild);
            }
            else {
                xs.setStart(s[i], dangerous.startOffset);
                xs.setEndAfter(
                    (s[i].nodeType == Node.TEXT_NODE)
                        ? s[i] : s[i].lastChild
                );
            }
            rs.push(xs);
        }

        // End
        var e = new Array(0), re = new Array(0);
        if (dangerous.endContainer != a)
            for (var i = dangerous.endContainer; i != a; i = i.parentNode)
                e.push(i)
                    ;
        if (0 < e.length) for (var i = 0; i < e.length; i++) {
            var xe = document.createRange();
            if (i) {
                xe.setStartBefore(e[i].firstChild);
                xe.setEndBefore(e[i - 1]);
            }
            else {
                xe.setStartBefore(
                    (e[i].nodeType == Node.TEXT_NODE)
                        ? e[i] : e[i].firstChild
                );
                xe.setEnd(e[i], dangerous.endOffset);
            }
            re.unshift(xe);
        }

        // Middle
        var m = [];
        if ((0 < s.length) && (0 < e.length)) {
            var middle_start = s[s.length - 1].nextSibling;
           
            while (middle_start != e[0] && middle_start != null) {
                for (var node of this.getAllTextNodes(middle_start)) {
                    var xm = document.createRange();
                    xm.setStartBefore(node);
                    xm.setEndAfter(node);
                    m.push(xm);
                }
                middle_start = middle_start.nextSibling;
            }
        }
        else {
            return [dangerous];
        }
        rs = rs.concat(m);
        return rs.concat(re);
    }

    onAdded(callback) {
        this.eventHandlers["added"].push(callback);
    }
    onRemoved(callback) {
        this.eventHandlers["removed"].push(callback);
    }
}

let annotationMarker = new AnnotationMarker();
