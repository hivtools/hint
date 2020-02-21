import {SurveyAndProgramState, DataType} from "./surveyAndProgram";
import {RootState} from "../../root";
import {Dict, Filter} from "../../types";
import {FilterOption} from "../../generated";

function response(state: SurveyAndProgramState){
    switch (state.selectedDataType) {
        case (DataType.ANC):
            return state.anc;
        case (DataType.Program):
            return state.program;
        case (DataType.Survey):
            return state.survey;
        default:
            return null;
    }
}

const sexFilterOptions = [
    {id: "both", label: "both"},
    {id: "female", label: "female"},
    {id: "male", label: "male"}
];

export const getters = {
    complete: (state: SurveyAndProgramState) => {
        return !!state.survey && !state.programError && !state.ancError
    },

    data: (state: SurveyAndProgramState) => {
        const res = response(state);
        return res ? res.data : null;
    },

    filters: (state: SurveyAndProgramState, getters: any, rootState: RootState): Filter[] => {
        const result = [] as Filter[];

        if (state.selectedDataType == null) {
            return result;
        }

        //TODO: Replace this knowledge of Choropleth filters with metadata

        if (rootState.baseline) {
            result.push({
                id: "area",
                column_id: "area_id",
                label: "area",
                options: [rootState.baseline.shape!!.filters!!.regions as FilterOption]
            });
        }

        const res = response(state);
        const filters = res ?  res.filters : {} as any;

        result.push({
            id: "year",
            column_id: "year",
            label: "year",
            options: filters.year || []
        });

        const sexFilterOptionsForType =
            state.selectedDataType == DataType.Survey || state.selectedDataType == DataType.Program ? sexFilterOptions : [];

        result.push({
            id: "sex",
            column_id: "sex",
            label: "sex",
            options: sexFilterOptionsForType
        });


        result.push({
            id: "age",
            column_id: "age_group",
            label: "age",
            options: filters.age || []
        });

        result.push({
            id: "survey",
            column_id: "survey_id",
            label: "survey",
            options: filters.surveys || []
        });

        return result;
    }
};