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
        <div class="row" v-else>
            <div class="mt-2 col-md-3">
                <plot-control-set :plot="activePlot"/>
                <h4 v-translate="'filters'"/>
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
                      :show-error-bars="false"/>
        </div>
    </div>
</template>

<script lang="ts">
import {computed, defineComponent, onBeforeMount, ref, watch} from 'vue';
import {useStore} from 'vuex';
import {RootState} from '../../root';
import PlotControlSet from '../plots/PlotControlSet.vue';
import FilterSet from '../plots/FilterSet.vue';
import {InputPlotName, inputPlotNames} from '../../store/plotSelections/plotSelections';
import TimeSeries from "../plots/timeSeries/TimeSeries.vue";
import Choropleth from '../plots/choropleth/Choropleth.vue';
import LoadingSpinner from "../LoadingSpinner.vue";
import ErrorAlert from "../ErrorAlert.vue";
import DownloadTimeSeries from "../plots/timeSeries/downloadTimeSeries/DownloadTimeSeries.vue";
import Barchart from "../plots/bar/Barchart.vue";

export default defineComponent({
    components: {
        Barchart,
        DownloadTimeSeries,
        ErrorAlert,
        PlotControlSet,
        FilterSet,
        TimeSeries,
        Choropleth,
        LoadingSpinner
    },
    setup() {
        const store = useStore<RootState>();
        const availablePlots = computed(() => {
            if (!store.state.surveyAndProgram.anc && !store.state.surveyAndProgram.program) {
                return inputPlotNames.filter(name => name != "timeSeries" && name != "inputComparisonBarchart")
            } else {
                return inputPlotNames
            }
        })
        const activePlot = ref<InputPlotName>(availablePlots.value[0]);
        const changePlot = (plot: InputPlotName) => {
            activePlot.value = plot;
        }
        const loading = computed(() => store.state.reviewInput.loading);

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
            await store.dispatch("reviewInput/getInputComparisonDataset", {}, { root: true });
        });

        return {
            availablePlots,
            activePlot,
            changePlot,
            loading,
            plotDescription,
            error
        }
    }
})
</script>
