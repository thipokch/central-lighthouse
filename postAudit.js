'use strict';

const fs = require('fs');
const path = require('path');
const dotenv = require("dotenv");
const { GoogleSpreadsheet } = require('google-spreadsheet');

dotenv.config();


/*
 * Functions to process the report
 */

function getManifest() {
    console.log(`Reading manifest from environment variable...`);
    return JSON.parse(process.env.MANIFEST);
}

function getReport(manifestEntry) {

    console.log(`Reading JSON file: ${manifestEntry.jsonPath}`);
    let rawJson = fs.readFileSync( manifestEntry.jsonPath );
    let lhJson = JSON.parse(rawJson);

    console.log(`JSON loaded: ${lhJson["requestedUrl"]}`);
    lhJson["filename"] = path.basename(manifestEntry.htmlPath);
    return {...lhJson, ...manifestEntry.summary};
}

/*
 * Functions to upload to Google Sheets
 */

async function uploadReport(doc, report) {
    console.log(`Request URL: ${report.requestedUrl}`);
    const requestedUrl = new URL(report.requestedUrl);
    console.log(`Request Hostname: ${requestedUrl.hostname}`);
    const requestedHostname = requestedUrl.hostname;

    var audits = {};
    // var auditDescriptions = {};

    for (let [key, value] of Object.entries(report.audits)) {
        switch (value.scoreDisplayMode) {
            case "binary":
                audits[key] = Boolean(value.score);
                break;
            case "numeric": 
                audits[key] = value.numericValue;
                break;
            default:
                break;
        }

        // auditDescriptions[key] = {
        //     "field": value.id,
        //     "title": value.title,
        //     "description": value.description
        // }
    }
    
    const reportData = { 
        "url": report.requestedUrl,
        "hostname": requestedHostname,
        "performance": report.performance,
        "accessibility": report.accessibility,
        "best-practices": report["best-practices"],
        "seo": report.seo,
        "pwa": report.pwa,
        "requestedUrl": ('//gh.thipok.ch/central-lighthouse/reports/' + report.filename),
        "finalUrl": report.finalUrl,
        "reportUrl": report.reportUrl,
        "fetchTime": report.fetchTime,
        "userAgent": report.userAgent,
        "lighthouseVersion": report.lighthouseVersion,
        "gatherMode": report.configSettings.gatherMode,
        "benchmarkIndex": report.environment.benchmarkIndex,
        "formFactor": report.configSettings.formFactor,
        "throttlingMethod": report.configSettings.throttlingMethod,
        "width": report.configSettings.screenEmulation.width,
        "height": report.configSettings.screenEmulation.height,
        "deviceScaleFactor": report.configSettings.screenEmulation.deviceScaleFactor,
        ...audits
    }

    const reportHeader = Object.keys(reportData);

    const sheet = await loadSheet(doc, requestedHostname, reportHeader);
    await sheet.addRow(reportData);

}

async function loadSheet(doc, requestedHostname, headers) {
    await refresh(doc);

    if (!(requestedHostname in doc.sheetsByTitle)) {
        console.log(`Creating sheet: ${requestedHostname}`)
        await doc.addSheet({
            title: requestedHostname,
            headerValues: ["url"]
        });
    }

    await refresh(doc);

    const sheet = doc.sheetsByTitle[requestedHostname];
    console.log(`Loaded sheet: ${sheet.title}`);

    await sheet.loadHeaderRow();

    const currentHeaders = sheet.headerValues;
    console.log(`Current headers: ${currentHeaders.join(', ')}`);

    const diff = headers.filter(header => !currentHeaders.includes(header));
    console.log(`Headers to add: ${diff.join(', ')}`);

    const newHeaders = [...currentHeaders, ...diff]

    if(currentHeaders.length < newHeaders.length) {
        console.log(`Resizing columns: ${Math.pow( 2, Math.ceil( Math.log2(newHeaders.length) ) )}`);
        await sheet.resize({ rowCount: sheet.rowCount, columnCount: Math.pow( 2, Math.ceil( Math.log2(newHeaders.length) ) ) });
    }

    console.log('Setting headers.')
    await sheet.setHeaderRow(newHeaders);

    return sheet;
}

async function initGSheet() {
    console.log('Initializing Google Sheets...');
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);

    console.log('Authenticating Google Sheets...');
    // Initialize Auth - see https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
    await doc.useServiceAccountAuth({
        // env var values are copied from service account credentials generated by google
        // see "Authentication" section in docs for more info
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
    
    console.log('Loading Google Sheets...');
    await doc.loadInfo(); // loads document properties and worksheets

    console.log(`Loaded ${doc.title}`);
    return doc;
}

async function refresh(doc) {
    doc.resetLocalCache();
    await doc.loadInfo(); 
}

// async function updateDescriptions(doc, reports) {
//     const sheet = await loadSheet(doc, 'Description');
//     var auditHeaders = {};

//     for (const report of reports) {
//         le
//         for (let [key, value] of Object.entries(report.audits)) {
//             switch (value.scoreDisplayMode) {
//                 case "binary":
//                     audits[key] = Boolean(value.score);
//                 case "numeric": 
//                     audits[key] = value.numericValue;
//                 default:
//                     break;
//             }
//         }
//     }
// }

/*
 * Run
 */

const main = async () => {
    const doc = await initGSheet();
    const manifest = getManifest();
    const reports = manifest.map( getReport );

    for (const report of reports) {
        await uploadReport(doc, report);
    }
};

main();
