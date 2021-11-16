'use strict';

let fs = require('fs');

let manifests = JSON.parse(process.env.MANIFEST);

function processReport(json) {
    console.log(json);
}

manifests.forEach(manifest => {
    let rawJson = fs.readFileSync( manifest.jsonPath );
    let lhJson = JSON.parse(rawJson);

    processReport(lhJson);
})

