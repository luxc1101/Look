async function fetch2(url) {
    if (!isNullOrUndefined(pdfLookup.proxy) && pdfLookup.proxy.isEZProxy) {
        return pdfLookup.proxy.fetch(url);
    }
    try {
        return await fetch(url);
    }
    catch (e) {
        telemetry.error(e);
    }
    return { ok: false };
}
