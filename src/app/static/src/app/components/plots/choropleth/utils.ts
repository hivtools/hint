import {IndicatorValuesDict, NumericRange} from "../../../types";
import {ChoroplethIndicatorMetadata} from "../../../generated";
import {getColour} from "../utils";
import {initialScaleSettings} from "../../../store/plotState/plotState";

export const getFeatureData = function (data: any[],
                                        indicatorMeta: ChoroplethIndicatorMetadata,
                                        colourRange: NumericRange): IndicatorValuesDict {

    const result = {} as IndicatorValuesDict;
    for (const row of data) {
        const value = row[indicatorMeta.value_column]
        result[row.area_id] = {
            value: value,
            color: getColour(value, indicatorMeta, colourRange),
            lower_value: row['lower'],
            upper_value: row['upper']
        }
    }

    return result;
};

export const initialiseScaleFromMetadata = function (meta: ChoroplethIndicatorMetadata | undefined) {
    const result = initialScaleSettings();
    if (meta) {
        result.customMin = meta.min;
        result.customMax = meta.max;
    }
    return result;
};
