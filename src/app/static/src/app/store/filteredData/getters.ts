import {RootState} from "../../root";
import {DataType, FilteredDataState} from "./filteredData";
import {Dict, IndicatorRange, Indicators} from "../../types";
import {interpolateCool, interpolateWarm} from "d3-scale-chromatic";
import {FilterOption, NestedFilterOption} from "../../generated";
import {flattenOptions} from "../../utils";
import {getColor, getUnfilteredData, includeRowForSelectedChoroplethFilters, sexFilterOptions} from "./utils";

export const getters = {
    selectedDataFilterOptions: (state: FilteredDataState, getters: any, rootState: RootState): Dict<FilterOption[] | undefined> | null => {
        const sapState = rootState.surveyAndProgram;
        const regions = getters.regionOptions;
        switch (state.selectedDataType) {
            case (DataType.ANC):
                return sapState.anc ?
                    {
                        ...sapState.anc.filters,
                        regions,
                        sex: undefined,
                        surveys: undefined
                    } : null;
            case (DataType.Program):
                return sapState.program ?
                    {
                        ...sapState.program.filters,
                        regions,
                        sex: sexFilterOptions,
                        surveys: undefined
                    } : null;
            case (DataType.Survey):
                return sapState.survey ?
                    {
                        ...sapState.survey.filters,
                        regions,
                        sex: sexFilterOptions,
                        quarter: undefined
                    } : null;
            case (DataType.Output):
                return rootState.modelRun.result ?
                    {
                        ...rootState.modelRun.result.filters,
                        regions,
                        sex: sexFilterOptions,
                        surveys: undefined
                    } : null;

            default:
                return null;
        }
    },
    regionOptions: (state: FilteredDataState, getters: any, rootState: RootState): NestedFilterOption[] => {
        const shape = rootState.baseline && rootState.baseline.shape ? rootState.baseline.shape : null;
        //We're skipping the top level, country region as it doesn't really contribute to the filtering
        return shape && shape.filters &&
        shape.filters.regions &&
        (shape.filters.regions as any).options ? (shape.filters.regions as any).options : null;
    },
    colorFunctions: function (state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any):
        Dict<(t: number) => string> {
        return {
            art: interpolateWarm,
            prev: interpolateCool
        }
    },
    regionIndicators: function (state: FilteredDataState, getters: any, rootState: RootState): Dict<Indicators> {
        const data = getUnfilteredData(state, rootState);
        if (!data || (state.selectedDataType == null)) {
            return {};
        }

        const result = {} as Dict<Indicators>;

        const flattenedRegions = getters.flattenedSelectedRegionFilters;

        for (const d of data) {
            const row = d as any;

            if (!includeRowForSelectedChoroplethFilters(row,
                state.selectedDataType,
                state.selectedChoroplethFilters,
                flattenedRegions)) {
                continue;
            }

            const areaId = row.area_id;

            //TODO: This will change when we have a metadata endpoint telling us which column to use as value for each
            //input data type and indicator
            //We will also have to deal will potential multiple values per row
            let indicator: string = "";
            let valueColumn: string = "";
            switch (state.selectedDataType) {
                case (DataType.Survey):
                    indicator = row["indicator"];
                    valueColumn = "est";
                    break;
                case (DataType.Program):
                    indicator = "artcov";
                    valueColumn = "current_art";
                    break;
                case (DataType.ANC):
                    //TODO: once using metadata, we need to allow multiple values per row, as in the case on ANC data
                    //which contains both prevalence and art data in each row (wide format), unlike survey, which
                    //is int long format, with an indicator column to show which indicator the value each row provides
                    indicator = "prev";
                    valueColumn = "prevalence";
                    break;
                case (DataType.Output):
                    //TODO: output data doesn't currently conform to plotting metadata - use that when it does
                    indicator = "prev";
                    valueColumn = "mean";
                    break;
            }

            const value = row[valueColumn];

            if (!result[areaId]) {
                result[areaId] = {};
            }

            const indicators = result[areaId];
            switch (indicator) {
                case("prev"):
                    indicators.prev = {value: value, color: ""};

                    break;
                case("artcov"):
                    indicators.art = {value: value, color: ""};

                    break;

                //TODO: Also expect recent and vls (viral load suppression) values for survey, need to add these as options
            }
        }
        //Now add the colours - we do this in a second step now, because we are calculating the range as we add the values
        //but once the range comes from the API, we can calculate the colours as we populate the values
        for (const region in result) {
            const indicators = result[region];
            if (indicators.art) {
                indicators.art.color = getColor(indicators.art, getters.choroplethRanges.art, getters.colorFunctions.art);
            }
            if (indicators.prev) {
                indicators.prev.color = getColor(indicators.prev, getters.choroplethRanges.prev, getters.colorFunctions.prev);
            }
        }
        return result;
    },
    flattenedRegionOptions: function (state: FilteredDataState, getters: any): Dict<NestedFilterOption> {
        const options = getters.regionOptions ? getters.regionOptions : [];
        return flattenOptions(options);
    },
    flattenedSelectedRegionFilters: function (state: FilteredDataState): Dict<NestedFilterOption> {
        const selectedRegions = state.selectedChoroplethFilters.regions ? state.selectedChoroplethFilters.regions : [];
        return flattenOptions(selectedRegions);
    },
    choroplethRanges: function (state: FilteredDataState, getters: any, rootState: RootState): Dict<IndicatorRange> {
        //TODO: do not hardcode to art and prev, but take indicators from metadata too
        const metadata = rootState.metadata.plottingMetadata!!;
        switch (state.selectedDataType) {
            case (DataType.ANC):
                const ancRange = metadata.anc.choropleth!!.indicators!!.prevalence!!;
                return {
                    prev: {
                        min: ancRange.min,
                        max: ancRange.max,
                    }
                };
            case (DataType.Program):
                const progRange = metadata.programme.choropleth!!.indicators!!.current_art!!;
                return {
                    art: {
                        min: progRange.min,
                        max: progRange.max,
                    }
                };
            case (DataType.Survey):
                const indicators = metadata.survey.choropleth!!.indicators!!;
                return {
                    prev: {
                        min: indicators.prevalence!!.min,
                        max: indicators.prevalence!!.max
                    },
                    art: {
                        min: indicators.art_coverage!!.min,
                        max: indicators.art_coverage!!.max
                    }
                };
            case (DataType.Output):
                const outputRange = metadata.output.choropleth!!.indicators!!.prevalence!!;
                return {
                    prev: {
                        min: outputRange.min,
                        max: outputRange.max
                    }
                };
            default:
                return {};
        }
    }
};
