import {Module} from "vuex";
import {RootState} from "../../root";
import {BarchartIndicator, Filter} from "../../types";
import {FilterOption} from "../../generated";

const namespaced: boolean = true;

export interface ModelOutputState {}

export const modelOutputGetters = {
    barchartIndicators: (state: ModelOutputState, getters: any, rootState: RootState): BarchartIndicator[] => {
        //TODO: Get these from metadata in ModelResultResponse
        return [
            {
                "indicator": "art_coverage",
                "value_column": "mean",
                "indicator_column": "indicator_id",
                "indicator_value": "4",
                "name": "ART coverage",
                "error_low_column": "lower",
                "error_high_column": "upper"
            },
            {
                "indicator": "current_art",
                "value_column": "mean",
                "indicator_column": "indicator_id",
                "indicator_value": "5",
                "name": "ART number",
                "error_low_column": "lower",
                "error_high_column": "upper"
            },
            {
                "indicator": "incidence",
                "value_column": "mean",
                "indicator_column": "indicator_id",
                "indicator_value": "6",
                "name": "Incidence",
                "error_low_column": "lower",
                "error_high_column": "upper"
            },
            {
                "indicator": "new_infections",
                "value_column": "mean",
                "indicator_column": "indicator_id",
                "indicator_value": "7",
                "name": "New Infections",
                "error_low_column": "lower",
                "error_high_column": "upper"
            },
            {
                "indicator": "plhiv",
                "value_column": "mean",
                "indicator_column": "indicator_id",
                "indicator_value": "3",
                "name": "PLHIV",
                "error_low_column": "lower",
                "error_high_column": "upper"
            },
            {
                "indicator": "population",
                "value_column": "mean",
                "indicator_column": "indicator_id",
                "indicator_value": "1",
                "name": "Population",
                "error_low_column": "lower",
                "error_high_column": "upper"
            },
            {
                "indicator": "prevalence",
                "value_column": "mean",
                "indicator_column": "indicator_id",
                "indicator_value": "2",
                "name": "Prevalence",
                "error_low_column": "lower",
                "error_high_column": "upper"
            }];
    },
    barchartFilters: (state: ModelOutputState, getters: any, rootState: RootState): Filter[] => {
        //TODO: Get these from ModelResultResponse
        const filterOptions = rootState.modelRun.result!!.filters!!;

        const regions: FilterOption[] = rootState.baseline.shape!!.filters!!.regions ?
                                        [rootState.baseline.shape!!.filters!!.regions] : [];

        return [
            {
                "id": "age",
                "column_id": "age_group_id",
                "label": "Age group",
                "options": filterOptions.age || []
            },
            {
                "id": "sex",
                "column_id": "sex",
                "label": "Sex",
                "options": [
                    {"id": "female", "label": "female"},
                    {"id": "male", "label": "male"},
                    {"id": "both", "label": "both"}
                ]
            },
            {
                "id": "region",
                "column_id": "area_id",
                "label": "Region",
                "options": regions
            },
            {
                "id": "quarter",
                "column_id": "quarter_id",
                "label": "Quarter",
                "options": filterOptions.quarter || []
            }
        ];
    }
};

export const modelOutput: Module<ModelOutputState, RootState> = {
    namespaced,
    state: {},
    getters: modelOutputGetters
};