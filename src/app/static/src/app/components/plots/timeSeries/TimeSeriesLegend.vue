<template>
    <div class="plotly-subplot-legend row align-items-end mt-2">
        <div v-for="(group, index) in plotIndicators"
             :key="`indicator-legend-${index}`"
             class="col mr-4 ml-4">
            <div :class="group.length > 1 ? 'legend-grid' : 'd-flex flex-wrap justify-content-center'">
                <div v-for="plotType in group"
                     :key="plotType"
                     class="d-flex align-items-center"
                     @mouseenter="$emit('enter-plot-type', plotType)"
                     @mouseleave="$emit('leave-plot-type', plotType)">

                    <!-- Stole the legend stying here from plotly defaults -->
                    <svg width="40" height="10" xmlns="http://www.w3.org/2000/svg" style="overflow: visible;">
                        <path class="line"
                              d="M5,5h30"
                              fill="none"
                              :stroke="getColor(plotType)"
                              :stroke-dasharray="getLineStyle(plotType)"
                              stroke-opacity="1"
                              stroke-width="2px">
                        </path>
                        <path class="circle"
                              transform="translate(20,5)"
                              opacity="1"
                              :fill="getColor(plotType)"
                              fill-opacity="1"
                              :stroke="getColor(plotType)"
                              stroke-width="0.5px"
                              stroke-opacity="1"
                              d="M3,0A3,3 0 1,1 0,-3A3,3 0 0,1 3,0Z">
                        </path>
                    </svg>

                    <span class="small ml-1">{{timeSeriesPlotLabels.get(plotType) ?? plotType}}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {useStore} from "vuex";
import VueFeather from "vue-feather";
import { RootState } from '../../../root';
import {PlotColours, timeSeriesExpandedViews, timeSeriesFixedColours} from "./utils";

// We're creating a manual time series legend as at the time of writing plotly doesn't have
// great support for drawing a legend for multiple subplots and display the legend above/below
// individual subplots.

const props = defineProps({
    plotType: {
        type: String,
        required: true
    },
});

defineEmits<{
    (e: "enter-plot-type", plotType: string): void
    (e: "leave-plot-type", plotType: string): void
}>();

const store = useStore<RootState>();
const timeSeriesPlotLabels = store.getters["metadata/timeSeriesPlotTypeLabel"];

const plotIndicators = timeSeriesExpandedViews.get(props.plotType)?.plots;
const getColor = (plotType: string) => {
    return timeSeriesFixedColours.get(plotType)?.BASE ?? PlotColours.NORMAL.BASE;
}

const getLineStyle = (plotType: string) => {
    const style = timeSeriesFixedColours.get(plotType)?.DASH ?? "solid";
    switch (style) {
        case "solid": return "0";
        case "dash": return "6,2";
        case "dot": return "3,2";
        default: return "0";
    }
}

</script>
<style scoped>
.legend-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    column-gap: 1em;
}
</style>
