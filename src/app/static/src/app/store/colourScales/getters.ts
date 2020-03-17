import {DataType} from "../surveyAndProgram/surveyAndProgram";
import {RootState} from "../../root";
import {ColourScaleSelections, ColourScalesState} from "./colourScales";

export const getters = {
    selectedSAPColourScales: (state: ColourScalesState, getters: any, rootState: RootState): ColourScaleSelections => {
        const dataType = rootState.surveyAndProgram.selectedDataType;
        switch (dataType) {
            case DataType.Survey:
                return state.survey;
            case DataType.ANC:
                return state.anc;
            case DataType.Program:
                return state.program;
            default:
                return {}
        }
    }
};