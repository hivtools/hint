import {ChoroplethIndicatorMetadata, FilterOption} from "../../../generated";
import {Dict, Filter, IndicatorValuesDict, NumericRange} from "../../../types";
import {getColor, iterateDataValues} from "../utils";
import {initialScaleSettings} from "../../../store/plottingSelections/plottingSelections";

export const getFeatureIndicator = function (data: any[],
                                             selectedAreaIds: string[],
                                             indicatorMeta: ChoroplethIndicatorMetadata,
                                             colourRange: NumericRange,
                                             filters: Filter[],
                                             selectedFilterValues: Dict<FilterOption[]>): IndicatorValuesDict {

    const result = {} as IndicatorValuesDict;
    iterateDataValues(data, [indicatorMeta], selectedAreaIds, filters, selectedFilterValues,
        (areaId: string, indicatorMeta: ChoroplethIndicatorMetadata, value: number, values: any) => {
            result[areaId] = {
                value: value,
                color: getColor(value, indicatorMeta, colourRange),
                lower_value: values['lower'],
                upper_value: values['upper']
            }
        });

    return result;
};

export const initialiseScaleFromMetadata = function (meta: ChoroplethIndicatorMetadata) {
    const result = initialScaleSettings();
    if (meta) {
        result.customMin = meta.min;
        result.customMax = meta.max;
    }
    return result;
};
