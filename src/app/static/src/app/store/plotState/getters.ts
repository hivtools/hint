import {PlotState, ScaleSettings, ScaleSelections, ScaleType} from "./plotState";
import {formatLegend, getIndicatorRange, roundToContext} from "../../components/plots/choropleth/utils";
import {colourFunctionFromName} from "../../components/plots/utils";
import {RootState} from "../../root";

export const getters = {
    colourScales: (state: PlotState): ScaleSelections => {
        return state.output.colourScales
    },
    colourRange: (state: PlotState, getters: any, rootState: RootState, rootGetters: any) => (scaleSettings: ScaleSettings) => {
        console.log("getting colour range")
        const indicatorMetadata = rootGetters["modelCalibrate/indicatorMetadata"];
        if (!indicatorMetadata) {
            return {max: 1, min: 0}
        } else {
            console.log("Computing colourRange selected scale is ", scaleSettings)
            switch (scaleSettings.type) {
                case ScaleType.DynamicFiltered:
                    return getIndicatorRange(rootState.plotData.choropleth, indicatorMetadata);
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
    },
    scaleLevels: (state: PlotState, getters: any, rootState: RootState, rootGetters: any) => (scaleSettings: ScaleSettings) => {
        const indicatorMetadata = rootGetters["modelCalibrate/indicatorMetadata"];
        const colourRange = getters["colourRange"](scaleSettings);
        console.log("colour range is", colourRange);
        console.log("indicatorMEtadata is", indicatorMetadata);
        if (indicatorMetadata) {
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
                    val, style: {background: colourFunction(valAsProportion)}
                }
            });
        }
        return [];
    }
};
