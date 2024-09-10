import {Locator, Page, expect} from "@playwright/test";
import {translate} from "./translationUtils";

const uploadFileTypes = {
    spectrum: {
        translationKey: "PJNZ",
        testFile: "../testdata/Malawi2019.PJNZ"
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
    vmmc: {
        translationKey: "VMMC",
        testFile: "../testdata/vmmc.xlsx"
    },
}

export async function uploadAllTestFiles(page: Page) {
    for (const type of Object.keys(uploadFileTypes) as Array<keyof typeof uploadFileTypes>) {
        await uploadTestFile(page, type);
    }
    // Upload files first, then check they have uploaded successfully. Should be faster than
    // uploading, waiting for validation to complete and checking one by one.
    for (const type of Object.keys(uploadFileTypes) as Array<keyof typeof uploadFileTypes>) {
        await testUploaded(page, type);
    }
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
