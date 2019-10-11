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
    regionIndicators: function (state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any): Dict<Indicators> {
        const data = getUnfilteredData(state, rootState);
        if (!data || (state.selectedDataType == null)) {
            return {};
        }

        const result = {} as Dict<Indicators>;

        const flattenedRegions = getters.flattenedSelectedRegionFilters;

        //TODO: output data doesn't currently conform to plotting metadata, so for now we fake the metadata
        //Use the real metadata for all other data types
        let indicatorsMeta = state.selectedDataType == DataType.Output ?
            {
                prevalence: {
                    value_column: "mean",
                    indicator_column: "indicator_id",
                    indicator_value: "2"
                }
            } :
            rootGetters['metadata/choroplethIndicatorsMetadata'];

        //TODO: ...and here's a workaround for a small bug in the current Survey metadata - 'art' for
        //indicator value, should be 'artcov'
        if (state.selectedDataType == DataType.Survey) {
            indicatorsMeta = {
                ...indicatorsMeta
            };
            indicatorsMeta.art_coverage.indicator_value = "artcov";
        }

        const indicators = Object.keys(indicatorsMeta);

        for (const row of data) {
            if (!includeRowForSelectedChoroplethFilters(row,
                state.selectedDataType,
                state.selectedChoroplethFilters,
                flattenedRegions)) {
                continue;
            }

            const areaId = row.area_id;

            for (const indicator of indicators) {

                const metadata = indicatorsMeta[indicator];

                if (metadata.indicator_column && metadata.indicator_value != row[metadata.indicator_column]) {
                    //This data is in long format, and the indicator column's value does not match that for this indicator
                    continue;
                }

                if (row[metadata.value_column] === undefined) {
                    //No value for this indicator in this row
                    continue;
                }

                const value = row[metadata.value_column];

                if (!result[areaId]) {
                    result[areaId] = {};
                }

                //TODO: Rather than hardcoded 'prev' and 'art', emit data with the indicator names (keys) from the metadata
                //and make the plotting components agnostic about art/prev/anything else
                const regionValues = result[areaId];
                switch (indicator) {
                    case("prevalence"):
                        regionValues.prev = {
                            value: value,
                            color: getColor(value, getters.choroplethRanges.prev, getters.colorFunctions.prev)
                        };
                        break;
                    case("art_coverage"):
                    case("current_art"):
                        regionValues.art = {
                            value: value,
                            color: getColor(value, getters.choroplethRanges.art, getters.colorFunctions.art)
                        };
                        break;
                }

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
                const ancIndicators = metadata.anc.choropleth!!.indicators!;
                return {
                    prev: {
                        min: ancIndicators.prevalence!!.min,
                        max: ancIndicators.prevalence!!.max,
                    },
                    art: {
                        min: ancIndicators.art_coverage!!.min,
                        max: ancIndicators.art_coverage!!.max
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
                const survIndicators = metadata.survey.choropleth!!.indicators!!;
                return {
                    prev: {
                        min: survIndicators.prevalence!!.min,
                        max: survIndicators.prevalence!!.max
                    },
                    art: {
                        min: survIndicators.art_coverage!!.min,
                        max: survIndicators.art_coverage!!.max
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
