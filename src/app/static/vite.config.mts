import {defineConfig, Plugin, ViteDevServer} from "vite";
import vue from "@vitejs/plugin-vue";
import browserslistToEsbuild from "browserslist-to-esbuild";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import http, {IncomingMessage, ServerResponse} from "node:http";
import https from "node:https";

// How the built files get to the browser
// --------------------------------------
// Kotlin makes the pages from the Freemarker templates in ./templates. `npm run copy` copies the
// templates to ./public, and Kotlin reads them from there. Kotlin serves ./public at /public/.
// The build writes the files with hashed names to ./public/assets. The `freemarkerAssets` plugin below
// writes ./public/vite-assets.ftl, which has the <script> and <link> tags for the current build.
// index.ftl includes that file.
// The build also writes ./public/css/app.css (a fixed name) for login.ftl and 404.ftl.

// The browsers that we support. Vue CLI used this list by default, so it is the same as before.
// Vite does not read browserslist. browserslist-to-esbuild changes the list to targets such as "chrome151",
// which Vite gives to Oxc (JavaScript) and Lightning CSS (CSS).
const packageJson = JSON.parse(readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf-8"));
const buildTargets = browserslistToEsbuild(packageJson.browserslist);

const base = "/public/";
const entry = "/src/app/index.ts";

// index.ftl puts these markers around the include of vite-assets.ftl.
// The dev server replaces the part between the markers.
const assetsStartMarker = "<!-- vite-assets -->";
const assetsEndMarker = "<!-- /vite-assets -->";

// The URL of the back end (Kotlin, or nginx in front of it) for `npm run dev`.
const backendUrl = new URL(process.env.HINT_BACKEND_URL || "http://localhost:8080");

// Requests that the Vite dev server answers itself. It sends all other requests to the back end.
const vitePaths = /^\/(@vite\/|@id\/|@fs\/|src\/|node_modules\/|__vite_ping|__open-in-editor)/;
const notVitePaths = "^/(?!@vite/|@id/|@fs/|src/|node_modules/|__vite_ping|__open-in-editor)";

// For codeSplitting.groups: matches the JS files of the npm packages with these names.
// It does not match CSS files. They stay in the CSS of the chunk that imports them, in the same order as before.
const packages = (...names: string[]) => {
    const escaped = names.map(name => name.replace(/[.]/g, "\\.").replace("/", "[\\\\/]"));
    const packageFile = new RegExp(`[\\\\/]node_modules[\\\\/](${escaped.join("|")})[\\\\/]`);
    return (id: string) => packageFile.test(id) && !/\.(css|scss)($|\?)/.test(id);
};

const sourceText = (source: string | Uint8Array) =>
    typeof source === "string" ? source : Buffer.from(source).toString("utf-8");

// Build only. Writes public/vite-assets.ftl and public/css/app.css from the index.html that Vite makes.
// Vite puts the tags for the entry script, the preloaded chunks and the CSS into index.html.
const freemarkerAssets = (): Plugin => ({
    name: "hint:freemarker-assets",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
        const html = bundle["index.html"];
        if (!html || html.type !== "asset") {
            this.error("The build did not make index.html, so it cannot write vite-assets.ftl");
        }
        const tags = sourceText(html.source).match(/<script\b[^>]*><\/script>|<link\b[^>]*>/g) || [];
        if (!tags.some(tag => tag.includes(`src="${base}assets/`))) {
            this.error("index.html has no script tag for the built entry");
        }
        this.emitFile({
            type: "asset",
            fileName: "vite-assets.ftl",
            source: ["<!-- Written by the Vite build (vite.config.mts). Do not edit. -->", ...tags].join("\n") + "\n"
        });

        const cssFiles = tags
            .filter(tag => tag.includes('rel="stylesheet"'))
            .map(tag => /href="([^"]+)"/.exec(tag)![1].slice(base.length));
        const css = cssFiles.map(fileName => {
            const asset = bundle[fileName];
            if (!asset || asset.type !== "asset") {
                this.error(`Cannot find the CSS file ${fileName} in the build`);
            }
            // The source map comment has a relative URL, which is wrong in the copy.
            return sourceText(asset.source).replace(/\/\*# sourceMappingURL=[^*]*\*\/\s*$/, "");
        });
        this.emitFile({type: "asset", fileName: "css/app.css", source: css.join("\n")});

        delete bundle["index.html"];
    }
});

const readBody = (message: IncomingMessage) => new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    message.on("data", chunk => chunks.push(chunk));
    message.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    message.on("error", reject);
});

// Puts the dev entry in place of the production tags. Pages without the markers (login, 404) do not change.
const toDevPage = async (server: ViteDevServer, url: string, html: string) => {
    const start = html.indexOf(assetsStartMarker);
    const end = html.indexOf(assetsEndMarker);
    if (start < 0 || end < start) {
        return html;
    }
    const devHtml = html.slice(0, start)
        + `<script type="module" src="${entry}"></script>`
        + html.slice(end + assetsEndMarker.length);
    return server.transformIndexHtml(url, devHtml);
};

