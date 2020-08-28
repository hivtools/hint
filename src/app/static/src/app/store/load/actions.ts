import {ActionContext, ActionTree} from "vuex";
import {LoadingState, LoadState} from "./load";
import {RootState} from "../../root";
import {api} from "../../apiService";
import {verifyCheckSum} from "../../utils";
import {Dict, LocalSessionFile, VersionDetails} from "../../types";
import {localStorageManager} from "../../localStorageManager";
import {router} from "../../router";

export type LoadActionTypes = "SettingFiles" | "UpdatingState" | "LoadSucceeded" | "ClearLoadError"
export type LoadErrorActionTypes = "LoadFailed"

export interface LoadActions {
    load: (store: ActionContext<LoadState, RootState>, file: File) => void
    setFiles: (store: ActionContext<LoadState, RootState>, savedFileContents: string) => void
    loadFromVersion: (store: ActionContext<LoadState, RootState>, versionDetails: VersionDetails) => void
    updateStoreState: (store: ActionContext<LoadState, RootState>, savedState: Partial<RootState>) => void
    clearLoadState: (store: ActionContext<LoadState, RootState>) => void
}

export const actions: ActionTree<LoadState, RootState> & LoadActions = {
    load({dispatch}, file) {
        const reader = new FileReader();
        reader.addEventListener('loadend', function() {
            dispatch("setFiles", reader.result as string);
        });
        reader.readAsText(file);
    },

    async setFiles(context, savedFileContents) {
        const {commit} = context;
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

        await getFilesAndLoad(context, files, savedState)
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
            if (state.loadingState == LoadingState.UpdatingState) {
                dispatch("updateStoreState", savedState);
            }
        });
}
