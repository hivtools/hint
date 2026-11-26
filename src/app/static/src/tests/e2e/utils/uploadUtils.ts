import {type Locator, type Page, type Request, expect} from "@playwright/test";
import {translate} from "./translationUtils";

const uploadFileTypes = {
    spectrum: {
        translationKey: "PJNZ",
        testFile: "../testdata/Malawi2024.PJNZ"
    },
    shape: {
        translationKey: "shape",
        testFile: "../testdata/malawi.geojson"
    },
    population: {
        translationKey: "population",
        testFile: "../testdata/population.csv"
    },
    survey: {
        translationKey: "survey",
        testFile: "../testdata/survey.csv"
    },
    programme: {
        translationKey: "ART",
        testFile: "../testdata/programme.csv"
    },
    anc: {
        translationKey: "ANC",
        testFile: "../testdata/anc.csv"
    },
}

// Each baseline upload re-validates the survey, programme and ANC data in the background
// (uploadCallback in store/baseline/actions.ts). The upload's tick shows before that finishes,
// and when it lands it un-validates the model options.
const baselineUploads = ["spectrum", "shape", "population"];
const revalidatedDatasets = ["survey", "programme", "anc"];
// The project's first load gets the same paths, but tracking starts after that, once the project is open.
const revalidationPath = new RegExp(`^/disease/(${revalidatedDatasets.join("|")})$`);

export async function uploadAllTestFiles(page: Page) {
    const revalidation = trackRevalidation(page);
    for (const type of Object.keys(uploadFileTypes) as Array<keyof typeof uploadFileTypes>) {
        await uploadTestFile(page, type);
    }
    // Upload files first, then check they have uploaded successfully. Should be faster than
    // uploading, waiting for validation to complete and checking one by one.
    for (const type of Object.keys(uploadFileTypes) as Array<keyof typeof uploadFileTypes>) {
        await testUploaded(page, type);
    }
    // Wait for the background re-validation too, or it can undo a later "Validate" on model options.
    await revalidation.waitForAll(baselineUploads.length * revalidatedDatasets.length);
}

function trackRevalidation(page: Page) {
    const started = new Set<Request>();
    let finished = 0;
    const onRequest = (request: Request) => {
        if (request.method() === "GET" && revalidationPath.test(new URL(request.url()).pathname)) {
            started.add(request);
        }
    };
    const onDone = (request: Request) => {
        if (started.has(request)) {
            finished++;
        }
    };
    page.on("request", onRequest);
    page.on("requestfinished", onDone);
    page.on("requestfailed", onDone);
    return {
        async waitForAll(expected: number) {
            try {
                await expect.poll(() => finished, {
                    message: "survey, programme and ANC re-validation after the baseline uploads",
                    timeout: 30000
                }).toBeGreaterThanOrEqual(expected);
            } finally {
                page.off("request", onRequest);
                page.off("requestfinished", onDone);
                page.off("requestfailed", onDone);
            }
        }
    };
}

async function uploadTestFile(page: Page, type: keyof typeof uploadFileTypes) {
    const fileUpload = findFileUpload(page, type);
    await fileUploadBrowseButton(fileUpload).click();
    await fileUploadInput(fileUpload).setInputFiles(uploadFileTypes[type].testFile);
}

async function testUploaded(page: Page, type: keyof typeof uploadFileTypes) {
    const fileUpload = findFileUpload(page, type);
    await expect(fileUploadTick(fileUpload)).toBeVisible();
}

function fileUploadBrowseButton(fileUpload: Locator): Locator {
    return fileUpload.locator(".custom-file label");
}

function fileUploadTick(fileUpload: Locator): Locator {
    return fileUpload.locator(".tick");
}

function fileUploadInput(fileUpload: Locator): Locator {
    return fileUpload.locator("input");
}

function findFileUpload(page: Page, type: keyof typeof uploadFileTypes): Locator {
    const en_string = translate(uploadFileTypes[type].translationKey);
    return page.locator(`#input-file:has-text("${en_string}")`)
}
