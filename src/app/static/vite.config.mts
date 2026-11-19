import {defineConfig, Plugin, ViteDevServer} from "vite";
import vue from "@vitejs/plugin-vue";
import legacy from "@vitejs/plugin-legacy";
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
// index.ftl, forgot-password.ftl and reset-password.ftl include that file.
// The build also writes ./public/css/app.css (a fixed name) for login.ftl and 404.ftl.

// The browsers that we support. Vue CLI used this list by default, so it is the same as before.
const packageJson = JSON.parse(readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf-8"));
const browserTargets: string[] = packageJson.browserslist;
const esbuildTargets = browserslistToEsbuild(browserTargets);

const base = "/public/";
const entry = "/src/app/index.ts";

// The templates put these markers around the include of vite-assets.ftl.
// The dev server replaces the part between the markers.
const assetsStartMarker = "<!-- vite-assets -->";
const assetsEndMarker = "<!-- /vite-assets -->";

// The URL of the back end (Kotlin, or nginx in front of it) for `npm run dev`.
const backendUrl = new URL(process.env.HINT_BACKEND_URL || "http://localhost:8080");

// Requests that the Vite dev server answers itself. It sends all other requests to the back end.
const vitePaths = /^\/(@vite\/|@id\/|@fs\/|src\/|node_modules\/|__vite_ping|__open-in-editor)/;
const notVitePaths = "^/(?!@vite/|@id/|@fs/|src/|node_modules/|__vite_ping|__open-in-editor)";

const sourceText = (source: string | Uint8Array) =>
    typeof source === "string" ? source : Buffer.from(source).toString("utf-8");

// Build only. Writes public/vite-assets.ftl and public/css/app.css from the index.html that Vite makes.
// Vite puts the tags for the entry script, the polyfills, the preloaded chunks and the CSS into index.html.
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
        // No legacy bundle: all the target browsers support ES modules.
        // modernPolyfills adds the core-js polyfills that the target browsers need, as Vue CLI did.
        legacy({
            modernTargets: browserTargets,
            modernPolyfills: true,
            renderLegacyChunks: false
        }),
        freemarkerAssets(),
        kotlinPages()
    ],
    build: {
        outDir: "public",
        emptyOutDir: true,
        target: esbuildTargets,
        cssTarget: esbuildTargets,
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks(id: string) {
                    if (id.includes("/node_modules/leaflet/")) {
                        return "leaflet";
                    }
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
