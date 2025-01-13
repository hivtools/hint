/* eslint-disable @typescript-eslint/no-explicit-any */
import {NumericRange} from "../../types";
import {CalibrateDataResponse, IndicatorMetadata, FilterOption} from "../../generated";
import * as d3ScaleChromatic from "d3-scale-chromatic";
import {ScaleSettings, ScaleType} from "../../store/plotState/plotState";
import {Feature} from "geojson";
import numeral from "numeral";
import {Store} from "vuex";
import {RootState} from "../../root";
import {getMetadataFromPlotName} from "../../store/plotSelections/actions";
import {PlotName} from "../../store/plotSelections/plotSelections";
import { StyleValue } from "vue";

export const getIndicatorMetadata = (store: Store<RootState>, plotName: PlotName, selectedIndicator: string): IndicatorMetadata => {
    const metadata = getMetadataFromPlotName(store.state, plotName);
    return metadata.indicators.find(i => i.indicator == selectedIndicator)!
}

export interface ScaleLevels {
    label: string
    style: StyleValue
}

export const getColourScaleLevels = (indicatorMetadata: IndicatorMetadata, colourRange: NumericRange): ScaleLevels[] => {
    const { format, scale, colour, invert_scale: invertScale } = indicatorMetadata;
    const { min, max } = colourRange;
    const colourFunction = colourFunctionFromName(colour);
    const step = (max - min) / 5;
    const indexes = max == min ? [0] : [5, 4, 3, 2, 1, 0];
    return indexes.map((i) => {
        let val: any = min + (i * step);
        val = roundToContext(val, [min, max]);
        let valAsProportion = (max != min) ? (val - min) / (max - min) : 0;
        if (invertScale) {
            valAsProportion = 1 - valAsProportion;
        }
        val = formatLegend(val, format, scale)
        return {
            label: val,
            style: {background: colourFunction(valAsProportion)}
        }
    });
};

export const getColour = (value: number,
                         metadata: IndicatorMetadata,
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

export const getVisibleFeatures = function(features: Feature[], selectedLevels: FilterOption[]) {
    const levels = selectedLevels.map((l: FilterOption) => parseInt(l.id));
    return features.filter((feature: Feature) => {
        return feature.properties && levels.includes(feature.properties["area_level"]);
    });
};

export const roundToContext = function (value: number, context: number[]) {
    //Rounds the value to one more decimal place than is present in the 'context'
    let maxDecPl = 0;
    for (const contextValue of context) {
        const maxFraction = contextValue.toString().split(".");
        const decPl = maxFraction.length > 1 ? maxFraction[1].length : 0;
        maxDecPl = Math.max(maxDecPl, decPl + 1);
    }

    return roundToPlaces(value, maxDecPl);
};

const roundToPlaces = function (value: number, decPl: number) {
    const roundingNum = Math.pow(10, decPl);
    return Math.round(value * roundingNum) / roundingNum;
};

export const formatLegend = function (text: string | number, format: string, scale: number): string {
    text = formatOutput(text, format, scale, null)

    if (typeof (text) === "string" && text.includes(',')) {
        text = text.replace(/,/g, '');
    }
    if (typeof (text) === "string" && !text.includes('%')) {
        text = parseFloat(text)
    }
    if (typeof text == "number") {
        if (text >= 1000 && text < 10000 || text >= 1000000 && text < 10000000) {
            text = numeral(text).format("0.0a")
        } else if (text >= 1000) {
            text = numeral(text).format("0a")
        } else text = text.toString()
    }
    return text
}

export const formatOutput = function (value: number | string, format: string, scale: number | null, accuracy: number | null, roundValue = true, absoluteValue = false) {
    let ans: number

    if (typeof (value) === 'string') {
        ans = parseFloat(value)
    } else ans = value

    if (absoluteValue) {
        ans = Math.abs(ans)
    }

    if (!format.includes('%') && scale) {
        ans = ans * scale
    }

    if (!format.includes('%') && accuracy && roundValue) {
        /**
         * When accuracy is set to 100 and selected value is less than 200
         * barchart disarranges YAxis. Code below checks if value is greater
         * than 500 before apply 100 scale range. Otherwise, chartJS will
         * automatically use numeric algorithm to calculate scale range.
         * However, if accuracy is less than 100, we simply apply scale range
         * rounding using the given accuracy value.
         */

        if (accuracy > 1) {
            if (ans > 5 * accuracy) {
                ans = Math.round(ans / accuracy) * accuracy
            }
        } else {
            ans = Math.round(ans / accuracy) * accuracy
        }
    }

    if (format) {
        return numeral(ans).format(format)
    } else return ans
};

const getPlotDataForIndicator = (indicatorMetadata: IndicatorMetadata, plotData: CalibrateDataResponse["data"]) => {
    // if plotData doesn't have indicator key then we don't filter by it
    if (!plotData?.at(0)?.hasOwnProperty("indicator")) return plotData;
    return plotData.filter((row) => row.indicator == indicatorMetadata.indicator);
}

export const getIndicatorRange = (indicatorMetadata: IndicatorMetadata, scaleSettings: ScaleSettings, plotData: CalibrateDataResponse["data"]): NumericRange => {
    const indicatorData = getPlotDataForIndicator(indicatorMetadata, plotData);
    switch (scaleSettings.type) {
        case ScaleType.DynamicFiltered:
            return getDynamicRange(indicatorData, indicatorMetadata);
        case ScaleType.Custom:
            return {
                min: scaleSettings.customMin,
                max: scaleSettings.customMax
            };
        case ScaleType.Default:
        default:
            return {max: indicatorMetadata.max, min: indicatorMetadata.min}
    }
}

const getDynamicRange = function (data: CalibrateDataResponse["data"],
                                  indicatorMeta: IndicatorMetadata): NumericRange {
    let result = {} as NumericRange;
    for (const row of data) {
        const value = row[indicatorMeta.value_column]
        if (!result.max) {
            result = {min: value, max: value};
        } else {
            result.min = Math.min(result.min, value);
            result.max = Math.max(result.max, value);
        }
    }
    return roundRange({
        min: result ? result.min : 0,
        max: result ? result.max : 0
    });
};

export const roundRange = function (unrounded: NumericRange) {
    //round appropriate to the range magnitude
    let decPl = 0;
    let magnitude = unrounded.max == unrounded.min ? unrounded.min : (unrounded.max - unrounded.min);

    magnitude = magnitude / 100;
    if (magnitude < 1 && magnitude > 0) {
        decPl = Math.trunc(Math.abs(Math.log10(magnitude)));
    }

    return {min: roundToPlaces(unrounded.min, decPl), max: roundToPlaces(unrounded.max, decPl)};
};

/* c8 ignore start */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export const debounce = (fn: Function, ms = 300) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function (this: any, ...args: any[]) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), ms);
    };
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export const debounce_leading = (fn: Function, ms = 300) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    return function (this: any, ...args: any[]) {
        if (!timeoutId) {
            fn.apply(this, args);
        }
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => timeoutId = undefined, ms);
    };
};
/* c8 ignore stop */
