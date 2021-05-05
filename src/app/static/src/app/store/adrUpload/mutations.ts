import {MutationTree} from "vuex";
import {Dict, PayloadWithType, UploadFile} from "../../types";
import {Error} from "../../generated";
import {ADRUploadState} from "./adr";

export enum ADRUploadMutation {
    SetUploadFiles = "SetUploadFiles",
    ADRUploadStarted = "ADRUploadStarted",
    ADRUploadProgress = "ADRUploadProgress",
    ADRUploadCompleted = "ADRUploadCompleted",
    SetADRUploadError = "SetADRUploadError",
}

export const mutations: MutationTree<ADRUploadState> = {
    [ADRUploadMutation.SetUploadFiles](state: ADRUploadState, action: PayloadWithType<Dict<UploadFile>>) {
        state.uploadFiles = action.payload;
    },

    [ADRUploadMutation.ADRUploadStarted](state: ADRUploadState, action: PayloadWithType<number>) {
        state.uploading = true;
        state.uploadComplete = false;
        state.uploadError = null;
        state.totalFilesUploading = action.payload;
    },

    [ADRUploadMutation.ADRUploadProgress](state: ADRUploadState, action: PayloadWithType<number>) {
        state.currentFileUploading = action.payload;
    },

    [ADRUploadMutation.ADRUploadCompleted](state: ADRUploadState) {
        state.uploading = false;
        state.uploadComplete = true;
        state.currentFileUploading = null;
        state.totalFilesUploading = null;
    },

    [ADRUploadMutation.SetADRUploadError](state: ADRUploadState, action: PayloadWithType<Error | null>) {
        state.uploadError = action.payload;
        state.uploading = false;
        state.currentFileUploading = null;
        state.totalFilesUploading = null;
    }
};
