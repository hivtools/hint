import {ActionContext, ActionTree} from "vuex";
import {LoadingState, LoadState} from "./load";
import {RootState} from "../../root";
import {api} from "../../apiService";
import {verifyCheckSum} from "../../utils";
import {Dict, LocalSessionFile, VersionDetails} from "../../types";
import {localStorageManager} from "../../localStorageManager";
import {router} from "../../router";
import {currentHintVersion} from "../../hintVersion";
import {initialStepperState} from "../stepper/stepper";

export type LoadActionTypes = "SettingFiles" | "UpdatingState" | "LoadSucceeded" | "ClearLoadError"
export type LoadErrorActionTypes = "LoadFailed"

export interface LoadActions {
    load: (store: ActionContext<LoadState, RootState>, payload: loadPayload) => void
    setFiles: (store: ActionContext<LoadState, RootState>, payload: setFilesPayload) => void
    loadFromVersion: (store: ActionContext<LoadState, RootState>, versionDetails: VersionDetails) => void
    updateStoreState: (store: ActionContext<LoadState, RootState>, savedState: Partial<RootState>) => void
    clearLoadState: (store: ActionContext<LoadState, RootState>) => void
}

export interface loadPayload {
    file: File,
    projectName: string | null
}

export interface setFilesPayload {
    savedFileContents: string,
    projectName: string | null
}

export const actions: ActionTree<LoadState, RootState> & LoadActions = {
    load({dispatch}, payload) {
        const {file, projectName} = payload;
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

        if (!objectContents) {
            commit({
                type: "LoadFailed",
                payload: {detail: "The file contents are corrupted."}
            });
            return;
        }

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
            savedState.stepper.steps = initialStepperState().steps;
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
        localStorageManager.savePartialState(savedState);
        location.reload();

    },

    async clearLoadState({commit}) {
        commit({type: "LoadStateCleared", payload: null});
    }
};

async function getFilesAndLoad(context: ActionContext<LoadState, RootState>, files: any, savedState: any) {
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
