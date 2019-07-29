import {ActionContext, ActionPayload, ActionTree} from 'vuex';
import axios, {AxiosResponse} from 'axios';
import {APIError, PJNZ} from "../../types";
import {BaselineState} from "./baseline";
import {RootState} from "../../main";

export type BaselineActionTypes = "PJNZLoaded" | "PJNZUploadError"

export interface BaselinePayload extends ActionPayload {
    type: BaselineActionTypes
}

export interface PJNZLoaded extends BaselinePayload {
    payload: PJNZ
}

export interface PJNZUploadError extends BaselinePayload {
    payload: string
}

export interface BaselineActions {
    uploadPJNZ: (store: ActionContext<BaselineState, RootState>, file: File) => void
}

export const actions: ActionTree<BaselineState, RootState> & BaselineActions = {

    uploadPJNZ({commit}, file) {
        let formData = new FormData();
        formData.append('file', file);
        axios.post("/baseline/pjnz/upload", formData)
            .then((response: AxiosResponse) => {
                const payload: PJNZ = response && response.data;
                console.log(payload);
                commit<BaselinePayload>({type: "PJNZLoaded", payload});
            })
            .catch((e: {response: {data: APIError}}) => {
                const error = e.response.data;
                console.log(error);
                commit<BaselinePayload>({type: 'PJNZUploadError', payload: error.message});
            });
    }
};

