import {MutationTree} from 'vuex';
import {ModelCalibrateState} from "./modelCalibrate";
import {DynamicFormData, DynamicFormMeta} from "@reside-ic/vue-dynamic-form";
import {PayloadWithType} from "../../types";
import {updateForm} from "../../utils";
import {Error, VersionInfo} from "../../generated";

export enum ModelCalibrateMutation {
    FetchingModelCalibrateOptions = "FetchingModelCalibrateOptions",
    ModelCalibrateOptionsFetched = "ModelCalibrateOptionsFetched",
    SetModelCalibrateOptionsVersion = "SetModelCalibrateOptionsVersion",
    Update = "Update",
    Calibrating = "Calibrating",
    Calibrated = "Calibrated",
    SetOptionsData = "SetOptionsData",
    SetError = "SetError"
}

export const mutations: MutationTree<ModelCalibrateState> = {
    [ModelCalibrateMutation.FetchingModelCalibrateOptions](state: ModelCalibrateState) {
        state.fetching = true;
    },

    [ModelCalibrateMutation.ModelCalibrateOptionsFetched](state: ModelCalibrateState, action: PayloadWithType<DynamicFormMeta>) {
        const newForm = {...updateForm(state.optionsFormMeta, action.payload)};
        state.optionsFormMeta = newForm;
        state.fetching = false;
    },

    [ModelCalibrateMutation.Update](state: ModelCalibrateState, payload: DynamicFormMeta) {
        state.complete = false;
        state.changes = true;
        state.optionsFormMeta = payload;
    },

    [ModelCalibrateMutation.Calibrating](state: ModelCalibrateState) {
        state.calibrating = true;
        state.error = null;
    },

    [ModelCalibrateMutation.Calibrated](state: ModelCalibrateState) {
        state.complete = true;
        state.calibrating = false
    },

    [ModelCalibrateMutation.SetModelCalibrateOptionsVersion](state: ModelCalibrateState, action: PayloadWithType<VersionInfo>) {
        state.version = action.payload;
    },

    [ModelCalibrateMutation.SetOptionsData](state: ModelCalibrateState, action: PayloadWithType<DynamicFormData>) {
        state.options = action.payload;
    },

    [ModelCalibrateMutation.SetError](state: ModelCalibrateState, action: PayloadWithType<Error>) {
        state.error = action.payload;
        state.calibrating = false;
    }
};
