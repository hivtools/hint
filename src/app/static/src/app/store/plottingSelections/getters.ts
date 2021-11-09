import {DataType} from "../surveyAndProgram/surveyAndProgram";
import {ScaleSelections, PlottingSelectionsState, BarchartSelections} from "./plottingSelections";
import {DataExplorationState} from "../dataExploration/dataExploration";

export const getters = {
    selectedSAPColourScales: (state: PlottingSelectionsState, getters: any, rootState: DataExplorationState): ScaleSelections => {
        const dataType = rootState.surveyAndProgram.selectedDataType;
        switch (dataType) {
            case DataType.Survey:
                return state.colourScales.survey;
            case DataType.ANC:
                return state.colourScales.anc;
            case DataType.Program:
                return state.colourScales.program;
            default:
                return {}
        }
    },
    calibratePlotDefaultSelections: (state: PlottingSelectionsState, getters: any, rootState: DataExplorationState): BarchartSelections => {
        // TODO find solution to this hack
        return (rootState as any).modelCalibrate.calibratePlotResult!.plottingMetadata.barchart.defaults;
    }
};
