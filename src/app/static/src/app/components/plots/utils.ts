import * as d3ScaleChromatic from "d3-scale-chromatic";
import {ChoroplethIndicatorMetadata} from "../../generated";

export const getColor = (value: number, metadata: ChoroplethIndicatorMetadata,
                         customMin: number | null = null, customMax: number | null = null) => {

    const min = customMin === null ? metadata.min : customMin;
    const max = customMax === null ? metadata.max : customMax;

    const colorFunction = colorFunctionFromName(metadata.colour);

    let rangeNum = (max && (max != min)) ? //Avoid dividing by zero if only one value...
        max - (min || 0) :
        1;

    let colorValue = (value - min) / rangeNum;

    if (metadata.invert_scale) {
        colorValue = 1 - colorValue;
    }

    return colorFunction(colorValue);
};

export const colorFunctionFromName = function (name: string) {
    let result = (d3ScaleChromatic as any)[name];
    if (!result) {
        //This is trying to be defensive against typos in metadata...
        console.warn(`Unknown color function: ${name}`);
        result = d3ScaleChromatic.interpolateWarm;
    }
    return result;
};
