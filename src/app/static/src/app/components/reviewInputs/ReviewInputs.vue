<template>
    <div>
        <ul class="nav nav-tabs">
            <li v-for="plotName of inputPlotNames" :key="plotName">
                <a class="nav-link"
                   :class="activePlot === plotName ? 'active': ''"
                   v-translate="plotName === 'inputChoropleth' ? 'choropleth' : plotName"
                   @click="changePlot(plotName)"></a>
            </li>
        </ul>
        <!-- <div class="d-flex align-items-center justify-content-center" v-if="loading">
            <loading-spinner size="lg"/>
        </div> -->
        <div class="row" v-if="!loading">
            <div class="mt-2 col-md-3">
                <plot-control-set :plot="activePlot"/>
                <h4 v-translate="'filters'"/>
                <filter-set :plot="activePlot"/>
            </div>
            <time-series v-if="activePlot === 'timeSeries' && isTimeSeries" class="col-md-9"/>
            <choropleth class="col-md-9" v-if="activePlot === 'inputChoropleth'" :plot="'inputChoropleth'"/>
        </div>
    </div>
</template>

<script lang="ts">
import {computed, defineComponent, onBeforeMount, ref} from 'vue';
import {useStore} from 'vuex';
import {RootState} from '../../root';
import PlotControlSet from '../plots/PlotControlSet.vue';
import FilterSet from '../plots/FilterSet.vue';
import {InputPlotName, inputPlotNames} from '../../store/plotSelections/plotSelections';
import TimeSeries from "../plots/timeSeries/TimeSeries.vue";
import Choropleth from '../plots/choropleth/Choropleth.vue';
import LoadingSpinner from "../LoadingSpinner.vue";

export default defineComponent({
    components: {
        PlotControlSet,
        FilterSet,
        TimeSeries,
        Choropleth,
        LoadingSpinner
    },
    setup() {
        const store = useStore<RootState>();
        const activePlot = ref<InputPlotName>(inputPlotNames[0]);
        const changePlot = (plot: InputPlotName) => {
            activePlot.value = plot;
        }
        const isTimeSeries = computed(() => !!store.state.surveyAndProgram.anc || !!store.state.surveyAndProgram.program)
        const loading = computed(() => store.state.genericChart.loading);

        onBeforeMount(async () => {
            await store.dispatch("metadata/getReviewInputMetadata", {}, { root: true });
        });

        return {
            inputPlotNames,
            activePlot,
            changePlot,
            isTimeSeries,
            loading
        }
    }
})
</script>
