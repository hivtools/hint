'use strict';

const schemaToTs = require('json-schema-to-typescript');
const fs = require('fs');
const path = require('path');
const dir = `hintr-${process.argv[2]}/inst/schema`;

fs.readdir(dir, function (err, files) {
    if (err) {
        console.error("Could not list the directory.", err);
        process.exit(1);
    }

    files.forEach(function (file) {
        if (file.endsWith(".schema.json")) {
            const filePath = path.join(dir, file);

            try {
                schemaToTs.compileFromFile(filePath, {cwd: dir, bannerComment: ""})
                    .then(ts => fs.writeFileSync(`types/${file.split(".")[0]}.d.ts`, ts))
            } catch (e) {
                console.log(e);
            }
        }
    });
});
