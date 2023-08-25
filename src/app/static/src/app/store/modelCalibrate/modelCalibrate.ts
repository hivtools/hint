import {Module} from "vuex";
import {ReadyState, RootState, WarningsState} from "../../root";
import {DynamicFormData, DynamicFormMeta} from "@reside-ic/vue-next-dynamic-form";
import {mutations} from "./mutations";
import {actions} from "./actions";
import {VersionInfo, Error, CalibrateStatusResponse, CalibrateResultResponse, ComparisonPlotResponse} from "../../generated";
import {BarchartIndicator, Filter} from "../../types";
import {BarchartSelections, PlottingSelectionsState} from "../plottingSelections/plottingSelections";

export interface ModelCalibrateState extends ReadyState, WarningsState {
    optionsFormMeta: DynamicFormMeta
    options: DynamicFormData
    fetching: boolean
    calibrateId: string
    statusPollId: number
    status: CalibrateStatusResponse
    calibrating: boolean
    complete: boolean
    generatingCalibrationPlot: boolean
    calibratePlotResult: any,
    comparisonPlotResult: ComparisonPlotResponse | null,
    result: CalibrateResultResponse | null
    version: VersionInfo
    error: Error | null
    comparisonPlotError: Error | null
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
        calibratePlotResult: null,
        comparisonPlotResult: null,
        result: null,
        version: {hintr: "unknown", naomi: "unknown", rrq: "unknown"},
        error: null,
        comparisonPlotError: null,
        warnings: []
    }
};

export const modelCalibrateGetters = {
    indicators: (state: ModelCalibrateState): BarchartIndicator[] => {
        return state.calibratePlotResult!.plottingMetadata.barchart.indicators;
    },
    filters: (state: ModelCalibrateState): Filter[] => {
        return state.calibratePlotResult!.plottingMetadata.barchart.filters;
    },
    calibratePlotDefaultSelections: (state: ModelCalibrateState): BarchartSelections => {
        return state.calibratePlotResult!.plottingMetadata.barchart.defaults;
    }
};

const namespaced = true;

export const modelCalibrate = (existingState: Partial<RootState> | null): Module<ModelCalibrateState, RootState> => {
    return {
        namespaced,
        state: {...initialModelCalibrateState(), ...existingState && existingState.modelCalibrate, ready: false},
        getters: modelCalibrateGetters,
        mutations,
        actions
    };
};
