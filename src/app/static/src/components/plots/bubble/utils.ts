import {BubbleIndicatorValues, BubbleIndicatorValuesDict, Dict, Filter, NumericRange} from "../../../types";
import {getColor, iterateDataValues} from "../utils";
import {ChoroplethIndicatorMetadata, FilterOption} from "../../../generated";

export const getRadius = function (value: number, minValue: number, maxValue: number, minRadius: number, maxRadius: number) {
    //if range is a single value, just return max radius as no interpolation possible
    if (minValue == maxValue) {
        return maxRadius;
    }

    //Clip value to range so do not exceed max or min bubble sizes
    value = Math.min(value, maxValue);
    value = Math.max(value, minValue);

    //where is value on a scale of 0-1 between minValue and maxValue
    const scalePoint = (value - minValue) / (maxValue - minValue);

    return Math.sqrt(Math.pow(minRadius, 2) + (scalePoint * (Math.pow(maxRadius, 2) - Math.pow(minRadius, 2))));
};

export const getFeatureIndicators = function (data: any[],
                                              selectedAreaIds: string[],
                                              sizeIndicator: ChoroplethIndicatorMetadata,
                                              colorIndicator: ChoroplethIndicatorMetadata,
                                              sizeRange: NumericRange,
                                              colourRange: NumericRange,
                                              filters: Filter[],
                                              selectedFilterValues: Dict<FilterOption[]>,
                                              minRadius: number,
                                              maxRadius: number): BubbleIndicatorValuesDict {

    const result = {} as BubbleIndicatorValuesDict;
    iterateDataValues(data, [sizeIndicator, colorIndicator], selectedAreaIds, filters, selectedFilterValues,
        (areaId: string, indicatorMeta: ChoroplethIndicatorMetadata, value: number, values: any) => {
            if (!result[areaId]) {
                result[areaId] = {} as BubbleIndicatorValues
            }
            if (indicatorMeta.indicator == colorIndicator.indicator) {
                result[areaId].value = value
                result[areaId].color = getColor(value, indicatorMeta, colourRange)
                if(values['lower'] != null)
                    result[areaId].lower_value = values['lower']

                if(values['upper'] != null)
                    result[areaId].upper_value = values['upper']

            }
            if (indicatorMeta.indicator == sizeIndicator.indicator) {
                result[areaId].sizeValue = value;
                result[areaId].radius = getRadius(value, sizeRange.min, sizeRange.max, minRadius, maxRadius)
                if(values['lower'] != null)
                    result[areaId].sizeLower = values['lower']

                if(values['upper'] != null)
                    result[areaId].sizeUpper = values['upper']
            }
        });

    return result;
};

