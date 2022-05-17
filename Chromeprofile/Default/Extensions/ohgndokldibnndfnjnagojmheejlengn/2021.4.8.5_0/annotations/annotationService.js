class AnnotationService {
    constructor() {
        this.list = {};
    }

    async createAnnotation(fldName, text, id, tab) {

        try {

            if (isNullOrUndefined(id)) {
                telemetry.warn("annotation id must not be null");
                return false;
            }

            if (isNullOrUndefined(text)) {
                telemetry.warn("annotation text must not be null");
                return false;
            }

            if (citaviPicker.activeRepo.isLocal &&
                !citaviPicker.activeRepo.isCitavi65OrNewer) {
                telemetry.log("annotation feature is not available");
                return false;
            }

            telemetry.log("create annotation: " + fldName + " (" + id + "). Project: " + settings.projectKey);

            var code = "var r = annotationMarker.create(); r;";
            chrome.tabs.executeScript(tab.id, { code: code }, async (r) => {
                if (r && r.length === 1) {
                    var annotation = JSON.parse(r[0]);
                    if (annotation.exeception) {
                        telemetry.error(annotation.exception);
                        return;
                    }
                    annotation.id = id;
                    annotation.projectKey = settings.projectKey;
                    annotation.type = QuotationType.directQuotation;
                    annotation.text = text;
                    annotation.createdOn = new Date().toISOString();
                    var result = await this.restore(annotation, tab);
                    if (result) {
                        this.save(annotation);
                    }
                }
            });
        }
        catch (e) {
            telemetry.error(e);
        }
    }

    get hasAnnotations() {
        return Object.keys(this.list).length > 0;
    }

    delete(annotation) {
        sessionStorage.removeItem(StorageKeys.annotation + annotation.id);
    }

    deleteAll() {
        for (var key of Object.keys(sessionStorage)) {
            if (!key.startsWith(StorageKeys.annotation)) {
                continue;
            }
            sessionStorage.removeItem(key);
        }
    }

    get(url) {
        var uri = new URL(url);
        url = uri.origin + uri.pathname;
        return this.list[url];
    }

    async update(url, tab) {
        var uri = new URL(url);
        url = uri.origin + uri.pathname;
        var annotations = [];
        for (var key of Object.keys(sessionStorage)) {

            if (!key.startsWith(StorageKeys.annotation)) {
                continue;
            }
            
            var annotation = JSON.parse(sessionStorage.getItem(key));

            if (annotation.url === url) {
                telemetry.log("restore annotation: " + annotation.id);
                await this.restore(annotation, tab);
                annotations.push(annotation);
            }
        }
        this.list[url] = annotations;
        return annotations;
    }

    restore(annotation, tab) {
        return new Promise(resolve => {
            var code = `var annotation = ${JSON.stringify(annotation)}; var r = annotationMarker.restore(annotation);r;`;
            chrome.tabs.executeScript(tab.id, { code: code }, (r) => {
                if (r && r.length === 1) {
                    annotation = JSON.parse(r[0]);
                    if (annotation.exeception) {
                        telemetry.error(annotation.exception);
                        return;
                    }
                    resolve(annotation);
                }
                else {
                    reject();
                }
            });
        });
    }

    save(annotation) {
        sessionStorage.setItem(StorageKeys.annotation + annotation.id, JSON.stringify(annotation));
    };
}