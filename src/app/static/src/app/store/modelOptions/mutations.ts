import {MutationTree} from 'vuex';
import {ModelOptionsState} from "./modelOptions";
import {Control, SelectControl, MultiSelectControl, Option, DynamicFormData, DynamicFormMeta} from "@reside-ic/vue-next-dynamic-form";
import {PayloadWithType} from "../../types";
import {writeOptionsIntoForm} from "../../utils";
import {checkOptionsValid} from "./optionsUtils";
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
        writeOptionsIntoForm(state.options, action.payload);
        state.optionsFormMeta = action.payload;
        state.valid = state.valid && checkOptionsValid(state.optionsFormMeta);
        state.fetching = false;
    },

    [ModelOptionsMutation.ModelOptionsError](state: ModelOptionsState, action: PayloadWithType<Error>) {
        state.optionsError = action.payload;
        state.fetching = false;
    },

    [ModelOptionsMutation.SetModelOptionsVersion](state: ModelOptionsState, action: PayloadWithType<VersionInfo>) {
        state.version = action.payload;
    }
};
