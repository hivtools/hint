import {MutationTree} from "vuex";
import {ADRState} from "./adr";
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
    SetUserCanUpload = "SetUserCanUpload"
}

export const mutations: MutationTree<ADRState> = {
    [ADRMutation.UpdateKey](state: ADRState, action: PayloadWithType<string | null>) {
        state.key = action.payload;
    },

    [ADRMutation.SetKeyError](state: ADRState, action: PayloadWithType<Error | null>) {
        state.keyError = action.payload;
    },

    [ADRMutation.SetADRError](state: ADRState, action: PayloadWithType<Error | null>) {
        state.adrError = action.payload;
    },

    [ADRMutation.SetDatasets](state: ADRState, action: PayloadWithType<any[]>) {
        state.datasets = action.payload;
    },

    [ADRMutation.SetReleases](state: ADRState, action: PayloadWithType<any[]>) {
        state.releases = action.payload;
    },

    [ADRMutation.ClearReleases](state: ADRState) {
        state.releases = [];
    },

    [ADRMutation.SetFetchingDatasets](state: ADRState, action: PayloadWithType<boolean>) {
        state.fetchingDatasets = action.payload;
    },

    [ADRMutation.SetSchemas](state: ADRState, action: PayloadWithType<ADRSchemas>) {
        state.schemas = action.payload;
    },

    [ADRMutation.SetUserCanUpload](state: ADRState, action: PayloadWithType<boolean>) {
        state.userCanUpload = action.payload;
    }
};
