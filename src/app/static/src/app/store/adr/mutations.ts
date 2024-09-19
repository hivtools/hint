import {MutationTree, Payload} from "vuex";
import {AdrDatasetType, ADRState} from "./adr";
import {ADRSchemas, PayloadWithType} from "../../types";
import {Error} from "../../generated";

export enum ADRMutation {
    UpdateKey = "UpdateKey",
    SetKeyError = "KeyError",
    SetADRError = "ADRError",
    SetDatasets = "SetDatasets",
    SetReleases = "SetReleases",
    ClearReleases = "ClearReleases",
    SetFetchingDatasets = "SetFetchingDatasets",
    SetSchemas = "SetSchemas",
    SetUserCanUpload = "SetUserCanUpload",
    SetSSOLogin = "SetSSOLogin"
}

export interface DatasetTypePayload<T> extends Payload {
    payload: {
        datasetType: AdrDatasetType,
        data: T
    }
}

export const mutations: MutationTree<ADRState> = {
    [ADRMutation.UpdateKey](state: ADRState, action: PayloadWithType<string | null>) {
        state.key = action.payload;
    },

    [ADRMutation.SetSSOLogin](state: ADRState, action: PayloadWithType<boolean>) {
        state.ssoLogin = action.payload;
    },

    [ADRMutation.SetKeyError](state: ADRState, action: PayloadWithType<Error | null>) {
        state.keyError = action.payload;
    },

    [ADRMutation.SetADRError](state: ADRState, action: DatasetTypePayload<Error | null>) {
        state.adrData[action.payload.datasetType].fetchingError = action.payload.data;
    },

    [ADRMutation.SetDatasets](state: ADRState, action: DatasetTypePayload<any[]>) {
        state.adrData[action.payload.datasetType].datasets = action.payload.data;
    },

    [ADRMutation.SetReleases](state: ADRState, action: DatasetTypePayload<any[]>) {
        state.adrData[action.payload.datasetType].releases = action.payload.data;
    },

    [ADRMutation.ClearReleases](state: ADRState, action: DatasetTypePayload<null>) {
        state.adrData[action.payload.datasetType].releases = [];
    },

    [ADRMutation.SetFetchingDatasets](state: ADRState, action: DatasetTypePayload<boolean>) {
        state.adrData[action.payload.datasetType].fetchingDatasets = action.payload.data;
    },

    [ADRMutation.SetSchemas](state: ADRState, action: PayloadWithType<ADRSchemas>) {
        state.schemas = action.payload;
    },

    [ADRMutation.SetUserCanUpload](state: ADRState, action: PayloadWithType<boolean>) {
        state.userCanUpload = action.payload;
    }
};
