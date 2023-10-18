import {MutationTree} from 'vuex';
import {ModelOptionsState} from "./modelOptions";
import {Control, SelectControl, MultiSelectControl, Option, DynamicFormData, DynamicFormMeta} from "@reside-ic/vue-next-dynamic-form";
import {PayloadWithType} from "../../types";
import {writeOptionsIntoForm} from "../../utils";
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
        const newForm = writeOptionsIntoForm(state.options, action.payload);
        state.valid = state.valid && checkOptionsValid(newForm);
        state.optionsFormMeta = newForm;
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

function checkOptionsValid(formMeta: DynamicFormMeta): boolean {
    let valid = true;
    formMeta.controlSections.forEach(section => {
        section.controlGroups.forEach(group => {
            group.controls.forEach(control => {
                // We could go further and check that if it is null or empty that this isn't
                // a required control but just assuming this for now seems ok
                if (control.value != null && control.value != "" && hasOptions(control)) {
                    valid = valid && checkControlOptionValid(control);
                }
            })
        })
    })
    return valid;
}

type ControlWithOptions = SelectControl | MultiSelectControl;

function hasOptions(control: Control): control is ControlWithOptions {
    return control.type === "select" || control.type === "multiselect";
}

function checkControlOptionValid(control: ControlWithOptions): boolean {
    let valid = true;

    const options = getAllOptions(control)
    const value = control.value;
    // Check string and array types, otherwise we assume valid
    if (typeof value === 'string') {
        valid = options.includes(value);
    } else if (Array.isArray(value)) {
        valid = value.every(item => options.includes(item));
    }

    return valid;
}

function getAllOptions(control: ControlWithOptions): string[] {
    const options= control.options.map((option: Option) => getOptions(option));
    return options.flat();
}

function getOptions(option: Option): string[] {
    const options = [option.id];
    if (option.children !== undefined) {
        options.concat(...option.children.map((child: Option) => getOptions(child)));
    }
    return options;
}
