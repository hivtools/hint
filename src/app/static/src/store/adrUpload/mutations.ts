import {MutationTree} from "vuex";
import {Dict, PayloadWithType, UploadFile} from "../../types";
import {Error} from "../../generated";
import {ADRUploadState} from "./adrUpload";
import i18next from "i18next";

export enum ADRUploadMutation {
    SetUploadFiles = "SetUploadFiles",
    ADRUploadStarted = "ADRUploadStarted",
    ADRUploadProgress = "ADRUploadProgress",
    ADRUploadCompleted = "ADRUploadCompleted",
    ReleaseCreated = "ReleaseCreated",
    ClearStatus = "ClearStatus",
    ReleaseFailed = "ReleaseFailed",
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
        state.releaseCreated = false;
        state.releaseFailed = false;
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

    [ADRUploadMutation.ReleaseCreated](state: ADRUploadState) {
        state.releaseCreated = true;
    },

    [ADRUploadMutation.ClearStatus](state: ADRUploadState) {
        state.releaseCreated = false;
        state.releaseFailed = false;
        state.uploadComplete = false;
    },

    [ADRUploadMutation.ReleaseFailed](state: ADRUploadState, action: PayloadWithType<Error | null>) {
        state.releaseFailed = true;
        const alteredPayload = action.payload
        switch (action.payload?.detail) {
            case "Version already exists for this activity":
                alteredPayload!.detail = i18next.t("releaseExists");
                break;
            case "Version names must be unique per dataset":
                alteredPayload!.detail = i18next.t("releaseNameUnique");
                break;
        }
        state.uploadError = alteredPayload;
    },

    [ADRUploadMutation.SetADRUploadError](state: ADRUploadState, action: PayloadWithType<Error | null>) {
        state.uploadError = action.payload;
        state.uploading = false;
        state.currentFileUploading = null;
        state.totalFilesUploading = null;
    }
};
