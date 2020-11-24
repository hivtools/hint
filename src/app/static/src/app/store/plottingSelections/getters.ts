import {DataType} from "../surveyAndProgram/surveyAndProgram";
import {RootState} from "../../root";
import {ScaleSelections, PlottingSelectionsState} from "./plottingSelections";

export const getters = {
    selectedSAPColourScales: (state: PlottingSelectionsState, getters: any, rootState: RootState): ScaleSelections => {
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
    }
};
