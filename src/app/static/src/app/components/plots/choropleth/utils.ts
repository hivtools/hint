import {IndicatorValuesDict, NumericRange} from "../../../types";
import {IndicatorMetadata} from "../../../generated";
import {getColour} from "../utils";

export const getFeatureData = function (data: any[],
                                        indicatorMeta: IndicatorMetadata,
                                        colourRange: NumericRange): IndicatorValuesDict {

    const result = {} as IndicatorValuesDict;
    for (const row of data) {
        const value = row[indicatorMeta.value_column]
        result[row.area_id] = {
            value: value,
            color: getColour(value, indicatorMeta, colourRange),
            lower_value: indicatorMeta.error_low_column && row[indicatorMeta.error_low_column],
            upper_value: indicatorMeta.error_high_column && row[indicatorMeta.error_high_column],
            missing_ids: row["missing_ids"]
        }
    }

    return result;
};
