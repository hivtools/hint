import {MutationTree} from "vuex";
import {ADRState} from "./adr";
import {ADRSchemas, PayloadWithType} from "../../types";
import {Error} from "../../generated";;

export enum ADRMutation {
    UpdateKey = "UpdateKey",
    SetKeyError = "KeyError",
    SetDatasets = "SetDatasets",
    SetFetchingDatasets = "SetFetchingDatasets",
    SetSchemas = "SetADRSchemas"
}

export const mutations: MutationTree<ADRState> = {
    [ADRMutation.UpdateKey](state: ADRState, action: PayloadWithType<string | null>) {
        state.key = action.payload;
    },

    [ADRMutation.SetKeyError](state: ADRState, action: PayloadWithType<Error | null>) {
        state.keyError = action.payload;
    },

    [ADRMutation.SetDatasets](state: ADRState, action: PayloadWithType<any[]>) {
        state.datasets = action.payload;
    },

    [ADRMutation.SetFetchingDatasets](state: ADRState, action: PayloadWithType<boolean>) {
        state.fetchingDatasets = action.payload;
    },

    [ADRMutation.SetSchemas](state: ADRState, action: PayloadWithType<ADRSchemas>) {
        state.schemas = action.payload;
    }
};
