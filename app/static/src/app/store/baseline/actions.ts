import {ActionContext, ActionPayload, ActionTree} from 'vuex';
import axios from 'axios';
import {BaselineState} from "./baseline";
import {APIResponse, PJNZ, RootState} from "../../types";

export type BaselineActionTypes = "PJNZLoaded" | "PJNZUploadError"

export interface BaselinePayload extends ActionPayload {
    type: BaselineActionTypes
}

export interface PJNZLoaded extends BaselinePayload {
    payload: PJNZ
}

export const actions: ActionTree<BaselineState, RootState> = {

    uploadPJNZ({commit}: ActionContext<BaselineState, RootState>, file: File) {
        let formData = new FormData();
        formData.append('file', file);
        axios.post("/upload", formData)
            .then((response: APIResponse) => {
                const payload: PJNZ = response && response.data.data;
                commit<BaselinePayload>({type: "PJNZLoaded", payload});
            }, (error: APIResponse) => {
                console.log(error);
                const payload = error && error.data && error.data.errors;
                commit<BaselinePayload>({type: 'PJNZUploadError', payload});
            });
    }
};

