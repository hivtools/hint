<template>
    <div class="col-9 time-series">
        <div :key="spaceNeededForPlots" class="chart-container" ref="chartContainer" style="height: 640px;">
            <plotly class="chart"
                    v-if="chartDataForPage.length > 0"
                    :chart-data="chartDataForPage"
                    :layout="layout"
                    :style="{ height: spaceNeededForPlots }"
                    :page-number="pageNumber"/>
            <div v-else class="mt-5" id="empty-generic-chart-data">
                <div class="empty-chart-message px-3 py-2">
                    <span class="lead">
                        <strong v-translate="'noChartData'"></strong>
                    </span>
                </div>
            </div>
        </div>
        <page-control v-if="totalPages > 1"
                      class="page-controls"
                      :page-number="pageNumber"
                      :total-pages="totalPages"
                      @back="pageNumber--"
                      @next="pageNumber++"/>
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { RootState } from '../../../root';
import { InputPlotName } from '../../../store/plotSelections/plotSelections';
import { ReviewInputDataColumnValue } from '../../../types';
import { numeralJsToD3format } from "./utils";
import Plotly from "./Plotly.vue";
import PageControl from './PageControl.vue';
import { InputTimeSeriesData } from '../../../generated';
import { InputTimeSeriesKey } from "../../../store/plotData/plotData";

const plot = "timeSeries" as InputPlotName;

const subplotsConfig = {
   columns: 3,
   distinctColumn: "area_id",
   heightPerRow: 160,
   subplotsPerPage: 12
}

export default defineComponent({
    components: {
        Plotly,
        PageControl,
    },
    setup() {
        const store = useStore<RootState>();
        const pageNumber = ref<number>(0);
        watch(() => store.state.plotSelections[plot], () => pageNumber.value = 0)

        const valueFormat = computed(() => {
            const plotTypeFilter = store.state.plotSelections[plot].filters.find(f => f.stateFilterId === "plotType")!;
            const selectionId = plotTypeFilter.selection[0].id;
            const filterType = store.state.metadata.reviewInputMetadata!.filterTypes.find(ft => ft.id === plotTypeFilter.filterId)!;
            const { format } = filterType.options.find(op => op.id === selectionId) as ReviewInputDataColumnValue;
            if (!format) return "";
            return numeralJsToD3format(format);
        });

        const chartData = computed(() => store.state.plotData[plot] as InputTimeSeriesData);

        const distinctPlots = computed(() => {
            const { distinctColumn } = subplotsConfig;
            return chartData.value.reduce((dp, data) => {
                // will be string as distinct plots are defined by area_id
                const value = data[distinctColumn as InputTimeSeriesKey] as string;
                return [...dp, ...dp.includes(value) ? [] : [value]];
            }, [] as string[]);
        });

        const totalPages = computed(() => {
            return Math.ceil(distinctPlots.value.length / subplotsConfig.subplotsPerPage);
        });

        const visiblePlots = computed(() => {
            const { subplotsPerPage } = subplotsConfig;
            const startIndex = pageNumber.value * subplotsPerPage;
            const endIndex = (pageNumber.value + 1) * subplotsPerPage;
            return distinctPlots.value.slice(startIndex, endIndex);
        });

        const chartDataForPage = computed(() => {
            const { distinctColumn } = subplotsConfig;
            return chartData.value.reduce((vcd, data) => {
                const value = data[distinctColumn as InputTimeSeriesKey] as string;
                return [...vcd, ...visiblePlots.value.includes(value) ? [data] : []];
            }, [] as InputTimeSeriesData);
        })

        const rows = computed(() => {
            return Math.ceil(visiblePlots.value.length / subplotsConfig.columns);
        });

        const spaceNeededForPlots = computed(() => {
            return `${Math.min((subplotsConfig.heightPerRow * rows.value!) + 70, 640)}px`;
        });

        const layout = computed(() => {
            return {
                yAxisFormat: valueFormat.value,
                subplots: {
                    ...subplotsConfig,
                    rows: rows.value
                }
            };
        });

        return {
            chartDataForPage,
            layout,
            spaceNeededForPlots,
            pageNumber,
            totalPages
        }
    }
})
</script>

<style scoped>
.time-series {
    position: relative;
    margin-top: 0.75rem;
    padding: 0;
}

.chart-container {
    border: transparent;
    overflow-y: hidden;
}

.page-controls {
    position: absolute;
    bottom: 0;
    margin-bottom: 0;
    width: 100%;
    justify-content: center;
}
</style>
