'use strict';

let fs = require('fs');

let manifests = JSON.parse(process.env.MANIFEST);

function processReport(lhJson) {
    console.log(lhJson);
    let audits = lhJson.audits;
    console.log(audits["service-worker"].title);
}

manifests.forEach(manifest => {
    let rawJson = fs.readFileSync( manifest.jsonPath );
    let lhJson = JSON.parse(rawJson);

    processReport(lhJson);
})

