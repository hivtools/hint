import axios, {type AxiosRequestConfig} from 'axios';
import {Service} from 'axios-middleware';
import {Language} from "../../app/store/translations/locales";
import {actions as projectsActions} from "../../app/store/projects/actions";
import {initialProjectsState} from "../../app/store/projects/projects";
import {sessionStorageManager} from "../../app/sessionStorageManager";
import NodeFormData from "form-data";

const service = new Service(axios);

declare let appUrl: string; // configured by jest

export const rootState = {
    language: Language.en,
    metadata: {}
};

export const login = async (username = "test.user@example.com", password = "password") => {
    const formData = new NodeFormData();
    formData.append('username', username);
    formData.append('password', password);

    const res = await axios.post(appUrl + "callback/formClient",
        formData,
        {
            headers: formData.getHeaders(),
            maxRedirects: 0,
            validateStatus: (status) => status == 303
        });

    const cookie = res.headers["set-cookie"]![0].split(";")[0];

    // Register middleware to pass the session cookie with all requests
    await service.register({
        onRequest(config: AxiosRequestConfig) {
            config.headers!["Cookie"] = cookie;
            return config;
        }
    } as any);

    // GET the homepage to save the session
    await axios.get(appUrl);

};

// A browser tab sends the id of the version it has open with every request for files, and asks for none if it has no
// version open. So a test of the actions for files needs a version open, as a tab would have
export const openVersion = async () => {
    const commit = vi.fn();
    await projectsActions.createProject(
        {commit, dispatch: vi.fn(), rootState, state: initialProjectsState()} as any, {name: "itest"});
    const project = commit.mock.calls.map((args) => args[0]).find((mutation) => mutation.type === "SetProject");
    sessionStorageManager.saveVersionId(project.payload.versions[0].id);
};

export const closeVersion = () => sessionStorageManager.saveVersionId(null);
