import {MutationTree} from 'vuex';
import {ModelOptionsState} from "./modelOptions";
import {DynamicFormData, DynamicFormMeta} from "../../vue-dynamic-form/src/types";
import {PayloadWithType} from "../../types";
import {constructOptionsFormMetaFromData, updateForm} from "../../utils";
import {VersionInfo, Error, ModelOptionsValidate} from "../../generated";


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
    LoadUpdatedOptions = "LoadUpdatedOptions",
    ClearWarnings = "ClearWarnings"
}

export const ModelOptionsUpdates = [ModelOptionsMutation.Update, ModelOptionsMutation.UnValidate];

export const mutations: MutationTree<ModelOptionsState> = {
    [ModelOptionsMutation.UnValidate](state: ModelOptionsState) {
        state.valid = false;
        state.warnings = []
    },

    [ModelOptionsMutation.Validate](state: ModelOptionsState, action: PayloadWithType<ModelOptionsValidate>) {
        state.valid = true;
        state.warnings = action.payload.warnings
    },

    [ModelOptionsMutation.ClearWarnings](state: ModelOptionsState) {
        state.warnings = [];
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

        const newForm = state.optionsFormMeta.controlSections.length
            ? {...updateForm(state.optionsFormMeta, action.payload)}
            : constructOptionsFormMetaFromData(state, action.payload)
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
