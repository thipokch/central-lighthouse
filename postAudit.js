'use strict';

let fs = require('fs');

let manifests = JSON.parse(process.env.MANIFEST);

function processReport(reportManifest) {
    let rawJson = fs.readFileSync( reportManifest.jsonPath );
    let lhJson = JSON.parse(rawJson);
    console.log(lhJson);
}

manifests.forEach(manifest =>
    processReport(manifest)
)

