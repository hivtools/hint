<template>
    <div>
        <ul class="nav nav-tabs">
            <li v-for="plotName of outputPlotNames" :key="plotName">
                <a class="nav-link"
                   :class="selectedPlot === plotName ? 'active': ''"
                   v-translate="plotName"
                   @click="switchTab(plotName)"></a>
            </li>
        </ul>
        <div id="review-output" class="row" v-if="outputMetadataFetched">
            <div class="mt-2 col-md-3">
                <plot-control-set :plot="selectedPlot"/>
                <filter-with-reset @reset="resetFilters" :icon-type="'refresh-cw'">
                    <h4 v-translate="'filters'"/>
                </filter-with-reset>
                <filter-set :plot="selectedPlot"/>
            </div>
            <choropleth class="col-md-9" v-if="selectedPlot === 'choropleth'" :plot="'choropleth'"/>
            <bubble class="col-md-9" v-if="selectedPlot === 'bubble'"/>
            <barchart class="col-md-9" v-if="selectedPlot === 'barchart'"
                      :plot="selectedPlot"
                      :show-error-bars="true"/>
            <barchart class="col-md-9" v-if="selectedPlot === 'comparison'"
                      :plot="selectedPlot"
                      :show-error-bars="true"/>
            <Table class="col-md-9" v-if="selectedPlot === 'table'"
                    :plotName="'table'"
                    :download-enabled="true"/>
        </div>
    </div>
</template>

<script lang="ts">
import {computed, defineComponent} from "vue";
import FilterSet from "../plots/FilterSet.vue";
import PlotControlSet from "../plots/PlotControlSet.vue";
import {OutputPlotName, outputPlotNames} from "../../store/plotSelections/plotSelections";
import {useStore} from "vuex";
import {RootState} from "../../root";
import { ModelOutputMutation } from "../../store/modelOutput/mutations";
import Choropleth from "../plots/choropleth/Choropleth.vue";
import Bubble from "../plots/bubble/Bubble.vue";
import Barchart from "../plots/bar/Barchart.vue";
import Table from "../plots/table/Table.vue";
import { getDefaultFilterSelections, PlotSelectionActionUpdate } from "../../store/plotSelections/actions";
import FilterWithReset from "../plots/FilterWithReset.vue";

export default defineComponent({
    setup() {
        const store = useStore<RootState>();
        const selectedPlot = computed(() => store.state.modelOutput.selectedTab);
        const switchTab = (plotName: OutputPlotName) => store.commit(`modelOutput/${ModelOutputMutation.TabSelected}`, {payload: plotName});
        const outputMetadataFetched = computed(() => store.state.modelCalibrate.metadata)
        const rootState = computed(() => store.state);
        const controls = computed(() => store.state.plotSelections[selectedPlot.value].controls);
        const resetFilters = () => {
            const defaultFilterSelections = getDefaultFilterSelections(rootState.value, selectedPlot.value, controls.value);
            store.dispatch("plotSelections/updateSelections", {
                payload: {
                    plot: selectedPlot.value,
                    selection: {
                        filters: defaultFilterSelections.map(f => {
                            return {
                                id: f.stateFilterId,
                                options: f.selection
                            };
                        })
                    }
                } as PlotSelectionActionUpdate
            }, { root: true });
        };

        return {
            outputPlotNames,
            selectedPlot,
            switchTab,
            outputMetadataFetched,
            resetFilters
        }
    },

    components: {
        Barchart,
        Choropleth,
        Bubble,
        Table,
        FilterSet,
        PlotControlSet,
        FilterWithReset
    }
})
</script>
