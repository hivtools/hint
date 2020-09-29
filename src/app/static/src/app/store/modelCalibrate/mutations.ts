import {MutationTree} from 'vuex';
import {ModelCalibrateState} from "./modelCalibrate";
import {DynamicFormData, DynamicFormMeta} from "@reside-ic/vue-dynamic-form";
import {PayloadWithType} from "../../types";
import {updateForm} from "../../utils";

export enum ModelCalibrateMutation {
    FetchingModelCalibrateOptions = "FetchingModelCalibrateOptions",
    ModelCalibrateOptionsFetched = "ModelCalibrateOptionsFetched",
    Update = "Update",
    Calibrated = "Calibrated"
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
        state.optionsFormMeta = payload;
    },

    [ModelCalibrateMutation.Calibrated](state: ModelCalibrateState) {
        state.complete = true;
    },
};
