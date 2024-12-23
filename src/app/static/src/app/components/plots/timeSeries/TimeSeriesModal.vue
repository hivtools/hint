<template>
    <modal :open="openModal" @close-modal="() => $emit('close-modal')">
        <template v-slot:header>
            <h4>{{areaName}} ({{areaId}})</h4>
        </template>

        <div class="flex-column" style="max-height: 80vh">

            <time-series-legend
                v-if="chartData.length > 0"
                :plot-type="plotType"
                @enter-plot-type="highlightTrace"
                @leave-plot-type="resetTrace"/>

            <plotly class="chart"
                    ref="chart"
                    v-if="chartData.length > 0"
                    :chart-data="chartData"
                    :layout="layout"
                    :page-number="0"
                    @open-context="() => {}"/>

            <equation class="equation text-center pb-3"
                    :formula="formula"
                    @enter-plot-type="highlightTrace"
                    @leave-plot-type="resetTrace"/>
        </div>
    </modal>
</template>

<script setup lang="ts">
import Modal from "../../Modal.vue";
import Plotly from "./Plotly.vue";
import {InputTimeSeriesData} from '../../../generated';
import {computed, ref} from "vue";
import {useStore} from "vuex";
import { RootState } from '../../../root';
import {filterTimeSeriesData} from "../../../store/plotData/filter";
import {FilterSelection} from "../../../store/plotSelections/plotSelections";
import {expressionToString, Layout, numeralJsToD3format, timeSeriesExpandedViews} from "./utils";
import Equation from "../../common/Equation.vue";
import TimeSeriesLegend from "./TimeSeriesLegend.vue";
import {ReviewInputDataColumnValue} from "../../../types";

const props = defineProps({
    openModal: {
        type: Boolean,
        required: true
    },
    areaId: {
        type: String,
        required: true
    },
    plotType: {
        type: String,
        required: true
    }
});

defineEmits(["close-modal"]);

const chart = ref<typeof Plotly | null>(null);

const store = useStore<RootState>();

const areaIdToPropertiesMap = store.getters["baseline/areaIdToPropertiesMap"];
const areaName = computed<string>(() => {return props.areaId ? areaIdToPropertiesMap[props.areaId].area_name : ""});

const chartData = computed<InputTimeSeriesData>(() => {
    const selections = store.state.plotSelections.timeSeries;
    if (!props.plotType || !props.areaId) {
        return [];
    }
    const indicatorsForPlotType = timeSeriesExpandedViews.get(props.plotType)?.plots
    if (!indicatorsForPlotType) {
        return []
    }
    const indicatorsToKeep = ([] as string[]).concat(...indicatorsForPlotType)

    const modalSelections = {...selections}
    modalSelections.filters = [
        ...modalSelections.filters.filter((f: FilterSelection) => f.filterId !== "time_series_anc_plot_type")
    ]

    const dataSource = selections.controls.find(c => c.id === "time_series_data_source")?.selection[0].id;
    if (!dataSource) {
        return [];
    }
    const { data } = store.state.reviewInput.datasets[dataSource];
    const singleAreaData = data.filter((f: any) => f.area_id === props.areaId && indicatorsToKeep.includes(f.plot));
    return filterTimeSeriesData(singleAreaData, {plot: "timeSeries", selections: modalSelections}, store.state)
});

const valueFormats = computed(() => {
    const indicatorsForPlotType = timeSeriesExpandedViews.get(props.plotType)?.plots
    if (!indicatorsForPlotType) {
        return []
    }
    const allIndicators = ([] as string[]).concat(...indicatorsForPlotType)
    const plotTypeFilter = store.state.plotSelections["timeSeries"].filters.find(f => f.stateFilterId === "plotType")!;
    const filterType = store.state.metadata.reviewInputMetadata!.filterTypes.find(ft => ft.id === plotTypeFilter.filterId)!;
    return allIndicators.map(ind => {
        const columnValue = filterType.options.find(op => op.id === ind) as ReviewInputDataColumnValue;
        return columnValue.format ? numeralJsToD3format(columnValue.format) : ""
    });
});

const timeSeriesPlotLabels = store.getters["metadata/timeSeriesPlotTypeLabel"];

const layout = computed<Layout>(() => {
    const plots = timeSeriesExpandedViews.get(props.plotType)?.plots
    return {
        isModal: true,
        margin: {l: 40, r: 40, t: 10, b: 40},
        timeSeriesPlotLabels: timeSeriesPlotLabels,
        yAxisFormat: valueFormats.value,
        subplots: {
            rows: 1,
            columns: plots?.length ?? 1,
            xgap: 0.15,
            distinctColumn: "plot",
            indicators: plots
        }
    }
});

const formula = computed<string>(() => {
    const expression = timeSeriesExpandedViews.get(props.plotType)?.formula
    if (!expression) {
        return ""
    }
    console.log(expressionToString(expression, timeSeriesPlotLabels))
    return expressionToString(expression, timeSeriesPlotLabels);
});

const highlightTrace = (plotType: string) => {
    console.log("triggering highlight", plotType)
    chart.value?.highlightTrace(plotType);
};

const resetTrace = (plotType: string) => {
    console.log("triggering reset")
    chart.value?.resetStyle(plotType);
};
</script>
<style scoped>
.equation {
    font-size: 1.7vw;
}
</style>
