'use strict';

const fs = require('fs');
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
    return lhJson;
}

/*
 * Functions to upload to Google Sheets
 */

async function uploadReport(doc, report) {
    console.log(`Request URL: ${report.requestedUrl}`);
    const requestedUrl = new URL(report.requestedUrl);
    console.log(`Request Hostname: ${report.hostname}`);
    const requestedHostname = requestedUrl.hostname;

    const sheet = await loadSheet(doc, requestedHostname);

    const summary = report.summary;
    const audit = report.audit;
    const meta = {
        "requestedUrl": report.requestedUrl,
        "finalUrl": report.finalUrl,
        "fetchTime": report.fetchTime,
        "userAgent": report.userAgent,
        "lighthouseVersion": report.lighthouseVersion,
        "gatherMode": report.gatherMode,
        "benchmarkIndex": report.benchmarkIndex,
        "formFactor": report.configSettings.formFactor,
        "throttlingMethod": report.configSettings.throttlingMethod,
        "width": report.configSettings.screenEmulation.width,
        "height": report.configSettings.screenEmulation.height,
        "deviceScaleFactor": report.configSettings.screenEmulation.deviceScaleFactor,
    }

    const header = [ ...summary.keys(), ...audit.keys(), ...meta.keys() ]
    console.log(header)
}

async function loadSheet(doc, requestedHostname) {
    await doc.loadInfo();
    if (!(requestedHostname in doc.sheetsByTitle)) {
        await doc.addSheet({
            title: requestedHostname,
        });
    }

    await doc.loadInfo();
    return doc.sheetsByTitle[requestedHostname];
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

/*
 * Run
 */

const main = async () => {
    const doc = await initGSheet();
    const manifest = getManifest();
    const reports = manifest.map( getReport );

    console.log(reports)
    for (const report of reports) {
        await uploadReport(doc, report);
    }
};

main();
