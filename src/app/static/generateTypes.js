const schemaToTs = require('json-schema-to-typescript');
const request = require('request');
const fs = require("fs");
const $ = require("cheerio");

const stream = fs.createWriteStream("types.d.ts", {flags:'a'});
const dir = "https://github.com/mrc-ide/hintr/tree/master/inst/schema";

function addInterface(url, name) {
    request(url, function (err, response, body) {
        schemaToTs.compile(JSON.parse(body), name)
            .then(ts => stream.write(ts + "\n", (e) => {if (e) console.log(e)}));
    });
}

request(dir, function (err, response, body) {
    $(".js-navigation-open", body).each(function() {
        const url = $(this).attr("href");
        const matches = url.match(/(mrc-ide\/hintr\/blob\/master\/inst\/schema\/)(.*.schema\.json)/);
        if (matches) {
            addInterface("http://github.com/mrc-ide/" + url, matches[2].split(".")[0])
        }
    });
});


