import {Module} from "vuex";
import {RootState} from "../../root";
import {Error} from "../../generated";
import {Dict, UploadFile} from "../../types";
import {actions} from "./actions";
import {mutations} from "./mutations";
:
export interface ADRUploadState {
    currentFileUploading: number | null,
    totalFilesUploading: number | null,
    uploadError: Error | null,
    uploading: boolean,
    uploadComplete: boolean,
    uploadFiles: Dict<UploadFile> | null
}

export const initialADRUploadState = (): ADRUploadState => ({
    currentFileUploading: null,
    totalFilesUploading: null,
    uploadError: null,
    uploading: false,
    uploadComplete: false,
    uploadFiles: null
});

export const adrUploadGetters = {
    errors: (state: ADRUploadState) => {
        return [state.uploadError]
    }
};

export const adrUpload: Module<ADRUploadState, RootState> = {
    namespaced: true,
    state: {...initialADRUploadState()},
    getters: adrUploadGetters,
    actions,
    mutations
};
