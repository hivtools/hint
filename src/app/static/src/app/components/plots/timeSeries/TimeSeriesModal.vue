<template>
    <modal :open="openModal" @close-modal="() => $emit('close-modal')">
        <template v-slot:header>
            <h4>{{areaName}} ({{areaId}})</h4>
        </template>

        <div class="flex-column" style="max-height: 80vh">

            <time-series-legend
                v-if="chartData.length > 0"
                :plot-type="plotType"/>

            <plotly class="chart"
                    v-if="chartData.length > 0"
                    :chart-data="chartData"
                    :layout="layout"
                    :page-number="0"
                    @open-context="() => {}"/>

            <equation class="text-center h2"
                    :formula="formula"/>
        </div>
    </modal>
</template>

<script setup lang="ts">
import Modal from "../../Modal.vue";
import Plotly from "./Plotly.vue";
import {InputTimeSeriesData} from '../../../generated';
import {computed} from "vue";
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

defineEmits(["close-modal"])

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

    const modalSelections = structuredClone(selections)
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
        return numeralJsToD3format(columnValue.format)
    });
});

const timeSeriesPlotLabels = store.getters["metadata/timeSeriesPlotTypeLabel"];

const layout = computed<Layout>(() => {
    return {
        isModal: true,
        margin: {l: 40, r: 40, t: 10, b: 40},
        timeSeriesPlotLabels: timeSeriesPlotLabels,
        yAxisFormat: valueFormats.value,
        subplots: {
            rows: 1,
            columns: 3,
            xgap: 0.15,
            distinctColumn: "plot",
            indicators: timeSeriesExpandedViews.get(props.plotType)?.plots
        }
    }
});

const formula = computed<string>(() => {
    const expression = timeSeriesExpandedViews.get(props.plotType)?.formula
    if (!expression) {
        return ""
    }
    return expressionToString(expression, timeSeriesPlotLabels);
})
</script>
