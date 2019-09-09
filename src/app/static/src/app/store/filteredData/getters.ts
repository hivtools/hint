import {RootState} from "../../root";
import {DataType, FilteredDataState} from "./filteredData";

export const getters = {
    selectedDataFilterOptions: (state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any) => {
        const sapState = rootState.surveyAndProgram;
        switch(state.selectedDataType){
            case (DataType.ANC):
                return sapState.anc ? sapState.anc.filters : null;
            case (DataType.Program):
                return sapState.program ? sapState.program.filters : null;
            case (DataType.Survey):
                //TODO: This is just to return something here until we have actual filter data from the API
                const result = sapState.survey ? sapState.survey.filters : null;
                if (result && result.age.length == 0) {
                    result.age = ["0-5", "5-10", "10-49"]
                }
                if (result && result.surveys.length == 0) {
                    result.surveys = ["Survey 1", "Survey2 ", "Survey 3"]
                }
                return result;
            default:
                return null;
        }
    }
};
