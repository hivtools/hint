    <template>
        <div class="plotly-subplot-legend row align-items-end mt-2">
            <div v-for="(group, index) in plotIndicators"
                  :key="`indicator-legend-${index}`"
                  class="col d-flex flex-column align-items-center mr-2 ml-2">
                <div class="d-flex flex-wrap justify-content-center">
                    <div v-for="plotType in group"
                         :key="plotType"
                         class="d-flex align-items-center mr-2">
                        <vue-feather type="square" :fill="getColor(plotType)" :stroke="getColor(plotType)" size="19" class="mr-1"/>
                        <span class="small">{{timeSeriesPlotLabels.get(plotType) ?? plotType}}</span>
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

const store = useStore<RootState>();
const timeSeriesPlotLabels = store.getters["metadata/timeSeriesPlotTypeLabel"];

const plotIndicators = timeSeriesExpandedViews.get(props.plotType)?.plots;
const getColor = (plotType: string) => {
    const colors = timeSeriesFixedColours.get(plotType) ?? PlotColours.NORMAL;
    return colors.BASE
}

</script>
