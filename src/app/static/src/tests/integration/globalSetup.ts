import axios from "axios";
import qs from "qs";
import {integrationAppUrl} from "../integrationAppUrl";

const ATTEMPTS = 10;

/**
 * Runs once, before the test files start: waits until the dev stack answers a login, so that a stack that is still
 * starting does not fail the first test files in their `beforeAll`.
 */
export default async function warmUpLogin() {
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
        try {
            const res = await axios.post(integrationAppUrl + "/dev-login", qs.stringify({user: "test.user@example.com"}),
                {
                    headers: {"Content-Type": "application/x-www-form-urlencoded"},
                    maxRedirects: 0,
                    validateStatus: () => true
                });
            if (res.status == 303) {
                return;
            }
            console.warn(`Warm-up login ${attempt}/${ATTEMPTS}: status ${res.status}`);
        } catch (error: any) {
            console.warn(`Warm-up login ${attempt}/${ATTEMPTS}: ${error && error.message}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    // The tests report what fails, with the status and the body, so do not stop the run here
    console.warn("The warm-up login did not succeed. The test files log in themselves.");
}
