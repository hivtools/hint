import {NumericRange} from "../../types";
import {ChoroplethIndicatorMetadata} from "../../generated";
import * as d3ScaleChromatic from "d3-scale-chromatic";


export const getColour = (value: number,
                         metadata: ChoroplethIndicatorMetadata,
                         colourRange: NumericRange) => {

    const min = colourRange.min;
    const max = colourRange.max;

    const colourFunction = colourFunctionFromName(metadata.colour);

    const rangeNum = ((max !== null) && (max != min)) ? //Avoid dividing by zero if only one value...
        max - (min || 0) :
        1;

    let colorValue = (value - min) / rangeNum;
    if (colorValue > 1) {
        colorValue = 1;
    }
    if (colorValue < 0) {
        colorValue = 0;
    }

    if (metadata.invert_scale) {
        colorValue = 1 - colorValue;
    }

    return colourFunction(colorValue);
};


export const colourFunctionFromName = function (name: string) {
    let result = (d3ScaleChromatic as any)[name];
    if (!result) {
        //This is trying to be defensive against typos in metadata...
        console.warn(`Unknown color function: ${name}`);
        result = d3ScaleChromatic.interpolateWarm;
    }
    return result;
};
