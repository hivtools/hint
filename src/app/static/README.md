# HINT front end

A Vue 3 app with Vuex, built with [Vite](https://vite.dev). The source and the tests are in `./src`.
The build writes to `./public`. The Python API (`hint-py`) sends `./public/index.html` for the pages of the app, and
serves the folder at `/public/`.

## Editor

[VS Code](https://code.visualstudio.com/) with the [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
extension (it was called Volar), or IntelliJ. The repository has IntelliJ style files: <kbd>ctrl + alt + l</kbd> (Linux)
formats a file to the lint rules. `.editorconfig` gives the basic style (for example, indent with 4 spaces) to the
editors that read it.

## Install

Use the Node version in `.nvmrc`.

```sh
npm install
```

## Dev server with hot reload

Start the dev stack (`./scripts/dev.sh up` from the root, see the [main README](../../../README.md)), then start the
Vite dev server:

```sh
npm run dev
```

Open http://localhost:5173, not port 8080. The dev server sends the page of the app itself (`./index.html`, with the
code from `./src`). It sends all other requests to the dev stack's proxy, with your cookies: the API, `GET /me`, and
the login page (still Kotlin). If the proxy is not at http://localhost:8080, set `HINT_BACKEND_URL`, for example
`HINT_BACKEND_URL=http://localhost:18080 npm run dev`.

The dev server also adds the [Vue DevTools](https://devtools.vuejs.org/) to the page. Press <kbd>alt + shift + d</kbd>
to open them. The production build does not include them.

## Production build

```sh
npm run build       # type check and build into ./public (at the same time)
npm run build-only  # build only
npm run type-check  # type check only (CI runs this too)
```

To see the production build in a browser, run `npm run build && npm run copy` with the dev stack running, and open
http://localhost:8080. The Python API serves the new build at once.

The build writes:

- `./public/assets/`: the JavaScript and CSS files. Each name contains a hash of the content, so a browser never uses an
  old file after a deploy. The `.map` files are the source maps.
- `./public/index.html`: the page of the app, with the `<script>` and `<link>` tags for the current build. It has
  nothing in it for one user: the app asks `GET /me` who the user is before it starts (`src/app/me.ts`).
- `./public/vite-assets.ftl`: the same tags, for Kotlin's `index.ftl`, which nothing routes to any more. It goes when
  the Kotlin app goes.
- `./public/css/app.css`: a copy of the CSS with a fixed name, for `login.ftl` and `404.ftl`.

`npm run copy` copies the templates (Kotlin's login page) and the images to `./public`. Gradle and `scripts/dev.sh` run
it after the build.

The type check is `vue-tsc --build`. It checks the projects in `tsconfig.json`, as in a new
[create-vue](https://github.com/vuejs/create-vue) app:

| Config | Files |
| --- | --- |
| `tsconfig.app.json` | the app (`src/app`) |
| `tsconfig.vitest.json` | the unit and integration tests (`src/tests`) |
| `tsconfig.node.json` | the config files for Vite, Vitest, ESLint and Playwright |
| `src/tests/e2e/tsconfig.json` | the Playwright tests |

The type check also checks the `<template>` blocks of the components. It does not check the `.d.ts` files of the
packages (`skipLibCheck`).

## Tests

| What | Command | Files | Config |
| --- | --- | --- | --- |
| Unit tests ([Vitest](https://vitest.dev/)) | `npm run test:unit` | `src/tests/**/*.test.ts` | `vitest.config.ts` |
| Integration tests | `npm run test:integration` | `src/tests/**/*.itest.ts` | `test-integration-configs/integration.ts` |
| ADR integration tests | `npm run test:adr-integration` | `adr-dataset.itest.ts` | `test-integration-configs/adr-integration.ts` |
| Browser tests ([Playwright](https://playwright.dev)) | `npm run test:e2e` | `src/tests/e2e/*.spec.ts` | `playwright.config.ts` |

- `npm run test:unit` watches the files and runs the tests again when you change a file. To run the tests one time,
  use `npm run test:unit -- --run`. Add `--coverage` to get the coverage (CI does this).

- The integration tests need the app and its dependencies. Start them with
  `./scripts/run-dev-dependencies-for-integration-tests.sh` from this folder.
- The browser tests need the dev stack at http://localhost:8080 (set `baseURL` to use another address). The first time,
  install the browsers with `npx playwright install`.
- Some useful Playwright options: `npm run test:e2e -- smoke.spec.ts` runs one file, and `-- --debug` opens the
  inspector.

## Lint

```sh
npm run lint        # fixes what ESLint can fix, and lists the other errors
npm run lint:check  # only lists the errors, as CI does
```

CI runs `lint:check` and fails if there are lint errors. The config is `eslint.config.ts`. We use the basic ESLint, TypeScript and Vue
recommendations. ESLint checks the app, the tests and the config files. As in create-vue, the unit and integration tests
also get the recommended rules of [`@vitest/eslint-plugin`](https://github.com/vitest-dev/eslint-plugin-vitest), and the
Playwright tests get the recommended rules of
[`eslint-plugin-playwright`](https://github.com/mskelton/eslint-plugin-playwright).

Our custom rules:

- You can import `rawDeepClone` only in Vuex actions and mutations (and in the tests), because Vue does not track its
  reads, so a `computed` or `watch` that uses it does not update.
- `vitest/expect-expect` (a test must call `expect`) also accepts our helper functions whose names start with
  `expect`, `assert`, `check` or `test`, for example `expectTranslated`.
- A component emits events with camelCase names (`emit("setValue")`), as the Vue docs do
  (`vue/custom-event-name-casing`). A parent template still listens with kebab-case (`@set-value`).

ESLint checks the indentation: 4 spaces. In a `.vue` file the content of `<template>` is indented by one level and the
content of `<script>` is not, as in the Vue docs (`vue/html-indent` with `baseIndent: 1` and `vue/script-indent` with
`baseIndent: 0`, and `@stylistic/indent` for the other files). The IntelliJ style files use the same indentation.
`npm run lint` corrects it.

## Types from hintr

`src/app/generated.d.ts` is made from the [hintr API schema](https://github.com/hivtools/hintr/tree/main/inst/schema).
To make it again, run this from this folder:

```sh
./scripts/generate-types.sh <HINTR_BRANCH>
```

## Supported browsers

The `browserslist` field in `package.json` gives the browsers that we support. The build uses this list to select the
JavaScript and CSS syntax. It does not add polyfills. To see the browsers in the list, run `npx browserslist`.
