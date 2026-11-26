import axios, {type AxiosRequestConfig} from 'axios';
import {Service} from 'axios-middleware';
import {Language} from "../../app/store/translations/locales";
import {actions as projectsActions} from "../../app/store/projects/actions";
import {initialProjectsState} from "../../app/store/projects/projects";
import {sessionStorageManager} from "../../app/sessionStorageManager";
import qs from "qs";

const service = new Service(axios);

declare let appUrl: string; // configured by jest

export const rootState = {
    language: Language.en,
    metadata: {}
};

// Vitest cannot report an error that holds an axios request: it cannot copy the request's functions to its main process
// ("DataCloneError: function (config) { return this$1.adapter(config); } could not be cloned"). It then ends the whole
// test file with an "Unhandled Error" and no message. So a request in a helper that fails is thrown again as a plain
// error that says what failed.
const failed = (step: string, error: any): Error => {
    const response = error && error.response;
    const detail = response ?
        `status ${response.status}, ${JSON.stringify(response.data)}` :
        (error && error.message) || String(error);
    return new Error(`${step} failed: ${detail}`);
};

const request = async <T>(step: string, send: () => Promise<T>): Promise<T> => {
    try {
        return await send();
    } catch (error) {
        throw failed(step, error);
    }
};

// The dev login of the dev stack (POST /dev-login, HINT_DEV_USERS in docker-compose.yml): no password
export const login = async (username = "test.user@example.com") => {
    const res = await request("POST dev-login (login)", () => axios.post(appUrl + "/dev-login",
        qs.stringify({user: username}),
        {
            headers: {"Content-Type": "application/x-www-form-urlencoded"},
            maxRedirects: 0,
            validateStatus: (status) => status == 303
        }));

    const cookies = res.headers["set-cookie"];
    if (!cookies || cookies.length == 0) {
        throw new Error(`Login did not set a session cookie: ${res.status} ${res.headers["location"]}`);
    }
    const cookie = cookies[0].split(";")[0];

    // Register middleware to pass the session cookie with all requests
    await service.register({
        onRequest(config: AxiosRequestConfig) {
            config.headers!["Cookie"] = cookie;
            return config;
        }
    } as any);

};

// A browser tab sends the id of its open version with every request for files. A tab with no open version does not
// request files. So a test of the file actions needs an open version, as a tab has.
export const openVersion = async () => {
    const commit = vi.fn();
    await projectsActions.createProject(
        {commit, dispatch: vi.fn(), rootState, state: initialProjectsState()} as any, {name: "itest"});
    // The action does not throw when the request fails. It commits the error, so say what it committed
    const mutations = commit.mock.calls.map((args) => args[0]);
    const project = mutations.find((mutation) => mutation.type === "SetProject");
    if (!project) {
        throw new Error(`POST /project (open a version) failed: ${JSON.stringify(mutations)}`);
    }
    sessionStorageManager.saveVersionId(project.payload.versions[0].id);
};

export const closeVersion = () => sessionStorageManager.saveVersionId(null);
