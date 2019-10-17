import {ActionContext, ActionTree} from "vuex";
import {LoadingState, LoadState} from "../load/load";
import {RootState} from "../../root";
import {api} from "../../apiService";
import {PjnzResponse} from "../../generated";
import {Dict, LocalSessionFile} from "../../types";

export type LoadActionTypes = "SettingFiles" | "UpdatingState" | "LoadSucceeded" | "ClearLoadError"
export type LoadErrorActionTypes = "LoadFailed"

export interface LoadActions {
    load: (store: ActionContext<LoadState, RootState>, file: File) => void
    setFiles: (store: ActionContext<LoadState, RootState>, savedFileContents: string) => void
    updateStoreState: (store: ActionContext<LoadState, RootState>, savedState: Partial<RootState>) => void
    clearLoadState: (store: ActionContext<LoadState, RootState>) => void
}

export const actions: ActionTree<LoadState, RootState> & LoadActions = {
    async load({dispatch}, file) {
        const reader = new FileReader();
        reader.addEventListener('loadend', function() {
            dispatch("setFiles", reader.result as string)
        });
        reader.readAsText(file);
    },

    async setFiles({commit, dispatch, state}, savedFileContents) {
        commit({type: "SettingFiles", payload: null});
        const objectContents = JSON.parse(savedFileContents);
        const files = objectContents.files;
        const savedState = objectContents.state;

        await api<LoadActionTypes, LoadErrorActionTypes>(commit)
            .withSuccess("UpdatingState")
            .withError("LoadFailed")
            .postAndReturn<Dict<LocalSessionFile>>("/session/files/", files)
            .then(() => {
                if (state.loadingState == LoadingState.UpdatingState) {
                    dispatch("updateStoreState", savedState);
                }
            });
    },

    async updateStoreState({commit, dispatch, state}, savedState) {
        //TODO: In another PR - hashes have now been set for session in backend, so  update the state from the saved state and get file data from backend
    },

    async clearLoadState({commit}) {
        commit({type: "LoadStateCleared", payload: null});
    }
};