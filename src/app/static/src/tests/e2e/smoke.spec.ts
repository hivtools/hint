// Smoke tests: does the app start and can a user get around it?
//
// These are quick (no file uploads, no model runs) and cover what the longer specs do not: how the page starts up, the
// pages around the main flow (login, guest, logout, deep links, language) and errors in the browser console.
// They are written to protect front-end changes such as the move from webpack to Vite. They should pass before and
// after those changes.
import {test as plainTest, expect as plainExpect, type Page} from "@playwright/test";
import {expect, test} from "./fixtures/project-page";
import {baseURL} from "../../../playwright.config";
import {locales} from "../../app/store/translations/locales";
import {translate} from "./utils/translationUtils";

const TEST_USER = "test.user@example.com";

// Collects what a user would never see but a developer should: errors thrown in the page, errors written to the
// console and failed requests to our own server. Call before the first navigation.
function trackProblems(page: Page): string[] {
    const problems: string[] = [];
    const origin = new URL(baseURL).origin;
    page.on("pageerror", e => problems.push(`page error: ${e.message}`));
    page.on("console", m => {
        if (m.type() === "error") problems.push(`console error: ${m.text()}`);
    });
    page.on("response", r => {
        if (r.status() >= 400 && r.url().startsWith(origin)) {
            problems.push(`${r.status()} ${r.request().method()} ${r.url()}`);
        }
    });
    return problems;
}

async function logInThroughTheLoginPage(page: Page) {
    await page.goto("/login");
    // The dev login (HINT_DEV_USERS in docker-compose.yml): one button for each user, no password
    await page.getByRole("button", {name: `Log in as ${TEST_USER}`}).click();
    // A longer wait than usual: with no cache the whole script has to be downloaded and started
    await expect(page.getByRole("heading", {name: "Projects", exact: true})).toBeVisible({timeout: 20_000});
}

// ---- Logged in (uses the login that the other specs share) ----

test.describe("logged in", () => {
    test("the app starts without errors", async ({page}) => {
        const problems = trackProblems(page);

        await page.goto("/");

        await expect(page).toHaveTitle("Naomi");
        await expect(page.locator("#projects-content #projects-title h1")).toHaveText("Projects");
        // eslint-disable-next-line playwright/no-networkidle -- wait for all the requests, so that trackProblems sees their errors
        await page.waitForLoadState("networkidle");
        expect(problems).toEqual([]);
    });

    test("the header shows the title, the user and a logout link", async ({page}) => {
        await page.goto("/");

        const header = page.locator("header");
        await expect(header).toContainText("Naomi");
        await expect(header).toContainText(`${translate("loggedInAs")} ${TEST_USER}`);
        await expect(header.locator('a[href="/logout"]')).toHaveCount(1);
        await expect(header.locator('a[href="/login"]')).toHaveCount(0);
    });

    // The server does not know these paths, only the single page app does
    test("opening /projects directly shows the projects page", async ({page}) => {
        const problems = trackProblems(page);

        await page.goto("/projects");

        await expect(page.getByRole("heading", {name: "Projects", exact: true})).toBeVisible();
        expect(new URL(page.url()).pathname).toBe("/projects");
        // eslint-disable-next-line playwright/no-networkidle -- wait for all the requests, so that trackProblems sees their errors
        await page.waitForLoadState("networkidle");
        expect(problems).toEqual([]);
    });

    // KNOWN ISSUE, found by this test on 2026-11-17: a logged in user with no open project who opens /accessibility
    // or /privacy directly is sent to /projects. SetCurrentProject (store/projects/mutations.ts) redirects when the
    // route is "/", and at start-up the router's route is still "/" because the first navigation has not finished.
    // Clicking the links inside the app works. Change fixme to test when it is fixed.
    for (const {path, heading} of [
        {path: "/accessibility", heading: translate("axeOnNaomiHeading")},
        {path: "/privacy", heading: translate("privacyPreambleHeading")},
    ]) {
        test.fixme(`opening ${path} directly shows its page`, async ({page}) => {
            await page.goto(path);

            await expect(page.getByRole("heading", {name: heading, exact: true}).first()).toBeVisible();
            expect(new URL(page.url()).pathname).toBe(path);
        });
    }

    test("reloading the page keeps the open project", async ({projectPage}) => {
        const {page} = projectPage;
        const projectName = await projectPage.createProject();
        await expect(page.getByText(`Project: ${projectName} v1`)).toBeVisible();

        await page.reload();

        await expect(page.locator("#stepper")).toBeVisible();
        await expect(page.getByText(`Project: ${projectName} v1`)).toBeVisible();
    });

    test("the language can be changed", async ({page}) => {
        await page.goto("/");
        await expect(page.locator("header")).toContainText(translate("loggedInAs"));

        // "EN" is both the menu button and the first item in its menu, so open the menu with the first
        await page.locator("header").getByText("EN", {exact: true}).first().click();
        await page.locator("header").getByText("FR", {exact: true}).click();

        await expect(page.locator("header")).toContainText(locales.fr.loggedInAs!);
    });
});

