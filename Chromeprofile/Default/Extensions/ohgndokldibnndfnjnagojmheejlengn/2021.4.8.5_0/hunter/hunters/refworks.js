var hunter = new function () {
    this.fileName = "refworks.js";
    this.name = "RefWorks";
    this.id = "5985E02E-2B17-4F34-BFC6-B5BC16D3379D";
    this.importFormat = "0a41ea70-fde9-4897-bfba-a7338ca787ad";
    this.priority = 10;
    this.supportsRefresh = true;
    this.identifyUrl = function (url) { return url.indexOf("refworks.com/refworks2") != -1; };


    this.identify = function () {
        var counter = 0;
        try {
            var element = document.querySelector('span[id="current_result_total"]');
            if (element) {
                return element.textContent;
            }
            return 0;
        }
        catch (e) {
            console.error(e);
        }
        return counter;
    };

    this.retrieveWindowVariables = function (variables) {
        var ret = {};

        var scriptContent = "";
        for (var i = 0; i < variables.length; i++) {
            var currVariable = variables[i];
            scriptContent += "if (typeof " + currVariable + " !== 'undefined') document.body.setAttribute('tmp_" + i + "', " + currVariable + ");\n";
        }

        var script = document.createElement('script');
        script.id = 'citaviPickerTmpScript';
        script.appendChild(document.createTextNode(scriptContent));
        (document.body || document.head || document.documentElement).appendChild(script);

        for (var i = 0; i < variables.length; i++) {
            var currVariable = variables[i];
            ret[i] = document.body.getAttribute("tmp_" + i);
            document.body.removeAttribute("tmp_" + i);
        }

        script = document.getElementById("citaviPickerTmpScript");
        script.remove();

        return ret;
    };

    this.scanAsync = async function () {
        try {
            var lastSelected = this.retrieveWindowVariables(["REFWORKS.Folders.lastSelected"])["0"];
            var count = 0;
            var site = "";
            var name = "";
            
            if (lastSelected != null && lastSelected.length > 0 && lastSelected != "false") {
                count = this.retrieveWindowVariables(["REFWORKS.Folders.FolderCollection[REFWORKS.Folders.lastSelected].count"])["0"];
                site = this.retrieveWindowVariables(["REFWORKS.Folders.FolderCollection[REFWORKS.Folders.lastSelected].site"])["0"];
                name = this.retrieveWindowVariables(["REFWORKS.Folders.FolderCollection[REFWORKS.Folders.lastSelected].name"])["0"];
                
            }
            else {
                lastSelected = "false";
                name = "false";
                count = this.identify();
            }

            if (window.folders === undefined) {
                window.folders = {};
            }

            if (window.folders[lastSelected] === undefined) {
                window.folders[lastSelected] = {};
                window.folders[lastSelected].count = count;
                window.folders[lastSelected].records = [];
                window.folders[lastSelected].site = site;
                window.folders[lastSelected].name = name;
            }
            else {
                if (window.folders[lastSelected].count === count) {
                    return window.folders[lastSelected].records;
                }
                window.folders[lastSelected].count = count;
                window.folders[lastSelected].records = [];
            }

            var url = "";

            if (site != null) {
                url = `https://www.refworks.com/refworks2/Default.aspx?r=file_input::format_list&site=${site}&file_type=text&type=xml&selection=byid&folder=all%7Call_references%7C%7C&output_style=16`;
            }
            else {
                if (name !== "false") {
                    url = `https://www.refworks.com/refworks2/Default.aspx?r=file_input::format_list&file_type=text&type=xml&selection=byid&folder=all%7Cfolder%7C%7C${name}&output_style=16`;
                }
                else {
                    url = `https://www.refworks.com/refworks2/Default.aspx?r=file_input::format_list&file_type=text&type=xml&selection=byid&folder=all%7Call_references%7C%7Cfalse&output_style=16`;
                }
            }

            var repsonse = await fetch(url);
            var xml = await repsonse.text();
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(xml, "text/xml");
            var file_name = xmlDoc.getElementsByTagName("file_name")[0].textContent;
            var file_token = xmlDoc.getElementsByTagName("RWManuscript")[0].getAttribute("FileToken");
            var downloadUrl = `https://www.refworks.com/refworks2/default.aspx?r=file::get_file&file_name=${file_name}&content_type=text%2Fplain&file_token=${file_token}`;
            response = await fetch(downloadUrl);
            var ris = await response.text();
            var ris_records = ris.split('ER  -');
            for (var record of ris_records) {
                var record_trimmed = record.trim();
                if (record_trimmed.length === 0) {
                    continue;
                }
                record_trimmed += "\r\nER  -\r\n";
                window.folders[lastSelected].records.push(record_trimmed);
            }

            return window.folders[lastSelected].records;
        }
        catch (e) {
            console.error(e);
        }
        return [];
    };
};

if (typeof hunters !== 'undefined') {
    hunters.add(hunter);
}