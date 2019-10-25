import {IndicatorMetadata} from "../../../../app/generated";

export function testIndicatorMetadata(indicator: string,
                                      value_column: string,
                                      indicator_column: string,
                                      indicator_value: string,
                                      min: number = 0,
                                      max: number = 1): IndicatorMetadata {
    return {
        name: indicator,
        indicator: indicator,
        value_column: value_column,
        indicator_column: indicator_column,
        indicator_value: indicator_value,
        colour: "interpolateGreys",
        invert_scale: false,
        min,
        max
    };
}
