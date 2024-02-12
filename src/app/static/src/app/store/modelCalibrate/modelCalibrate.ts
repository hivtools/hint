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
    CalibrateDataResponse,
    CalibrateMetadataResponse, FilterTypes,
} from "../../generated";
import {filterAfterUseShapeRegions, filtersAfterUseShapeRegions} from "../plotSelections/utils";
import {PlotName} from "../plotSelections/plotSelections";

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
    result: CalibrateDataResponse | CalibrateResultResponse | null
    fetchedIndicators: string[] | null
    version: VersionInfo
    error: Error | null
    comparisonPlotError: Error | null,
    metadata: CalibrateMetadataResponse | null
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
        fetchedIndicators: [],
        version: {hintr: "unknown", naomi: "unknown", rrq: "unknown"},
        error: null,
        comparisonPlotError: null,
        warnings: [],
        metadata: null
    }
};

export const modelCalibrateGetters = {
    outputFilterOptions: (state: ModelCalibrateState, getters: any, rootState: RootState) => (filterId: string) => {
        const type = state.metadata!.filterTypes.find(f => f.id === filterId);
        return filterAfterUseShapeRegions(type as FilterTypes, rootState).options;
    },
    plotControlOptions: (state: ModelCalibrateState) => (activePlot: PlotName, plotControlId: string) => {
        const control = state.metadata!.plotSettingsControl[activePlot].plotSettings.find(f => f.id === plotControlId);
        if (control) {
            return control.options;
        } else {
            return [];
        }
    },
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
