import {MutationTree} from 'vuex';
import {ModelOptionsState} from "./modelOptions";
import {DynamicFormData, DynamicFormMeta} from "@reside-ic/vue-dynamic-form";
import {PayloadWithType} from "../../types";
import {updateForm} from "../../utils";
import {VersionInfo, Error} from "../../generated";


export enum ModelOptionsMutation {
    UnValidate = "UnValidate",
    Validate = "Validate",
    Validating = "Validating",
    Validated = "Validated",
    Update = "Update",
    FetchingModelOptions = "FetchingModelOptions",
    ModelOptionsFetched = "ModelOptionsFetched",
    ModelOptionsError = "ModelOptionsError",
    SetModelOptionsVersion = "SetModelOptionsVersion",
    HasValidationError = "HasValidationError",
    LoadUpdatedOptions = "LoadUpdatedOptions"
}

export const ModelOptionsUpdates = [ModelOptionsMutation.Update, ModelOptionsMutation.UnValidate];

export const mutations: MutationTree<ModelOptionsState> = {
    [ModelOptionsMutation.UnValidate](state: ModelOptionsState) {
        state.valid = false;
    },

    [ModelOptionsMutation.Validate](state: ModelOptionsState) {
        state.valid = true;
    },

    [ModelOptionsMutation.Validating](state: ModelOptionsState) {
        state.validating = true;
    },

    [ModelOptionsMutation.Validated](state: ModelOptionsState) {
        state.validating = false;
    },

    [ModelOptionsMutation.LoadUpdatedOptions](state: ModelOptionsState, payload: DynamicFormData) {
        state.options = payload;
        state.validateError = null;
    },

    [ModelOptionsMutation.HasValidationError](state: ModelOptionsState, action: PayloadWithType<Error>) {
        state.validateError = action.payload;
    },

    [ModelOptionsMutation.Update](state: ModelOptionsState, payload: DynamicFormMeta) {
        state.valid = false;
        state.changes = true;
        state.optionsFormMeta = payload;
    },

    [ModelOptionsMutation.FetchingModelOptions](state: ModelOptionsState) {
        state.fetching = true;
    },

    [ModelOptionsMutation.ModelOptionsFetched](state: ModelOptionsState, action: PayloadWithType<DynamicFormMeta>) {
        const newForm = {...updateForm(state.optionsFormMeta, action.payload)};
        state.valid = state.valid && JSON.stringify(newForm) == JSON.stringify(state.optionsFormMeta);
        state.optionsFormMeta = newForm;
        state.fetching = false;
    },

    [ModelOptionsMutation.ModelOptionsError](state: ModelOptionsState, action: PayloadWithType<Error>) {
        state.optionsError = action.payload;
        state.fetching = false;
    },

    [ModelOptionsMutation.SetModelOptionsVersion](state: ModelOptionsState, action: PayloadWithType<VersionInfo>) {
        state.version = action.payload
    }
};
