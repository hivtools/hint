import axios from "axios";
import FormData from "form-data";
import {integrationAppUrl} from "../integrationAppUrl";

const ATTEMPTS = 10;

/**
 * Runs once, before the test files start. It logs in once, alone.
 *
 * Every test file logs in as soon as it starts, and the files start together. The Kotlin server sets up its login (the
 * pac4j client and the database handle) when the first login arrives, and this is not safe if many logins arrive
 * while it does. Those logins fail with a 500 ("credentialsExtractor cannot be null", "this.dbi is null" in the Kotlin
 * log), and so a test file fails in its `beforeAll`. A server that has just started is in this state. One login first
 * makes sure that the server is ready.
 */
export default async function warmUpLogin() {
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
        const formData = new FormData();
        formData.append("username", "test.user@example.com");
        formData.append("password", "password");
        try {
            const res = await axios.post(integrationAppUrl + "callback/formClient", formData,
                {headers: formData.getHeaders(), maxRedirects: 0, validateStatus: () => true});
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
