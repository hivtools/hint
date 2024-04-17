<template>
    <div>
        <Bar :data="chartData" :options="chartOptions"/>
        <div v-if="showNoDataMessage" id="noDataMessage" class="px-3 py-2 noDataMessage">
            <span class="lead">
                <strong v-translate="'noChartData'"></strong>
            </span>
        </div>
    </div>
</template>

<script lang="ts">
import {Bar} from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import annotationPlugin from "chartjs-plugin-annotation";
import {useStore} from "vuex";
import {RootState} from "../../../root";
import {computed, defineComponent, onMounted, ref, watch} from "vue";
import {PlotData} from "../../../store/plotData/plotData";
import {
    plotDataToChartData,
    BarChartData,
    getErrorLineAnnotations,
    buildTooltipCallback,
} from "./utils";
import {formatOutput, getIndicatorMetadata} from "../utils";
import {ChoroplethIndicatorMetadata} from "../../../generated";
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, annotationPlugin);

export default defineComponent({
    props: {
        showErrorBars: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    setup(props) {
        const store = useStore<RootState>();

        const getIndicator = () => {
            return store.state.plotSelections.barchart.filters.find(f => f.stateFilterId === "indicator")!.selection[0].id
        }
        const indicator = ref<string>(getIndicator());
        // Bit confusing this is using ChoroplethIndicatorMetadata here
        // TODO: make this type more generic in the hintr PR
        const indicatorMetadata = computed<ChoroplethIndicatorMetadata>(() => {
            return getIndicatorMetadata(store, indicator.value)
        });

        const areaIdToLevelMap = store.getters["baseline/areaIdToLevelMap"];
        const controlSelectionFromId = store.getters["plotSelections/controlSelectionFromId"];
        const filterSelectionFromId = store.getters["plotSelections/filterSelectionFromId"];
        const filterIdToColumnId = store.getters["modelCalibrate/filterIdToColumnId"];

        const plotData = computed<PlotData>(() => store.state.plotData.barchart);
        const filterSelections = computed(() => store.state.plotSelections.barchart.filters);

        const chartData = ref<BarChartData>({datasets:[], labels: [], maxValuePlusError: 0});
        const chartOptions = ref({});
        const displayErrorBars = ref<boolean>(false);
        const showNoDataMessage = computed(() => {
            return chartData.value.datasets.length == 0
        });

        const updateChart = () => {
            hideAllErrorBars();
            const disaggregateBy = controlSelectionFromId("barchart", "disagg_by");
            const xAxis = controlSelectionFromId("barchart", "x_axis");
            if (!disaggregateBy || !xAxis) {
                return
            }
            const disaggregateId = filterIdToColumnId(disaggregateBy.id)
            const xAxisId = filterIdToColumnId(xAxis.id)
            const areaLevel = store.state.plotSelections.barchart.filters.find(f => f.filterId == "detail")?.selection[0]?.id
            const disaggregateSelections = filterSelectionFromId("barchart", disaggregateBy.id)
            const xAxisSelections = filterSelectionFromId("barchart", xAxis.id)
            const xAxisOptions = store.state.modelCalibrate.metadata!.filterTypes.find(f => f.id === xAxis!.id)!.options
            if (disaggregateId && xAxisId && areaLevel && plotData.value) {
                chartData.value = plotDataToChartData(plotData.value, indicatorMetadata.value,
                        disaggregateId, disaggregateSelections,
                        xAxisId, xAxisSelections, xAxisOptions,
                        areaLevel, areaIdToLevelMap);
            }
            showLabelErrorBars.value = chartData.value.datasets.map(() => true);
        };

        const hideAllErrorBars = () => {
            displayErrorBars.value = false;
        };

        const showAllErrorBars = () => {
            displayErrorBars.value = true;
        };

        const showLabelErrorBars = ref<boolean[]>(chartData.value.datasets.map(() => true));
        /*
            We need to pass a customLegendClick event into chartOptions so
            that our state can update when a user clicks on the legend and
            hides some bars. This is required to coordinate the chart with
            the error bars.
        */
        const customLegendClick = (e: Event, legendItem: any, legend: any) => {
            hideAllErrorBars();
            const index = legendItem.datasetIndex;
            const ci = legend.chart;
            const isDatasetVisible = ci.isDatasetVisible(index);
            showLabelErrorBars.value[index] = !isDatasetVisible;
            legendItem.hidden = isDatasetVisible;
            if (isDatasetVisible) {
                setTimeout(() => {
                    ci.hide(index);
                }, 50);
            } else {
                setTimeout(() => {
                    ci.show(index);
                }, 50);
            }
            updateChartOptions();
        };

        const updateChartOptions = () => {
            console.log("updating chart options")
            const baseChartOptions = {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: buildTooltipCallback(indicatorMetadata.value, props.showErrorBars)
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: ((value: number | string) => {
                                return formatOutput(value,
                                        indicatorMetadata.value.format,
                                        indicatorMetadata.value.scale,
                                        indicatorMetadata.value.accuracy)
                            })
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }

            if (props.showErrorBars) {

                const errorLines = getErrorLineAnnotations(chartData.value, displayErrorBars.value,
                        showLabelErrorBars.value);

                chartOptions.value = {
                    ...baseChartOptions,
                    plugins: {
                        ...baseChartOptions.plugins,
                        annotation: {
                            annotations: errorLines
                        },
                        legend: {
                            onClick: customLegendClick
                        }
                    },
                    scales: {
                        y: {
                            max: chartData.value.maxValuePlusError * 1.1,
                            ticks: {
                                callback: ((value: number | string) => {
                                    return value == chartData.value.maxValuePlusError * 1.1 ? "" :
                                        formatOutput(value,
                                            indicatorMetadata.value.format,
                                            indicatorMetadata.value.scale,
                                            indicatorMetadata.value.accuracy)
                                })
                            }
                        }
                    },
                    animation: {
                        onComplete: showAllErrorBars
                    }
                }
            } else {
                chartOptions.value = baseChartOptions
            }
        };

        onMounted(() => {
            updateChart();
            updateChartOptions();
        });

        watch(filterSelections, updateChart, { immediate: true });
        watch(displayErrorBars, updateChartOptions, { immediate: true });

        return {
            chartData,
            chartOptions,
            showNoDataMessage
        }
    },
    components: {
        Bar
    }
})
</script>