// ---- Not logged in (each test starts with no cookies) ----

plainTest.describe("not logged in", () => {
    plainTest("the login page has the dev login, and no password form", async ({page}) => {
        // In development there is no Auth0: the page has one button for each dev user (deployed, the Auth0 button)
        await page.goto("/login");
        await plainExpect(page).toHaveTitle("Login");
        await plainExpect(page.locator("#continue-as-guest")).toBeVisible();
        await plainExpect(page.getByRole("button", {name: `Log in as ${TEST_USER}`})).toBeVisible();
        await plainExpect(page.locator('input[type="password"]')).toHaveCount(0);
    });

    plainTest("the login page says when a session has expired", async ({page}) => {
        // Where the app sends a user whose request got a 401 (apiService.ts)
        await page.goto("/login?error=SessionExpired");
        await plainExpect(page.locator("#error")).toHaveText("Your session expired. Please log in again");
    });

    plainTest("a visitor is sent to the login page, and can continue as a guest", async ({page}) => {
        const problems = trackProblems(page);

        await page.goto("/");
        await plainExpect(page).toHaveURL(/\/login/);

        await page.getByText("Continue as guest").click();

        // A guest has a login link and no user name
        const header = page.locator("header");
        await plainExpect(header.locator('a[href="/login"]')).toHaveCount(1);
        await plainExpect(header).not.toContainText(translate("loggedInAs"));
        await plainExpect(page.locator("#stepper")).toBeVisible();
        // eslint-disable-next-line playwright/no-networkidle -- wait for all the requests, so that trackProblems sees their errors
        await page.waitForLoadState("networkidle");
        plainExpect(problems).toEqual([]);
    });

    plainTest("logging out goes back to the login page", async ({page}) => {
        await logInThroughTheLoginPage(page);

        await page.locator('header a[href="/logout"]').click();

        await plainExpect(page).toHaveURL(/\/login/);
        // The session has ended: opening the app sends the visitor to the login page again
        await page.goto("/");
        await plainExpect(page).toHaveURL(/\/login/);
    });

    plainTest("a guest can open the privacy and accessibility pages directly", async ({page}) => {
        for (const {path, heading} of [
            {path: "/accessibility", heading: translate("axeOnNaomiHeading")},
            {path: "/privacy", heading: translate("privacyPreambleHeading")},
        ]) {
            await page.goto(path);
            await plainExpect(page.getByRole("heading", {name: heading, exact: true}).first()).toBeVisible();
            plainExpect(new URL(page.url()).pathname).toBe(path);
        }
    });

    plainTest("an unknown page shows the 404 page", async ({page}) => {
        const response = await page.goto("/no-such-page");

        plainExpect(response!.status()).toBe(404);
        await plainExpect(page.getByRole("heading", {name: "Page Not Found"})).toBeVisible();
    });
});
