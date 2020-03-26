import {BubbleIndicatorValuesDict, Dict, Filter, NumericRange} from "../../../types";
import {getColor, iterateDataValues} from "../utils";
import {ChoroplethIndicatorMetadata, FilterOption} from "../../../generated";

export const getRadius = function(value: number, minValue: number, maxValue: number, minRadius: number, maxRadius: number){
    //where is value on a scale of 0-1 between minValue and maxValue
    const scalePoint = (value - minValue) / (maxValue - minValue);

    return Math.sqrt(Math.pow(minRadius, 2) + (scalePoint * (Math.pow(maxRadius, 2) - Math.pow(minRadius, 2))));
};

export const getFeatureIndicators = function (data: any[],
                                              selectedAreaIds: string[],
                                              indicatorsMeta: ChoroplethIndicatorMetadata[],
                                              indicatorRanges: Dict<NumericRange>,
                                              filters: Filter[],
                                              selectedFilterValues: Dict<FilterOption[]>,
                                              selectedIndicatorIds: string[],
                                              minRadius: number,
                                              maxRadius: number): Dict<BubbleIndicatorValuesDict> {

    const result = {} as Dict<BubbleIndicatorValuesDict>;
    iterateDataValues(data, indicatorsMeta, selectedAreaIds, filters, selectedFilterValues,
        (areaId: string, indicatorMeta: ChoroplethIndicatorMetadata, value: number) => {
            if (!result[areaId]) {
                result[areaId] = {} as BubbleIndicatorValuesDict;
            }

            const indicator = indicatorMeta.indicator;
            const indicatorRange = indicatorRanges[indicator];

            if (selectedIndicatorIds.includes(indicator)) {
                const regionValues = result[areaId];
                regionValues[indicator] = {
                    value: value,
                    color: getColor(value, indicatorMeta, {min: indicatorMeta.min, max: indicatorMeta.max}),
                    radius: getRadius(value, indicatorRange.min, indicatorRange.max, minRadius, maxRadius)
                }
            }
        });

    return result;
};

