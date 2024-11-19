<template>
    <hr />
    <h3 v-translate="'calibrateResultsHeader'"></h3>
    <p class="text-muted" v-translate="'calibrateResultsDesc'"></p>
    <div id="calibration-plot" class="row">
        <div class="mt-2 col-md-3">
            <span class="d-flex justify-content-between">
                <h4 v-translate="'filters'"/>
                <vue-feather type="refresh-cw"
                             class="filter-reset-icon"
                             size="20"
                             @click="resetFilters"></vue-feather>
            </span>
            <filter-set :plot="calibratePlotName"/>
        </div>
        <barchart class="col-md-9"
                  :plot="calibratePlotName"
                  :show-error-bars="false"/>
    </div>
</template>

<script setup lang="ts">
import Barchart from "../plots/bar/Barchart.vue";
import {calibratePlotName} from "../../store/plotSelections/plotSelections";
import FilterSet from "../plots/FilterSet.vue";
import { getDefaultFilterSelections, PlotSelectionActionUpdate } from "../../store/plotSelections/actions";
import { useStore } from "vuex";
import { RootState } from "../../root";
import { computed } from "vue";
import VueFeather from "vue-feather";

const store = useStore<RootState>();

const rootState = computed(() => store.state);

const controls = computed(() => store.state.plotSelections[calibratePlotName].controls);

const resetFilters = () => {
    const defaultFilterSelections = getDefaultFilterSelections(rootState.value, calibratePlotName, controls.value);
    store.dispatch("plotSelections/updateSelections", {
        payload: {
            plot: calibratePlotName,
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
}
</script>
