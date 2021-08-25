import {MutationTree} from "vuex";
import {Dict, PayloadWithType, UploadFile} from "../../types";
import {Error} from "../../generated";
import {ADRUploadState} from "./adrUpload";

export enum ADRUploadMutation {
    SetUploadFiles = "SetUploadFiles",
    ADRUploadStarted = "ADRUploadStarted",
    ADRUploadProgress = "ADRUploadProgress",
    ADRUploadCompleted = "ADRUploadCompleted",
    ReleaseCreated = "ReleaseCreated",
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

    [ADRUploadMutation.ReleaseFailed](state: ADRUploadState, action: PayloadWithType<Error | null>) {
        state.releaseFailed = true;
        let alteredPayload = action.payload
        switch(action.payload?.detail) {
            case "Version already exists for this activity":
                alteredPayload!.detail = "A release already exists on ADR for the latest files"
              break;
            case "Version names must be unique per dataset":
                alteredPayload!.detail = "Release names must be unique per dataset and a release with the same name already exists on ADR. Try renaming the project to generate a new release name."
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
