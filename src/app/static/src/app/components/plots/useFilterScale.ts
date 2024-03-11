import {useStore} from "vuex";
import {RootState} from "../../root";
import {initialScaleSettings, ScaleSettings} from "../../store/plotState/plotState";
import {ChoroplethIndicatorMetadata} from "../../generated";
import {computed} from "vue";

export const useFilterScale = () => {
    const store = useStore<RootState>();
    const indicatorMetadata = computed(() => {
        return store.getters["modelCalibrate/indicatorMetadata"];
    });
    const selectedIndicator = computed(() => {
        return store.getters["plotSelections/selectedIndicator"];
    });
    const colourScales = computed(() => {
        return store.getters["plotState/colourScales"];
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

    const updateOutputColourScale = (newScaleSettings: ScaleSettings) => {
        store.commit({
            type: 'plotState/updateOutputColourScales',
            payload: {indicatorId: selectedIndicator.value, newScaleSettings}
        })
    };

    return {
        selectedScale,
        updateOutputColourScale,
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
