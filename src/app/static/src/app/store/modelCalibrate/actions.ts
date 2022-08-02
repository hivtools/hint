import {ModelCalibrateState} from "./modelCalibrate";
import {ActionContext, ActionTree, Commit} from "vuex";
import {DynamicFormData, DynamicFormMeta} from "@reside-ic/vue-dynamic-form";
import {api} from "../../apiService";
import {RootState} from "../../root";
import {ModelCalibrateMutation} from "./mutations";
import {FilterOption, ModelResultResponse, ModelStatusResponse, ModelSubmitResponse} from "../../generated";
import {switches} from "../../featureSwitches";
import {Dict} from "../../types";
import {DownloadResultsMutation} from "../downloadResults/mutations";

export interface ModelCalibrateActions {
    fetchModelCalibrateOptions: (store: ActionContext<ModelCalibrateState, RootState>) => void
    submit: (store: ActionContext<ModelCalibrateState, RootState>, options: DynamicFormData) => void
    poll: (store: ActionContext<ModelCalibrateState, RootState>) => void
    getResult: (store: ActionContext<ModelCalibrateState, RootState>) => void
    getCalibratePlot: (store: ActionContext<ModelCalibrateState, RootState>) => void
    getComparisonPlot: (store: ActionContext<ModelCalibrateState, RootState>) => void
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

        commit({type: ModelCalibrateMutation.SetOptionsData, payload: options});

        const response = await api<ModelCalibrateMutation, ModelCalibrateMutation>(context)
            .withSuccess(ModelCalibrateMutation.CalibrateStarted)
            .withError(ModelCalibrateMutation.SetError)
            .postAndReturn<ModelSubmitResponse>(`model/calibrate/submit/${modelRunId}`, {options, version});

        if (response) {
            commit({type: `downloadResults/${DownloadResultsMutation.ResetIds}`}, {root: true});
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
        const {commit, dispatch, state} = context;
        const calibrateId = state.calibrateId;

        if (state.status.done) {
            const response = await api<ModelCalibrateMutation, ModelCalibrateMutation>(context)
                .ignoreSuccess()
                .withError(ModelCalibrateMutation.SetError)
                .freezeResponse()
                .get<ModelResultResponse>(`model/calibrate/result/${calibrateId}`);

            if (response) {
                const data = response.data;
                commit({type: ModelCalibrateMutation.CalibrateResultFetched, payload: data});
                commit({type: ModelCalibrateMutation.WarningsFetched, payload: data.warnings});

                selectFilterDefaults(data, commit, "updateBarchartSelections")
                commit(ModelCalibrateMutation.Calibrated);
                if (switches.modelCalibratePlot) {
                    dispatch("getCalibratePlot");
                }
                if (switches.comparisonPlot) {
                    dispatch("getComparisonPlot");
                }
            }
        }
        commit(ModelCalibrateMutation.Ready);
    },

    async getCalibratePlot(context) {
        const {commit, state} = context;
        const calibrateId = state.calibrateId;
        commit(ModelCalibrateMutation.CalibrationPlotStarted);

        const response = await api<ModelCalibrateMutation, ModelCalibrateMutation>(context)
            .ignoreSuccess()
            .withError(ModelCalibrateMutation.SetError)
            .freezeResponse()
            .get<ModelResultResponse>(`model/calibrate/plot/${calibrateId}`);

        if (response) {
            commit(ModelCalibrateMutation.SetPlotData, response.data);
        }
    },

    async getComparisonPlot(context) {
        const {commit, state} = context;
        const calibrateId = state.calibrateId;
        commit(ModelCalibrateMutation.ComparisonPlotStarted);

        const response = await api<ModelCalibrateMutation, ModelCalibrateMutation>(context)
            .withError(ModelCalibrateMutation.SetError)
            // .withSuccess(ModelCalibrateMutation.SetComparisonPlotData)
            .ignoreSuccess()
            .freezeResponse()
            .get<ModelResultResponse>(`model/comparison/plot/${calibrateId}`);

        if (response) {
            console.log("response", response)
            if (response.data){
                selectFilterDefaults(response.data, commit, "updateComparisonPlotSelections")
            }
            commit(ModelCalibrateMutation.SetComparisonPlotData, response.data);
        }
    }
};

export const getCalibrateStatus = async function (context: ActionContext<ModelCalibrateState, RootState>) {
    const {dispatch, state} = context;
    const calibrateId = state.calibrateId;
    return api<ModelCalibrateMutation, ModelCalibrateMutation>(context)
        .withSuccess(ModelCalibrateMutation.CalibrateStatusUpdated)
        .withError(ModelCalibrateMutation.SetError)
        .get<ModelStatusResponse>(`model/calibrate/status/${calibrateId}`)
        .then(() => {
            if (state.status && state.status.done) {
                dispatch("getResult");
            }
        });
};

const selectFilterDefaults = (data: ModelResultResponse, commit: Commit, mutationName: string) => {
    if (data?.plottingMetadata?.barchart?.defaults) {
        const defaults = data.plottingMetadata.barchart.defaults;
        const unfrozenDefaultOptions = Object.keys(defaults.selected_filter_options)
            .reduce((dict, key) => {
                dict[key] = [...defaults.selected_filter_options[key]];
                return dict;
            }, {} as Dict<FilterOption[]>);

        commit({
                type: `plottingSelections/${mutationName}`,
                payload: {
                    indicatorId: defaults.indicator_id,
                    xAxisId: defaults.x_axis_id,
                    disaggregateById: defaults.disaggregate_by_id,
                    selectedFilterOptions: unfrozenDefaultOptions
                }
            },
            {root: true});
    }
}
