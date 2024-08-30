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
        <div class="d-flex align-items-center justify-content-center" v-if="loading">
            <loading-spinner size="lg"/>
        </div>
        <error-alert v-else-if="!!error" :error="error!"></error-alert>
        <div class="row" v-else>
            <div class="mt-2 col-md-3">
                <plot-control-set :plot="activePlot"/>
                <h4 v-translate="'filters'"/>
                <filter-set :plot="activePlot"/>
                <div id="plot-description"
                     v-if="plotDescription"
                     v-translate="plotDescription"
                     class="text-muted mt-v"/>
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
import ErrorAlert from "../ErrorAlert.vue";

export default defineComponent({
    components: {
        ErrorAlert,
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

        const plotDescription = computed(() => {
            if (activePlot.value === "timeSeries") {
                return "inputTimeSeriesDescription"
            } else {
                return null
            }
        });

        const error = computed(() => {
            return store.state.metadata.reviewInputMetadataError
        });

        onBeforeMount(async () => {
            await store.dispatch("metadata/getReviewInputMetadata", {}, { root: true });
        });

        return {
            inputPlotNames,
            activePlot,
            changePlot,
            isTimeSeries,
            loading,
            plotDescription,
            error
        }
    }
})
</script>
