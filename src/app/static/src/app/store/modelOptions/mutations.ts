import {MutationTree} from 'vuex';
import {ModelOptionsState} from "./modelOptions";
import {DynamicFormData, DynamicFormMeta} from "../../components/forms/types";
import {PayloadWithType} from "../../types";
import {updateForm} from "./utils";


export enum ModelOptionsMutation {
    Validate = "Validate",
    Update = "Update",
    FetchingModelOptions = "FetchingModelOptions",
    ModelOptionsFetched = "ModelOptionsFetched"
}

export const ModelOptionsUpdates = [ModelOptionsMutation.Update];

export const mutations: MutationTree<ModelOptionsState> = {
    [ModelOptionsMutation.Validate](state: ModelOptionsState, payload: DynamicFormData) {
        state.options = payload;
        // TODO validate from server
        state.valid = true;
    },

    [ModelOptionsMutation.Update](state: ModelOptionsState, payload: DynamicFormMeta) {
        state.optionsFormMeta = payload;
    },

    [ModelOptionsMutation.FetchingModelOptions](state: ModelOptionsState) {
        state.fetching = true;
    },

    [ModelOptionsMutation.ModelOptionsFetched](state: ModelOptionsState, action: PayloadWithType<DynamicFormMeta>) {
        state.optionsFormMeta = {...updateForm(state.optionsFormMeta, action.payload)};
        state.fetching = false;
    }
};