// Gets a page from the back end with the browser's headers (and so its cookies).
// Redirects (for example to /login) and errors go back to the browser as they are.
const sendPage = (server: ViteDevServer, req: IncomingMessage, res: ServerResponse) => {
    const url = req.url || "/";
    const client = backendUrl.protocol === "https:" ? https : http;
    const backendReq = client.request(new URL(url, backendUrl), {
        method: "GET",
        headers: {...req.headers, "accept-encoding": "identity"}
    }, backendRes => {
        const status = backendRes.statusCode || 502;
        const isHtml = (backendRes.headers["content-type"] || "").includes("text/html");
        if (status !== 200 || !isHtml) {
            res.writeHead(status, backendRes.headers);
            backendRes.pipe(res);
            return;
        }
        readBody(backendRes)
            .then(html => toDevPage(server, url, html))
            .then(html => {
                const headers = {...backendRes.headers};
                delete headers["content-length"];
                delete headers["transfer-encoding"];
                res.writeHead(status, headers);
                res.end(html);
            })
            .catch(error => {
                server.config.logger.error(`Cannot make the dev page for ${url}: ${error}`);
                res.statusCode = 500;
                res.end(String(error));
            });
    });
    backendReq.on("error", error => {
        server.config.logger.error(`Cannot reach the back end at ${backendUrl.origin}: ${error.message}`);
        res.statusCode = 502;
        res.setHeader("Content-Type", "text/plain");
        res.end(`Cannot reach the back end at ${backendUrl.origin}. Start it, or set HINT_BACKEND_URL.`);
    });
    backendReq.end();
};

// The login and 404 pages use /public/css/app.css. The dev server makes it from the source,
// so that these pages have their styles before the first `npm run build`.
const sendLoginCss = async (server: ViteDevServer, res: ServerResponse) => {
    const css = await server.ssrLoadModule("/src/scss/style.scss?inline");
    res.setHeader("Content-Type", "text/css");
    res.end(css.default);
};

// Dev server only. Kotlin makes the pages (with the user in them). This plugin gets each page from Kotlin
// and replaces the production tags with the Vite entry, which gives hot reload.
const kotlinPages = (): Plugin => ({
    name: "hint:kotlin-pages",
    apply: "serve",
    configureServer(server) {
        server.middlewares.use((req, res, next) => {
            const url = req.url || "/";
            if (req.method !== "GET" || vitePaths.test(url)) {
                next();
            } else if (url.split("?")[0] === `${base}css/app.css`) {
                sendLoginCss(server, res).catch(next);
            } else if ((req.headers.accept || "").includes("text/html")) {
                sendPage(server, req, res);
            } else {
                next();
            }
        });
    }
});

export default defineConfig(({command}) => ({
    base: command === "build" ? base : "/",
    // ./public is the build output, so it cannot also be the Vite public folder.
    publicDir: false,
    plugins: [
        vue(),
        freemarkerAssets(),
        kotlinPages()
    ],
    build: {
        outDir: "public",
        emptyOutDir: true,
        target: buildTargets,
        cssTarget: buildTargets,
        sourcemap: true,
        rolldownOptions: {
            output: {
                codeSplitting: {
                    // Each group puts libraries in a chunk of their own, with a fixed name and no code of ours.
                    // The libraries change only when we upgrade them. Thus a deploy that changes only our code
                    // does not change the file names (hashes) of these chunks, and the browser keeps them in its cache.
                    // A chunk loads only when a chunk that the browser loads imports it. Thus the groups for the
                    // lazy libraries (see lazyComponent.ts) do not add to the start-up files.
                    // Use package names, not all of node_modules, so that a lazy library cannot get into a
                    // start-up chunk. A group also takes the dependencies of its packages.
                    groups: [
                        // Start-up libraries. "$initial" takes only the modules that the entry imports
                        // (not through import()), so that these groups can never take a lazy library.
                        {
                            name: "vue",
                            test: packages("vue", "@vue", "vue-router", "vuex"),
                            tags: ["$initial"],
                            priority: 20
                        },
                        {
                            name: "vendor",
                            test: packages("axios", "bootstrap-vue-next", "d3-scale-chromatic", "feather-icons",
                                "floating-vue", "i18next", "moment", "numeral", "qs", "vue-feather",
                                "@reside-ic/vue-nested-multiselect", "@reside-ic/vue3-treeselect"),
                            tags: ["$initial"],
                            priority: 10
                        },
                        // Lazy libraries. Without these groups, the build puts them in a chunk with our plot code.
                        {name: "plotly", test: packages("plotly.js-basic-dist")},
                        {name: "ag-grid", test: packages("ag-grid-community", "ag-grid-vue3")},
                        {name: "chartjs", test: packages("chart.js", "@kurkle/color", "vue-chartjs")},
                        // Not @vue-leaflet/vue-leaflet: it has an import(), so it uses Vite's preload helper, which
                        // the entry also uses. A group takes the dependencies of its packages, so the group would
                        // take the helper, and then the entry would load the Leaflet chunk at start-up.
                        {name: "leaflet", test: packages("leaflet")},
                        {name: "katex", test: packages("katex")},
                        {name: "dynamic-form", test: packages("@reside-ic/vue-next-dynamic-form")}
                    ]
                }
            }
        }
    },
    server: {
        proxy: {
            [notVitePaths]: {
                target: backendUrl.origin,
                // Keep the browser's Host header, so that the back end makes its redirects to the dev server.
                changeOrigin: false,
                xfwd: true
            }
        }
    }
}));
