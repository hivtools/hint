import {computed} from 'vue'
import {useStore} from "vuex";
import {RootState} from "../../root";
import {ScaleSettings, ScaleType} from "../../store/plotState/plotState";
import {
    colorFunctionFromName,
    formatLegend,
    getIndicatorRange,
    roundToContext,
    scaleStepFromMetadata
} from "./choropleth/utils";
import {ChoroplethIndicatorMetadata} from "../../generated";
import {initialScaleSettings} from "../../store/plotState/plotState";
import {PlotData} from "../../store/plotData/plotData";

export function useFilterScale() {
    const store = useStore<RootState>();
    const updateOutputColourScale = (newScaleSettings: ScaleSettings) => {
        store.commit({
            type: 'plotState/updateOutputColourScales',
            payload: {indicatorId: selectedIndicator.value, newScaleSettings}
        })
    }

    const colourScales = computed(() => {
        return store.state.plotState.output.colourScales
    });

    const selectedIndicator = computed(() => {
        const selected = store.state.plotSelections.choropleth.filters
            .find(f => f.stateFilterId === "indicator")!.selection[0].id;
        return selected
    });

    const selectedScale = computed(() => {
        const current = colourScales.value[selectedIndicator.value];
        if (current) {
            return current;
        } else {
            const newScaleSettings = initialiseScaleFromMetadata(indicatorMetadata.value);
            updateOutputColourScale(newScaleSettings);
            return newScaleSettings;
        }
    });

    const indicatorMetadata = computed<ChoroplethIndicatorMetadata>(() => {
        return store.state.modelCalibrate.metadata!.indicators.find(i => i.indicator == selectedIndicator.value)!
    });

    const data = computed<PlotData>(() => {
        return store.state.plotData.choropleth
    });

    const colourRange = computed(() => {
        if (!indicatorMetadata.value) {
            return {max: 1, min: 0}
        } else {
            console.log("Computing colourRange selected scale is ", selectedScale.value)
            const type = selectedScale.value && selectedScale.value.type;
            switch (type) {
                case ScaleType.DynamicFiltered:
                    return getIndicatorRange(data.value, indicatorMetadata.value);
                case ScaleType.Custom:
                    return {
                        min: selectedScale.value.customMin,
                        max: selectedScale.value.customMax
                    };
                case ScaleType.Default:
                default:
                    return {max: indicatorMetadata.value.max, min: indicatorMetadata.value.min}
            }
        }
    });

    const scaleLevels = computed(() => {
        if (indicatorMetadata.value) {
            const { format, scale, colour, invert_scale: invertScale } = indicatorMetadata.value;
            const { min, max } = colourRange.value;
            const colorFunction = colorFunctionFromName(colour);
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
                    val, style: {background: colorFunction(valAsProportion)}
                }
            });
        }
        return [];
    });

    const colourScaleStep = computed(() => {
        return scaleStepFromMetadata(indicatorMetadata.value)
    });

    return {
        colourScales,
        scaleLevels,
        selectedScale,
        updateOutputColourScale,
        indicatorMetadata,
        colourScaleStep
    }
}

const initialiseScaleFromMetadata = function (meta: ChoroplethIndicatorMetadata | undefined) {
    const result = initialScaleSettings();
    if (meta) {
        result.customMin = meta.min;
        result.customMax = meta.max;
    }
    return result;
};
