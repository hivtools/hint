import {useStore} from "vuex";
import {RootState} from "../../root";
import {ScaleSettings} from "../../store/plotState/plotState";
import {getIndicatorMetadata, scaleStepFromMetadata} from "./utils";
import {computed} from "vue";
import {PlotStateMutations} from "../../store/plotState/mutations";

export const useUpdateScale = () => {
    const store = useStore<RootState>();

    const getScaleStep = (name: string) => {
        if (name === "colour") {
            return colourScaleStep.value;
        } else if (name === "size") {
            return sizeScaleStep.value;
        } else {
            throw new RangeError(`Scale type must be one of 'name' or 'colour', got ${name}`)
        }
    };

    const colourScaleStep = computed(() => {
        const activePlot = store.state.modelOutput.selectedTab;
        let indicator
        if (activePlot === "choropleth") {
            indicator = getIndicatorMetadata(store, choroplethColourIndicator.value)
        } else {
            indicator = getIndicatorMetadata(store, bubbleColourIndicator.value)
        }
        return scaleStepFromMetadata(indicator)
    });

    const sizeScaleStep = computed(() => {
        return scaleStepFromMetadata(getIndicatorMetadata(store, bubbleSizeIndicator.value))
    });

    const choroplethColourIndicator = computed(() => {
        return store.state.plotSelections.choropleth.filters.find(f => f.stateFilterId === "indicator")!.selection[0].id;
    });

    const bubbleColourIndicator = computed(() => {
        return store.state.plotSelections.bubble.filters.find(f => f.stateFilterId === "colourIndicator")!.selection[0].id;
    });

    const bubbleSizeIndicator = computed(() => {
        return store.state.plotSelections.bubble.filters.find(f => f.stateFilterId === "sizeIndicator")!.selection[0].id;
    });

    const updateOutputScale = (name: string, newScaleSettings: ScaleSettings) => {
        if (name === "colour") {
            updateOutputColourScale(newScaleSettings);
        } else if (name === "size") {
            updateOutputSizeScale(newScaleSettings);
        }
    };

    const updateOutputColourScale = (newScaleSettings: ScaleSettings) => {
        const activePlot = store.state.modelOutput.selectedTab;
        let indicatorId;
        if (activePlot === "choropleth") {
            indicatorId = choroplethColourIndicator.value;
        } else {
            indicatorId = bubbleColourIndicator.value;
        }
        store.commit({
            type: `plotState/${PlotStateMutations.updateOutputColourScales}`,
            payload: {indicatorId: indicatorId, newScaleSettings}
        });
    };

    const updateOutputSizeScale = (newScaleSettings: ScaleSettings) => {
        store.commit({
            type: 'plotState/updateOutputSizeScales',
            payload: {indicatorId: bubbleSizeIndicator.value, newScaleSettings}
        });
    };

    return {
        getScaleStep,
        updateOutputScale,
        updateOutputColourScale,
        updateOutputSizeScale
    }
};
