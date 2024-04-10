<template>
    <div class="col-9" style="position: relative;">
        <div class="chart-container" ref="chartContainer" style="height: 600px;">
            <plotly class="chart"
                    :chart-data="chartDataForPage"
                    :layout="layout"
                    :style="{ height: scrollHeight }"
                    :page-number="pageNumber"/>
        </div>
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import { useStore } from 'vuex';
import { RootState } from '../../../root';
import { InputPlotName } from '../../../store/plotSelections/plotSelections';
import { GenericChartColumnValue } from '../../../types';
import { numeralJsToD3format } from "./utils";
import Plotly from "./Plotly.vue";

const plot = "timeSeries" as InputPlotName;

export default defineComponent({
    components: {
        Plotly
    },
    setup() {
        const store = useStore<RootState>();
        const pageNumber = ref<number>(0);
        const chartMetadata = computed(() => {
            // TODO change metadata so it has key of timeSeries
            return store.state.genericChart.genericChartMetadata!["input-time-series"];
        });

        const valueFormat = computed(() => {
            const { valueFormatColumn } = chartMetadata.value;
            if (!valueFormatColumn) return "";
            const plotTypeFilter = store.state.plotSelections[plot].filters.find(f => f.stateFilterId === "plotType")!;
            const selectionId = plotTypeFilter.selection[0].id;
            const filterType = store.state.metadata.reviewInputMetadata!.filterTypes.find(ft => ft.id === plotTypeFilter.filterId)!;
            const { format } = filterType.options.find(op => op.id === selectionId) as GenericChartColumnValue;
            if (!format) return "";
            return numeralJsToD3format(format);
        });

        const visiblePlots = computed(() => {
            const chartData = store.state.plotData[plot];
            if (!chartMetadata.value.subplots) return [];
            const { distinctColumn, subplotsPerPage } = chartMetadata.value.subplots;
            const startIndex = pageNumber.value * subplotsPerPage;
            const endIndex = (pageNumber.value + 1) * subplotsPerPage;
            const distinctPlots = chartData.reduce((dp, data) => {
                const value = data[distinctColumn];
                return [...dp, ...dp.includes(value) ? [] : [value]];
            }, [] as any[]);
            return distinctPlots.slice(startIndex, endIndex);
        });

        const chartDataForPage = computed(() => {
            const chartData = store.state.plotData[plot];
            if (!chartMetadata.value.subplots) return chartData;
            const { distinctColumn } = chartMetadata.value.subplots;
            return chartData.reduce((vcd, data) => {
                const value = data[distinctColumn];
                return [...vcd, ...visiblePlots.value.includes(value) ? [data] : []];
            }, [] as any[]);
        })

        const rows = computed(() => {
            return chartMetadata.value.subplots ?
                Math.ceil(visiblePlots.value.length / chartMetadata.value.subplots.columns) :
                null;
        });

        const scrollHeight = computed(() => {
            return chartMetadata.value.subplots ?
                `${(chartMetadata.value.subplots.heightPerRow * rows.value!) + 70}px` :
                "100%";
        });

        const layout = computed(() => {
            return {
                yAxisFormat: valueFormat.value,
                ...chartMetadata.value.subplots ?
                    { subplots: {...chartMetadata.value.subplots, rows: rows.value} } :
                    {}
            };
        });

        return {
            chartDataForPage,
            layout,
            scrollHeight,
            pageNumber
        }
    }
})
</script>
