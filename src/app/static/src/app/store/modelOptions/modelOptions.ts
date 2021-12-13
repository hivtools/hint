import {Module} from "vuex";
import {RootState, WarningsState} from "../../root";
import {DynamicFormData, DynamicFormMeta} from "@reside-ic/vue-dynamic-form";
import {mutations} from "./mutations";;
import {actions} from "./actions";
import {VersionInfo, Error} from "../../generated";

export interface ModelOptionsState extends WarningsState {
    optionsFormMeta: DynamicFormMeta
    options: DynamicFormData
    changes: boolean
    valid: boolean
    validating: boolean
    fetching: boolean
    version: VersionInfo
    validateError: Error | null
    optionsError: Error | null
}

export const initialModelOptionsState = (): ModelOptionsState => {
    return {
        optionsFormMeta: {controlSections: []},
        options: {},
        changes: false,
        valid: false,
        validating: false,
        fetching: false,
        version: {hintr: "unknown", naomi: "unknown", rrq: "unknown"},
        validateError: null,
        optionsError: null,
        warnings: []
    }
};

export const modelOptionsGetters = {
    complete: (state: ModelOptionsState) => {
        return state.valid
    },
    hasChanges: (state: ModelOptionsState) => {
        return state.changes
    }
};

const namespaced = true;

export const modelOptions = (existingState: Partial<RootState> | null): Module<ModelOptionsState, RootState> => {
    return {
        namespaced,
        state: {...initialModelOptionsState(), ...existingState && existingState.modelOptions},
        mutations,
        actions,
        getters: modelOptionsGetters
    };
};
