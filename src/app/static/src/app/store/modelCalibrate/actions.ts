import {ModelCalibrateState} from "./modelCalibrate";
import {ActionContext, ActionTree} from "vuex";
import {DynamicFormMeta} from "@reside-ic/vue-dynamic-form";
import {api} from "../../apiService";
import {RootState} from "../../root";
import {ModelCalibrateMutation} from "./mutations";

export interface ModelCalibrateActions {
    fetchModelCalibrateOptions: (store: ActionContext<ModelCalibrateState, RootState>) => void
    calibrate: (store: ActionContext<ModelCalibrateState, RootState>) => void
}

export const actions: ActionTree<ModelCalibrateState, RootState> & ModelCalibrateActions = {

    async fetchModelCalibrateOptions(context) {
        const {commit} = context;
        commit(ModelCalibrateMutation.FetchingModelCalibrateOptions);
        const response = await api<ModelCalibrateMutation, ModelCalibrateMutation>(context)
            .withSuccess(ModelCalibrateMutation.ModelCalibrateOptionsFetched)
            .ignoreErrors()
            .get<DynamicFormMeta>("/model/calibrate-options/");

        if (response) {
            commit({type: ModelCalibrateMutation.SetModelCalibrateOptionsVersion, payload: response.version});
        }
    },

    async calibrate(context) {
        const {commit} = context;
        //TODO: send calibration form values to backend, and get results
        commit(ModelCalibrateMutation.Calibrated);
    }
};
