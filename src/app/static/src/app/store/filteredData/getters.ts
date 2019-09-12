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
                    result.age = [
                        {name: "0-5", id: "age_1"},
                        {name: "5-10", id: "age_2"},
                        {name: "10-49", id: "age_3"}
                        ]
                }
                if (result && result.surveys.length == 0) {
                    result.surveys = [
                        {name: "Survey 1", id: "survey_1"},
                        {name: "Survey 2 ", id: "survey_2"},
                        {name: "Survey 3", id: "survey_3"}
                        ]
                }
                return result;
            default:
                return null;
        }
    },
    regionOptions: (state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any) => {
        let result =  rootState.baseline && rootState.baseline.shape ? rootState.baseline.shape.filters : null;
        //TODO: This is just to return something here until we have actual filter data from the API
        if (result && result.length == 0){
            result = [
                {name: "Northern Region", id: "MWI.1", options: [
                        {name: "Chitipa", id: "MWI.1.1"},
                        {name: "Karonga", id: "MWI.1.2"}
                    ]},
                {name: "Central Region", id: "MWI.2", options: [
                        {name: "Dedza", id: "MWI.2.1"},
                        {name: "Dowa", id: "MWI.2.2"}
                    ]},
                {name: "Southern Region", id: "MWI.3", options: [
                        {name: "Balaka", id: "MWI.3.1"}
                    ]}
            ];
        }
        return result;
    }
};
