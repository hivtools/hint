import {Module} from "vuex";
import {ReadyState, RootState} from "../../root";
import {DynamicFormData, DynamicFormMeta} from "@reside-ic/vue-dynamic-form";
import {mutations} from "./mutations";
import {localStorageManager} from "../../localStorageManager";
import {actions} from "./actions";
import {VersionInfo, Error, CalibrateStatusResponse} from "../../generated";

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
    // fetchingCalibrationPlot: boolean
    calibrationPlotGenerated: boolean
    chartData: any,
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
        // fetchingCalibrationPlot: false,
        calibrationPlotGenerated: false,
        chartData: null,
        version: {hintr: "unknown", naomi: "unknown", rrq: "unknown"},
        error: null
    }
};

// const outputPlotFilters = (rootState: RootState) => {
//     let filters = [...rootState.modelCalibrate.chartData!.plottingMetadata.barchart.filters];
//     const area = filters.find((f: any) => f.id == "area");
//     if (area && area.use_shape_regions) {
//         const regions: FilterOption[] = rootState.baseline.shape!.filters!.regions ?
//             [rootState.baseline.shape!.filters!.regions] : [];

//         //remove old, frozen area filter, add new one with regions from shape
//         filters = [
//             {...area, options: regions},
//             ...filters.filter((f: any) => f.id != "area")
//         ];
//     }

//     return [
//         ...filters
//     ];
// };

const namespaced = true;

const existingState = localStorageManager.getState();

export const modelCalibrate: Module<ModelCalibrateState, RootState> = {
    namespaced,
    state: {...initialModelCalibrateState(), ...existingState && existingState.modelCalibrate, ready: false},
    mutations,
    actions
};
