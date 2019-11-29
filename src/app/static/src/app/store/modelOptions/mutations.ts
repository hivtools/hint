import {MutationTree} from 'vuex';
import {ModelOptionsState} from "./modelOptions";
import {DynamicFormData, DynamicFormMeta} from "../../components/forms/types";
import {PayloadWithType} from "../../types";
import {updateForm} from "./utils";
import {ModelRunMutation} from "../modelRun/mutations";
import {VersionInfo} from "../../generated";


export enum ModelOptionsMutation {
    UnValidate = "UnValidate",
    Validate = "Validate",
    Update = "Update",
    FetchingModelOptions = "FetchingModelOptions",
    ModelOptionsFetched = "ModelOptionsFetched",
    SetModelOptionsVersion = "SetModelOptionsVersion"
}

export const ModelOptionsUpdates = [ModelOptionsMutation.Update, ModelOptionsMutation.UnValidate];

export const mutations: MutationTree<ModelOptionsState> = {
    [ModelOptionsMutation.UnValidate](state: ModelOptionsState) {
        state.valid = false;
    },

    [ModelOptionsMutation.Validate](state: ModelOptionsState, payload: DynamicFormData) {
        state.options = payload;
        // TODO validate from server
        state.valid = true;
    },

    [ModelOptionsMutation.Update](state: ModelOptionsState, payload: DynamicFormMeta) {
        state.valid = false;
        state.optionsFormMeta = payload;
    },

    [ModelOptionsMutation.FetchingModelOptions](state: ModelOptionsState) {
        state.fetching = true;
    },

    [ModelOptionsMutation.ModelOptionsFetched](state: ModelOptionsState, action: PayloadWithType<DynamicFormMeta>) {
        const newForm = {...updateForm(state.optionsFormMeta, action.payload)};
        state.valid = JSON.stringify(newForm) == JSON.stringify(state.optionsFormMeta);
        state.optionsFormMeta = newForm;
        state.fetching = false;
    },

    [ModelOptionsMutation.SetModelOptionsVersion](state: ModelOptionsState, action: PayloadWithType<VersionInfo>) {
        state.version = action.payload
    }
};
