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
                return sapState.survey ? sapState.survey.filters : null;
            default:
                return null;
        }
    },
    regionOptions: (state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any) => {
        const shape = rootState.baseline && rootState.baseline.shape ? rootState.baseline.shape : null;
        let result =  shape && shape.filters && shape.filters.regions ? shape.filters.regions : [];
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
