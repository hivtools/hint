import {defineConfig, Plugin, ViteDevServer} from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import browserslistToEsbuild from "browserslist-to-esbuild";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import http, {IncomingMessage, ServerResponse} from "node:http";
import https from "node:https";

// How the built files get to the browser
// --------------------------------------
// The build writes the files with hashed names to ./public/assets, and ./public/index.html with the tags for them.
// The Python API sends ./public/index.html for the pages of the app (/, /projects, /accessibility, /privacy), and
// serves ./public at /public/. The page has nothing in it for one user: the app asks GET /me.
// The Python API makes the login and 404 pages (hint-py/app/templates). They use ./public/css/app.css, which the build
// writes with a fixed name. The build also still writes ./public/vite-assets.ftl, for the old Kotlin app's index.ftl
// (`npm run copy` copies its templates to ./public), until the Kotlin app is deleted.

// The browsers that we support. Vue CLI used this list by default, so it is the same as before.
// Vite does not read browserslist. browserslist-to-esbuild changes the list to targets such as "chrome151",
// which Vite gives to Oxc (JavaScript) and Lightning CSS (CSS).
const packageJson = JSON.parse(readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf-8"));
const buildTargets = browserslistToEsbuild(packageJson.browserslist);

const base = "/public/";

// The pages of the app (vue-router's routes). The Python API sends index.html for each.
const appPages = new Set(["/", "/projects", "/accessibility", "/privacy"]);

// The URL of the back end (nginx in front of the Python API) for `npm run dev`.
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
// Vite puts the tags for the entry script, the preloaded chunks and the CSS into index.html. index.html stays in the
// build, for the Python API.
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
            source: ["<!-- Written by the Vite build (vite.config.ts). Do not edit. -->", ...tags].join("\n") + "\n"
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
    }
});

// Gets a page from the back end with the browser's headers (and so its cookies), as it is. Only the login page
// (from the Python API) comes this way: redirects (for example to Auth0) and errors go back to the browser as they are.
const sendBackendPage = (server: ViteDevServer, req: IncomingMessage, res: ServerResponse) => {
    const url = req.url || "/";
    const client = backendUrl.protocol === "https:" ? https : http;
    const backendReq = client.request(new URL(url, backendUrl), {
        method: "GET",
        headers: req.headers
    }, backendRes => {
        res.writeHead(backendRes.statusCode || 502, backendRes.headers);
        backendRes.pipe(res);
    });
    backendReq.on("error", error => {
        server.config.logger.error(`Cannot reach the back end at ${backendUrl.origin}: ${error.message}`);
        res.statusCode = 502;
        res.setHeader("Content-Type", "text/plain");
        res.end(`Cannot reach the back end at ${backendUrl.origin}. Start it, or set HINT_BACKEND_URL.`);
    });
    backendReq.end();
};

// The page of the app, from ./index.html, with the dev entry, as the Python API sends the built copy
const sendAppPage = async (server: ViteDevServer, req: IncomingMessage, res: ServerResponse) => {
    const html = readFileSync(fileURLToPath(new URL("./index.html", import.meta.url)), "utf-8");
    const page = await server.transformIndexHtml(req.url || "/", html);
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "no-cache");
    res.end(page);
};

// The login and 404 pages use /public/css/app.css. The dev server makes it from the source,
// so that these pages have their styles before the first `npm run build`.
const sendLoginCss = async (server: ViteDevServer, res: ServerResponse) => {
    const css = await server.ssrLoadModule("/src/scss/style.scss?inline");
    res.setHeader("Content-Type", "text/css");
    res.end(css.default);
};

// Dev server only. Sends the page of the app itself (with hot reload), and gets the other pages (login) from the
// back end. All other requests go to the back end through the proxy below.
const devPages = (): Plugin => ({
    name: "hint:dev-pages",
    apply: "serve",
    configureServer(server) {
        server.middlewares.use((req, res, next) => {
            const url = req.url || "/";
            const path = url.split("?")[0];
            if (req.method !== "GET" || vitePaths.test(url)) {
                next();
            } else if (path === `${base}css/app.css`) {
                sendLoginCss(server, res).catch(next);
            } else if (appPages.has(path)) {
                sendAppPage(server, req, res).catch(next);
            } else if ((req.headers.accept || "").includes("text/html")) {
                sendBackendPage(server, req, res);
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
        // Adds the Vue DevTools to the dev server. It does nothing in the build.
        vueDevTools(),
        freemarkerAssets(),
        devPages()
    ],
    resolve: {
        alias: [
            // Use the Vue build without the template compiler. Our components are .vue files, which the build
            // compiles to render functions. Two CommonJS libraries (@reside-ic/vue3-treeselect and
            // @reside-ic/vue-next-dynamic-form) call require("vue"), which gives the full build with the
            // compiler. Their components have render functions, so they do not need the compiler.
            // The unit tests (vitest.config.ts merges this file) keep the full build, because some tests mount
            // components that have a template string. Vitest sets VITEST.
            ...(process.env.VITEST ? [] : [{find: /^vue$/, replacement: "vue/dist/vue.runtime.esm-bundler.js"}])
        ]
    },
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
