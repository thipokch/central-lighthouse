'use strict';

let fs = require('fs');

let lhReportDirectory = './.lighthouseci'
let lhUrls = [ 'central.co.th', 'kingpower.com', 'monline.com', 'shopee.co.th', 'lazada.co.th']

function processReport(url) {
    let rawdata = fs.readFileSync(lhReportDirectory + '/' + url.replaceAll('.','_') + '.report.json' );
    let lhJson = JSON.parse(rawdata);
    console.log(lhJson);
}

lhUrls.forEach(lhUrl => {
    processReport(lhUrl)
})


