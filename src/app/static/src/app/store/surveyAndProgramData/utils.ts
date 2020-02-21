import {RootState} from "../../root";

import * as d3ScaleChromatic from "d3-scale-chromatic";

export const roundToContext = function (value: number, context: number) {
    //Rounds the value to one more decimal place than is present in the 'context'
    const maxFraction = context.toString().split(".");
    const maxDecPl = maxFraction.length > 1 ? maxFraction[1].length : 0;
    const roundingNum = Math.pow(10, maxDecPl + 1);

    return Math.round(value * roundingNum) / roundingNum;
};

/*export const getUnfilteredData = (state: FilteredDataState, rootState: RootState) => {
    const sapState = rootState.surveyAndProgram;
    switch (state.selectedDataType) {
        case (DataType.ANC):
            return sapState.anc ? sapState.anc.data : null;
        case (DataType.Program):
            return sapState.program ? sapState.program.data : null;
        case (DataType.Survey):
            return sapState.survey ? sapState.survey.data : null;
        case (DataType.Output):
            return rootState.modelRun.result ? rootState.modelRun.result.data : null;
        default:
            return null;
    }
};*/

