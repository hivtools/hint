import {Module} from "vuex";
import {ReadyState, RootState} from "../../root";
import {DynamicFormData, DynamicFormMeta} from "@reside-ic/vue-dynamic-form";
import {mutations} from "./mutations";
import {localStorageManager} from "../../localStorageManager";
import {actions} from "./actions";
import {VersionInfo, Error, CalibrateStatusResponse} from "../../generated";
import {BarchartIndicator, Filter} from "../../types";

export interface ModelCalibrateState extends ReadyState {
    optionsFormMeta: DynamicFormMeta
    options: DynamicFormData
    fetching: boolean
    calibrateId: string
    statusPollId: number
    status: CalibrateStatusResponse
    calibrating: boolean
    complete: boolean
    generatingCalibrationPlot: boolean
    calibrationPlotGenerated: boolean
    calibratePlotResult: any,
    version: VersionInfo
    error: Error | null
}

export const initialModelCalibrateState = (): ModelCalibrateState => {
    return {
        ready: false,
        optionsFormMeta: {controlSections: []},
        options: {},
        fetching: false,
        calibrateId: "",
        statusPollId: -1,
        status: {} as CalibrateStatusResponse,
        calibrating: false,
        complete: false,
        generatingCalibrationPlot: false,
        calibrationPlotGenerated: false,
        calibratePlotResult: null,
        version: {hintr: "unknown", naomi: "unknown", rrq: "unknown"},
        error: null
    }
};

export const modelCalibrateGetters = {
    indicators: (state: ModelCalibrateState, getters: any, rootState: RootState): BarchartIndicator[] => {
        return rootState.modelCalibrate.calibratePlotResult!.plottingMetadata.barchart.indicators;
    },
    filters: (state: ModelCalibrateState, getters: any, rootState: RootState): Filter[] => {
        return calibratePlotFilters(rootState);
    }
};

const calibratePlotFilters = (rootState: RootState) => {
    let filters = [
        ...rootState.modelCalibrate.calibratePlotResult!.plottingMetadata.barchart.filters,
    ];

    filters.push({
        id: "dataType", //could be snake case like the column_id, but just distinguishing here
        label: "Data Type",
        column_id: "data_type",
        options: [
            {id: "spectrum", label: "spectrum"},
            {id: "unadjusted", label: "unadjusted"},
            {id: "calibrated", label: "calibrated"}
            ]
    });

    filters.push({
        id: "spectrumRegionName",
        label: "Spectrum Region Name",
        column_id: "spectrum_region_name",
        options: [{id: "Northern", label: "Northern"}, {id: "Southern", label: "Southern"}]
    });

    return [...filters];
}

const namespaced = true;

const existingState = localStorageManager.getState();

export const modelCalibrate: Module<ModelCalibrateState, RootState> = {
    namespaced,
    state: {...initialModelCalibrateState(), ...existingState && existingState.modelCalibrate, ready: false},
    getters: modelCalibrateGetters,
    mutations,
    actions
};
