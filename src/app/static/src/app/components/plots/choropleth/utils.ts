import {ChoroplethIndicatorMetadata, FilterOption} from "../../../generated";
import {IndicatorValuesDict, Dict, Filter, NumericRange} from "../../../types";
import {getColor, iterateDataValues} from "../utils";
import {ColourScaleSettings, initialColourScaleSettings} from "../../../store/colourScales/colourScales";

export const getFeatureIndicators = function (data: any[],
                                              selectedAreaIds: string[],
                                              indicatorsMeta: ChoroplethIndicatorMetadata[],
                                              colourRanges: Dict<NumericRange>,
                                              filters: Filter[],
                                              selectedFilterValues: Dict<FilterOption[]>,
                                              selectedIndicatorIds: string[]) : Dict<IndicatorValuesDict> {

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
                    color: getColor(value, indicatorMeta, colourRanges[indicatorId])
                }
            }
        });

    return result;
};

export const initialiseColourScaleFromMetadata = function(meta: ChoroplethIndicatorMetadata) {
    const result = initialColourScaleSettings();
    if (meta) {
        result.customMin = meta.min;
        result.customMax = meta.max;
    }
    return result;
};