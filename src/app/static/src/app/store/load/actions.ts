import {ActionContext, ActionTree, Commit} from "vuex";
import {FileSource, LoadingState, LoadState} from "./load";
import {RootState} from "../../root";
import {api} from "../../apiService";
import {verifyCheckSum} from "../../utils";
import {Dict, LocalSessionFile, VersionDetails} from "../../types";
import {localStorageManager} from "../../localStorageManager";
import {router} from "../../router";
import {currentHintVersion} from "../../hintVersion";
import {initialStepperState} from "../stepper/stepper";
import {ModelStatusResponse} from "../../generated";
import * as fs from 'fs';

export type LoadActionTypes = "SettingFiles" | "UpdatingState" | "LoadSucceeded" | "ClearLoadError" | "PreparingModelOutput" | "ModelOutputStatusUpdated" | "PollingStatusStarted"
export type LoadErrorActionTypes = "LoadFailed" | "ModelOutputError"

export interface LoadActions {
    load: (store: ActionContext<LoadState, RootState>, payload: loadPayload) => void
    setFiles: (store: ActionContext<LoadState, RootState>, payload: setFilesPayload) => void
    loadFromVersion: (store: ActionContext<LoadState, RootState>, versionDetails: VersionDetails) => void
    updateStoreState: (store: ActionContext<LoadState, RootState>, savedState: Partial<RootState>) => void
    clearLoadState: (store: ActionContext<LoadState, RootState>) => void
    prepareModelOutput: (store: ActionContext<LoadState, RootState>, payload: setFilesPayload) => void
    pollModelOutput: (store: ActionContext<LoadState, RootState>, projectName: string) => void
}

export interface loadPayload {
    file: File,
    projectName: string | null,
    source?: FileSource
}

export interface setFilesPayload {
    savedFileContents: string,
    projectName: string | null
}

export const actions: ActionTree<LoadState, RootState> & LoadActions = {
    load({dispatch}, payload) {
        const {file, projectName, source} = payload;

        if (FileSource.ModelOutput === source) {
            dispatch("prepareModelOutput", {savedFileContents: file, projectName});
        }

        console.log(file)

        const reader = new FileReader();
        reader.addEventListener('loadend', function () {
            dispatch("setFiles", {savedFileContents: reader.result as string, projectName});
        });
        reader.readAsText(file);
    },

    async setFiles(context, payload) {
        const {savedFileContents, projectName} = payload;
        const {commit, rootState, rootGetters, dispatch} = context;
        commit({type: "SettingFiles", payload: null});

        const objectContents = verifyCheckSum(savedFileContents);

        commitLoadFailureIfContentIsCorrupt(objectContents, commit)

        const files = objectContents.files;
        const savedState = objectContents.state;

        const majorVersion = (s: string) => s ? s.split(".")[0] : null;
        if (majorVersion(savedState.version) != majorVersion(currentHintVersion)) {
            commit({
                type: "LoadFailed",
                payload: {detail: "Unable to load file created by older version of the application."}
            });
            return;
        }

        if (!rootGetters.isGuest) {
            await (dispatch("projects/createProject", projectName, {root: true}));
            savedState.projects.currentProject = rootState.projects.currentProject;
            savedState.projects.currentVersion = rootState.projects.currentVersion;
        }

        await getFilesAndLoad(context, files, savedState);
    },

    async loadFromVersion(context, versionDetails) {
        const {commit} = context;
        commit({type: "SettingFiles", payload: null});

       router.push("/", () => {
            getFilesAndLoad(context, versionDetails.files, JSON.parse(versionDetails.state));
        });

    },

    async updateStoreState({commit, dispatch, state}, savedState) {
        //File hashes have now been set for session in backend so we save the state from the file we're loading into local
        //storage then reload the page, to follow exactly the same fetch and reload procedure as session page refresh
        //NB load state is not included in the saved state so we will default back to NotLoading on page reload.
        localStorageManager.savePartialState(savedState, false);
        location.reload();

    },

    async clearLoadState({commit}) {
        commit({type: "LoadStateCleared", payload: null});
    },

    async prepareModelOutput(context, payload) {
        const {savedFileContents, projectName} = payload;
        const {commit, rootGetters, dispatch, state} = context;

        const formData = new FormData()
        formData.append("file", savedFileContents)

        commit({type: "SettingFiles", payload: null});

        //call endpoint and start polling
        const response = await api<LoadActionTypes, LoadErrorActionTypes>(context)
            .withSuccess("PreparingModelOutput")
            .withError("ModelOutputError")
            .postAndReturn("download/rehydrate/submit", formData);

        if (response) {
            await dispatch("pollModelOutput", projectName);
        }
    },

    async pollModelOutput(context, projectName) {
        const {commit} = context;
        const id = setInterval(() => {
            getRehydrateStatus(context)
        }, 2000);

        commit({type: "PollingStatusStarted", payload: id});
    }
};

const getRehydrateStatus = async (context: ActionContext<LoadState, RootState>) => {
    const downloadId = context.state.downloadId
    const response = await api<LoadActionTypes, LoadErrorActionTypes>(context)
        .withSuccess("ModelOutputStatusUpdated")
        .withError("ModelOutputError")
        .get<ModelStatusResponse>(`download/status/${downloadId}`);

    if(response && response.data.done) {
        console.log(response.data)
        console.log(downloadId)
        //window.location.assign(`download/result/${downloadId}`);
        //const content = readJsonFile(`download/result/${downloadId}`)

        //console.log(content.data)
        //console.log(content)
        //const objectContents = JSON.parse(content.data.);

        //const files = objectContents.files
        //const savedState = objectContents.state

        //await getFilesAndLoad(context, files, savedState);
    }
}

async function getFilesAndLoad(context: ActionContext<LoadState, RootState>, files: any, savedState: any) {
    savedState.stepper.steps = initialStepperState().steps;
    const {dispatch, state} = context;
    await api<LoadActionTypes, LoadErrorActionTypes>(context)
        .withSuccess("UpdatingState")
        .withError("LoadFailed")
        .postAndReturn<Dict<LocalSessionFile>>("/session/files/", files)
        .then(() => {
            if (state.loadingState != LoadingState.LoadFailed) {
                dispatch("updateStoreState", savedState);
            }
        });
}

const commitLoadFailureIfContentIsCorrupt = (objectContents: string, commit: Commit) => {
    if (!objectContents) {
        commit({
            type: "LoadFailed",
            payload: {detail: "The file contents are corrupted."}
        });
        return;
    }
}

const readJsonFile = (path: string) => {
    return fs.readFileSync(path).toJSON()
}