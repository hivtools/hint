<template>
    <div id="review-inputs">
        <ul class="nav nav-tabs">
            <li v-for="plotName of availablePlots" :key="plotName">
                <a class="nav-link"
                   :class="activePlot === plotName ? 'active': ''"
                   v-translate="plotName === 'inputChoropleth' ? 'choropleth' : plotName"
                   @click="changePlot(plotName)"></a>
            </li>
        </ul>
        <div id="review-loading" class="d-flex align-items-center justify-content-center" v-if="loading">
            <loading-spinner size="lg"/>
        </div>
        <error-alert v-else-if="!!error" :error="error!"></error-alert>
        <error-alert v-else-if="!!inputComparisonError" :error="inputComparisonError!"></error-alert>
        <div class="row" v-else>
            <div class="mt-2 col-md-3">
                <plot-control-set :plot="activePlot"/>
                <filter-with-reset :plot="activePlot"></filter-with-reset>
                <filter-set :plot="activePlot"/>
                <div id="plot-description"
                     v-if="plotDescription"
                     v-translate="plotDescription"
                     class="text-muted mt-v"/>
                <download-time-series v-if="activePlot === 'timeSeries'"/>
            </div>
            <time-series v-if="activePlot === 'timeSeries'" class="col-md-9"/>
            <choropleth class="col-md-9" v-if="activePlot === 'inputChoropleth'" :plot="'inputChoropleth'"/>
            <barchart class="col-md-9" v-if="activePlot === 'inputComparisonBarchart'"
                      :plot="'inputComparisonBarchart'"
                      :show-error-bars="false"
                      style="min-height: 500px;"/>
            <Table class="col-md-9" v-if="activePlot === 'inputComparisonTable'"
                    :plotName="'inputComparisonTable'"
                    :download-enabled="false"/>
            <population-grid class="col-md-9" v-if="activePlot === 'population'"/>
        </div>
    </div>
</template>

<script lang="ts">
import {computed, defineComponent, onBeforeMount, ref} from 'vue';
import {useStore} from 'vuex';
import {RootState} from '../../root';
import PlotControlSet from '../plots/PlotControlSet.vue';
import FilterSet from '../plots/FilterSet.vue';
import {InputPlotName, inputPlotNames, PlotName} from '../../store/plotSelections/plotSelections';
import TimeSeries from "../plots/timeSeries/TimeSeries.vue";
import Choropleth from '../plots/choropleth/Choropleth.vue';
import LoadingSpinner from "../LoadingSpinner.vue";
import ErrorAlert from "../ErrorAlert.vue";
import DownloadTimeSeries from "../plots/timeSeries/downloadTimeSeries/DownloadTimeSeries.vue";
import Barchart from "../plots/bar/Barchart.vue";
import Table from "../plots/table/Table.vue";
import PopulationGrid from '../plots/population/PopulationGrid.vue';
import FilterWithReset from '../plots/FilterWithReset.vue';

export default defineComponent({
    components: {
        Barchart,
        DownloadTimeSeries,
        ErrorAlert,
        PlotControlSet,
        FilterSet,
        Table,
        TimeSeries,
        Choropleth,
        LoadingSpinner,
        FilterWithReset,
        PopulationGrid
    },
    setup() {
        const store = useStore<RootState>();
        const inputComparisonPlots: PlotName[] = ["inputComparisonBarchart", "inputComparisonTable"];
        const availablePlots = computed(() => {
            if (!store.state.surveyAndProgram.anc && !store.state.surveyAndProgram.program) {
                return inputPlotNames.filter(name => name != "timeSeries" && !inputComparisonPlots.includes(name))
            } else {
                return inputPlotNames
            }
        })
        const activePlot = ref<InputPlotName>(availablePlots.value[0]);

        const changePlot = async (plot: InputPlotName) => {
            activePlot.value = plot;
            if (inputComparisonPlots.includes(activePlot.value) && !store.state.reviewInput.inputComparison.data) {
                await store.dispatch("reviewInput/getInputComparisonDataset", {}, {root: true});
            }
        }
        const loading = computed(() => store.state.reviewInput.loading ||
            store.state.reviewInput.inputComparison.loading);

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

        const inputComparisonError = computed(() => {
            return store.state.reviewInput.inputComparison.error
        });

        onBeforeMount(async () => {
            await store.dispatch("metadata/getReviewInputMetadata", {}, { root: true });
            await store.dispatch('reviewInput/getPopulationDataset', {}, { root: true })
        });

        return {
            availablePlots,
            activePlot,
            changePlot,
            loading,
            plotDescription,
            error,
            inputComparisonError
        }
    }
})
</script>
