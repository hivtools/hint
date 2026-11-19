# HINT front end

A Vue 3 app with Vuex, built with [Vite](https://vite.dev). The source and the tests are in `./src`.
The build writes to `./public`, and Kotlin serves that folder at `/public/`.

## Editor

[VS Code](https://code.visualstudio.com/) with the [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
extension (it was called Volar), or IntelliJ. The repository has IntelliJ style files: <kbd>ctrl + alt + l</kbd> (Linux)
formats a file to the lint rules.

## Install

Use the Node version in `.nvmrc`.

```sh
npm install
```

## Dev server with hot reload

Start Kotlin without a front-end build, then start the Vite dev server. See the [main README](../../../README.md).

```sh
# from the root of the repository
src/gradlew -PhotReload=true -p src app:bootRun
# from this folder, in another terminal
npm run dev
```

Open http://localhost:5173, not port 8080. The dev server gets each page from Kotlin (with your cookies) and adds the
code from `./src`. It sends all other requests to Kotlin. If Kotlin is not at http://localhost:8080, set
`HINT_BACKEND_URL`, for example `HINT_BACKEND_URL=http://localhost:8081 npm run dev`.

## Production build

```sh
npm run build      # type check, then build into ./public
npm run typecheck  # type check only (CI runs this too)
```

To see the production build in a browser, run `npm run build`, start Kotlin without `-PhotReload=true`, and open
http://localhost:8080.

The build writes:

- `./public/assets/`: the JavaScript and CSS files. Each name contains a hash of the content, so a browser never uses an
  old file after a deploy. The `.map` files are the source maps.
- `./public/vite-assets.ftl`: the `<script>` and `<link>` tags for the current build. `index.ftl` includes it.
- `./public/css/app.css`: a copy of the CSS with a fixed name, for `login.ftl` and `404.ftl`.

`npm run copy` copies the templates and the images to `./public`. Gradle runs it after the build.

The type check (`tsconfig.typecheck.json`) does not check the `<template>` blocks or the `.d.ts` files. The old Vue CLI
build did not check them either.

## Tests

| What | Command | Files | Config |
| --- | --- | --- | --- |
| Unit tests ([Vitest](https://vitest.dev/)) | `npm test` | `src/tests/**/*.test.ts` | `vitest.config.mts` |
| Integration tests | `npm run integration-test` | `src/tests/**/*.itest.ts` | `test-integration-configs/integration.mts` |
| ADR integration tests | `npm run adr-integration-test` | `adr-dataset.itest.ts` | `test-integration-configs/adr-integration.ts` |
| Browser tests ([Playwright](https://playwright.dev)) | `npm run browser-test` | `src/tests/e2e/*.spec.ts` | `playwright.config.ts` |

- The integration tests need the app and its dependencies. Start them with
  `./scripts/run-dev-dependencies-for-integration-tests.sh` from this folder.
- The browser tests need a running app at http://localhost:8080 (set `baseURL` to use another address). The first time,
  install the browsers with `npx playwright install`.
- Some useful Playwright options: `npm run browser-test -- smoke.spec.ts` runs one file, and `-- --debug` opens the
  inspector.

## Lint

```sh
npm run lint
```

CI fails if there are lint errors. We use the basic TypeScript and Vue recommendations. Our only custom rule: the
content of the `<template>` and `<script>` blocks of a Vue component is indented by 4 spaces.

## Types from hintr

`src/app/generated.d.ts` is made from the [hintr API schema](https://github.com/hivtools/hintr/tree/main/inst/schema).
To make it again, run this from this folder:

```sh
./scripts/generate-types.sh <HINTR_BRANCH>
```

## Supported browsers

The `browserslist` field in `package.json` gives the browsers that we support. The build uses this list to select the
JavaScript and CSS syntax. It does not add polyfills. To see the browsers in the list, run `npx browserslist`.
