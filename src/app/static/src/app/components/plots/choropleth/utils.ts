import {ChoroplethIndicatorMetadata, FilterOption} from "../../../generated";
import {IndicatorValuesDict, Dict, Filter, NumericRange} from "../../../types";
import {getColor, iterateDataValues} from "../utils";

export const getFeatureIndicators = function (data: any[],
                                              selectedAreaIds: string[],
                                              indicatorsMeta: ChoroplethIndicatorMetadata[],
                                              indicatorRanges: Dict<NumericRange>,
                                              filters: Filter[],
                                              selectedFilterValues: Dict<FilterOption[]>,
                                              selectedIndicatorIds: string[]): Dict<IndicatorValuesDict> {

    const result = {} as Dict<IndicatorValuesDict>;
    iterateDataValues(data, indicatorsMeta, selectedAreaIds, filters, selectedFilterValues,
        (areaId: string, indicatorMeta: ChoroplethIndicatorMetadata, value: number) => {
            if (!result[areaId]) {
                result[areaId] = {} as IndicatorValuesDict;
            }

            const indicator = indicatorMeta.indicator;

            if (selectedIndicatorIds.includes(indicator)) {
                const regionValues = result[areaId];
                regionValues[indicator] = {
                    value: value,
                    color: getColor(value, indicatorMeta)
                }
            }
        });

    return result;
};