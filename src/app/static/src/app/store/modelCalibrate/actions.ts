import {ModelCalibrateState} from "./modelCalibrate";
import {ActionContext, ActionTree} from "vuex";
import {DynamicFormData, DynamicFormMeta} from "@reside-ic/vue-dynamic-form";
import {api} from "../../apiService";
import {RootState} from "../../root";
import {ModelCalibrateMutation} from "./mutations";
import {ModelRunMutation} from "../modelRun/mutations";
import {ModelResultResponse} from "../../generated";
import {freezer} from "../../utils";

export interface ModelCalibrateActions {
    fetchModelCalibrateOptions: (store: ActionContext<ModelCalibrateState, RootState>) => void
    calibrate: (store: ActionContext<ModelCalibrateState, RootState>, options: DynamicFormData) => void
}

export const actions: ActionTree<ModelCalibrateState, RootState> & ModelCalibrateActions = {

    async fetchModelCalibrateOptions(context) {
        const {commit} = context;
        commit(ModelCalibrateMutation.FetchingModelCalibrateOptions);
        const response = await api<ModelCalibrateMutation, ModelCalibrateMutation>(context)
            .withSuccess(ModelCalibrateMutation.ModelCalibrateOptionsFetched)
            .ignoreErrors()
            .get<DynamicFormMeta>("/model/calibration-options/");

        if (response) {
            commit({type: ModelCalibrateMutation.SetModelCalibrateOptionsVersion, payload: response.version});
        }
    },

    async calibrate(context, options) {
        const {commit, state, rootState} = context;
        const modelRunId = rootState.modelRun.modelRunId;
        const version = state.version;
        commit(ModelCalibrateMutation.SetOptionsData, options);
        commit(ModelCalibrateMutation.Calibrating);
        const response = await api<ModelRunMutation, ModelCalibrateMutation>(context)
            .ignoreSuccess()
            .withError(ModelCalibrateMutation.SetError)
            .freezeResponse()
            .postAndReturn<ModelResultResponse>(`/model/calibrate/${modelRunId}`, {options, version});

        if (response) {
            const data = freezer.deepFreeze(response.data);
            commit({type: `modelRun/${ModelRunMutation.RunResultFetched}`, payload: data}, {root: true});
            commit(ModelCalibrateMutation.Calibrated);
        }
    }
};
