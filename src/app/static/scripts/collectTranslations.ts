import * as fs from 'fs';
import {locales}  from "../src/store/translations/locales"
import path from "path";

// Import the locales file dynamically
async function convertTranslationsToCsv() {
    const keys = Object.keys(locales.en);

    // Generate CSV content
    const csvLines = [
        ['key', 'en', 'fr', 'pt'].join(',')
    ];

    keys.forEach(key => {
        csvLines.push([
            '"' + key + '"',
            '"' + locales.en[key]?.replaceAll('"', '""') + '"',
            '"' + locales.fr[key]?.replaceAll('"', '""') + '"',
            '"' + locales.pt[key]?.replaceAll('"', '""') + '"'
        ].join(','));
    });

    // Write to CSV file
    const outputPath = path.resolve('translations.csv');
    fs.writeFileSync(outputPath, csvLines.join('\n'));

    console.log(`CSV file created at: ${outputPath}`);
}

convertTranslationsToCsv();
