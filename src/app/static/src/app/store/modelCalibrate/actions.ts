import {ModelCalibrateState} from "./modelCalibrate";
import {ActionContext, ActionTree} from "vuex";
import {DynamicFormData, DynamicFormMeta} from "@reside-ic/vue-dynamic-form";
import {api} from "../../apiService";
import {RootState} from "../../root";
import {ModelCalibrateMutation} from "./mutations";
import {ModelRunMutation} from "../modelRun/mutations";
import {ModelResultResponse, ModelStatusResponse, ModelSubmitResponse} from "../../generated";
import {freezer} from "../../utils";
import {ModelRunState} from "../modelRun/modelRun";

export interface ModelCalibrateActions {
    fetchModelCalibrateOptions: (store: ActionContext<ModelCalibrateState, RootState>) => void
    submit: (store: ActionContext<ModelCalibrateState, RootState>, options: DynamicFormData) => void
    poll: (store: ActionContext<ModelCalibrateState, RootState>) => void
    getResult: (store: ActionContext<ModelCalibrateState, RootState>) => void
}

export const actions: ActionTree<ModelCalibrateState, RootState> & ModelCalibrateActions = {

    async fetchModelCalibrateOptions(context) {
        const {commit} = context;
        commit(ModelCalibrateMutation.FetchingModelCalibrateOptions);
        const response = await api<ModelCalibrateMutation, ModelCalibrateMutation>(context)
            .withSuccess(ModelCalibrateMutation.ModelCalibrateOptionsFetched)
            .ignoreErrors()
            .get<DynamicFormMeta>("model/calibrate/options/");

        if (response) {
            commit({type: ModelCalibrateMutation.SetModelCalibrateOptionsVersion, payload: response.version});
        }
    },

    async submit(context, options) {
        const {commit, dispatch, state, rootState} = context;
        const modelRunId = rootState.modelRun.modelRunId;
        const version = state.version;

        commit(ModelCalibrateMutation.SetOptionsData, options);

        const response = await api<ModelCalibrateMutation, ModelCalibrateMutation>(context)
            .withSuccess(ModelCalibrateMutation.CalibrateStarted)
            .withError(ModelCalibrateMutation.SetError)
            .postAndReturn<ModelSubmitResponse>(`model/calibrate/submit/${modelRunId}`, {options, version});

        if (response) {
            await dispatch("poll");
        }
    },

    async poll(context) {
        const {commit} = context;
        const id = setInterval(() => {
            getCalibrateStatus(context);
        }, 2000);

        commit({type: "PollingForStatusStarted", payload: id});
    },

    async getResult(context) {
        const {commit, state} = context;
        const calibrateId = state.calibrateId;

        if (state.status.done && state.status.success) {
            const response = await api<ModelCalibrateMutation, ModelCalibrateMutation>(context)
                .ignoreSuccess()
                .withError(ModelCalibrateMutation.SetError)
                .freezeResponse()
                .get<ModelResultResponse>(`model/calibrate/result/${calibrateId}`);

            if (response) {
                const data = freezer.deepFreeze(response.data);
                commit({type: `modelRun/${ModelRunMutation.RunResultFetched}`, payload: data}, {root: true});

                if (data && data.plottingMetadata && data.plottingMetadata.barchart.defaults) {
                    const defaults = data.plottingMetadata.barchart.defaults;
                    commit({
                            type: "plottingSelections/updateBarchartSelections",
                            payload: {
                                indicatorId: defaults.indicator_id,
                                xAxisId: defaults.x_axis_id,
                                disaggregateById: defaults.disaggregate_by_id,
                                selectedFilterOptions: {...defaults.selected_filter_options}
                            }
                        },
                        {root: true});
                }

                commit(ModelCalibrateMutation.Calibrated);
            }
        }
        commit({type: "modelRun/Ready", payload: true}, {root: true});
    }
};

export const getCalibrateStatus = async function(context: ActionContext<ModelCalibrateState, RootState>) {
    const {dispatch, state} = context;
    const calibrateId = state.calibrateId;
    return api<ModelCalibrateMutation, ModelCalibrateMutation>(context)
        .withSuccess(ModelCalibrateMutation.CalibrateStatusUpdated)
        .withError(ModelCalibrateMutation.SetError)
        .get<ModelStatusResponse>(`model/calibrate/status/${calibrateId}`)
        .then(() => {
            if (state.status && state.status.done && state.status.success) {
                dispatch("getResult");
            }
        });
};
