import {Module} from "vuex";
import {ReadyState, RootState, WarningsState} from "../../root";
import {DynamicFormData, DynamicFormMeta} from "@reside-ic/vue-next-dynamic-form";
import {mutations} from "./mutations";
import {actions} from "./actions";
import {
    VersionInfo,
    Error,
    CalibrateStatusResponse,
    CalibrateResultResponse,
    ComparisonPlotResponse,
    CalibrateDataResponse, CalibrateMetadataResponse
} from "../../generated";
import {BarchartIndicator, BubbleIndicatorValues, Dict, Filter} from "../../types";
import {BarchartSelections, IndicatorSelections} from "../plottingSelections/plottingSelections";

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
    result: CalibrateData,
    version: VersionInfo
    error: Error | null
    comparisonPlotError: Error | null,
    metadata: CalibrateMetadataResponse | null
}

export type CalibrateData = Dict<CalibrateDataResponse["data"]>;

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
        result: {},
        version: {hintr: "unknown", naomi: "unknown", rrq: "unknown"},
        error: null,
        comparisonPlotError: null,
        warnings: [],
        metadata: null
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
    },
    calibrateData: (state: ModelCalibrateState) => (indicators: IndicatorSelections) => {

        // const res: CalibrateDataResponse["data"] = []
        // if (state.result) {
        //     indicators.forEach(indicator => {
        //         console.log(state.result[indicator] instanceof Array)
        //         res.push(...(state.result[indicator] as any))
        //     })
        // }

        return (state.result && Object.keys(state.result).length > 0 && indicators?.length > 0) ? state.result[indicators[0]] : []
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
