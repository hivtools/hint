import {ActionContext, ActionPayload, ActionTree} from 'vuex';
import {BaselineState} from "./baseline";
import {RootState} from "../../main";
import {api} from "../../apiService";

export interface PJNZ {
    filename: string
    country: string
}

export interface BaselineData {
    pjnz?: PJNZ
}

export type BaselineActionTypes = "PJNZUploaded" | "PJNZUploadError" | "BaselineDataLoaded"

export interface BaselinePayload extends ActionPayload {
    type: BaselineActionTypes
}

export interface BaselineDataLoaded extends BaselinePayload {
    payload: BaselineData
}

export interface PJNZUploaded extends BaselinePayload {
    payload: PJNZ
}

export interface PJNZUploadError extends BaselinePayload {
    payload: string
}

export interface BaselineActions {
    uploadPJNZ: (store: ActionContext<BaselineState, RootState>, file: File) => void
    getBaselineData: (store: ActionContext<BaselineState, RootState>) => void
}

export const actions: ActionTree<BaselineState, RootState> & BaselineActions = {

    uploadPJNZ({commit}, file) {
        let formData = new FormData();
        formData.append('file', file);
        api.postAndReturn<PJNZ>("/baseline/pjnz/", formData)
            .then((payload) => {
                commit<BaselinePayload>({type: "PJNZUploaded", payload});
            })
            .catch((error: Error) => {
                commit<BaselinePayload>({type: 'PJNZUploadError', payload: error.message});
            });
    },

    getBaselineData({commit}) {
        api.get<BaselineData>("/baseline/")
            .then((payload) => {
                commit<BaselinePayload>({type: "BaselineDataLoaded", payload});
            })
            .catch(api.doNothing);
    }
};

