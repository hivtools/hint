<template>
    <div>
        <Bar ref="chart" :data="chartData" :options="chartOptions"/>
        <div v-if="chartData.datasets.length == 0" id="noDataMessage" class="px-3 py-2 noDataMessage">
            <span class="lead">
                <strong v-translate="'noChartData'"></strong>
            </span>
        </div>
    </div>
</template>

<script lang="ts">
import {Bar} from 'vue-chartjs';
import {BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip} from 'chart.js';
import annotationPlugin from "chartjs-plugin-annotation";
import {useStore} from "vuex";
import {RootState} from "../../../root";
import {computed, defineComponent, PropType, ref, watch} from "vue";
import {PlotData} from "../../../store/plotData/plotData";
import {BarChartData, buildTooltipCallback, getErrorLineAnnotations,} from "./utils";
import {formatOutput, getIndicatorMetadata} from "../utils";
import {IndicatorMetadata} from "../../../generated";
import {PlotName} from "../../../store/plotSelections/plotSelections";

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, annotationPlugin);

export default defineComponent({
    props: {
        plot:{
            type: String as PropType<PlotName>,
            required: true
        },
        showErrorBars: {
            type: Boolean,
            required: false,
            default: false
        },
    },
    setup(props) {
        const chart = ref<typeof Bar | null>(null);
        const store = useStore<RootState>();

        const filterSelections = computed(() => store.state.plotSelections[props.plot].filters);
        const indicatorMetadata = computed<IndicatorMetadata>(() => {
            const indicator = filterSelections.value.find(f => f.stateFilterId === "indicator")!.selection[0].id;
            return getIndicatorMetadata(store, props.plot, indicator);
        });
        const plotData = computed<PlotData>(() => {
            return store.state.plotData[props.plot]
        });
        const isRatioIndicator = computed<boolean>(()=>indicatorMetadata.value.indicator.includes('_ratio'));

        const chartDataGetter = store.getters["plotSelections/barchartData"];
        const chartData = ref<BarChartData<(number | null)[]>>({datasets:[], labels: [], maxValuePlusError: 0});
        const chartOptions = ref({});
        const displayErrorBars = ref<boolean>(false);
        const currentLanguage = computed(() => store.state.language);

        const updateChart = () => {
            chartData.value = chartDataGetter(props.plot, plotData.value, indicatorMetadata.value,
                    filterSelections.value, currentLanguage.value)
            if (props.showErrorBars) {
                /*
                    We hide the error bars when data changes otherwise the animation can get quite wild
                    Chart options are updated via a watch on error bar visibility as when the data updates we want to
                    1. Hide the error bars and update the chart data
                    2. Wait for animation to finish
                    3. Redraw the error bars
                    So in the case error bars are on, hide them and let the watcher handle updating chart options.
                */
                hideAllErrorBars();
            } else {
                updateChartOptions()
            }
        };

        const hideAllErrorBars = () => {
            displayErrorBars.value = false;
        };

        const showAllErrorBars = () => {
            displayErrorBars.value = true;
        };

        /*
            We need to pass a customLegendClick event into chartOptions so
            that our state can update when a user clicks on the legend and
            hides some bars. This is required to coordinate the chart with
            the error bars.
        */
        const customLegendClick = (_e: Event, legendItem: any, legend: any) => {
            const index = legendItem.datasetIndex;
            const ci = legend.chart;
            const isDatasetVisible = ci.isDatasetVisible(index);
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
            const baseChartOptions = {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: buildTooltipCallback(indicatorMetadata.value, props.showErrorBars),
                            afterBody: function(context: any) {
                                const {dataset} = context[0];
                                return dataset.tooltipExtraText[context[0].dataIndex];
                            }
                        }
                    },
                    annotation: {},
                },
                scales: {
                    y: {
                        max: undefined as number | undefined,
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

            if (isRatioIndicator.value) {
                // For ratio indicators, plot a dotted line at 1 and set y-max to 2
                baseChartOptions.plugins.annotation = {
                    annotations: {
                            dottedLine: {
                                type: 'line',
                                yMin: 1,
                                yMax: 1,
                                borderWidth: 2,
                                borderDash: [5],
                                drawTime: 'beforeDatasetsDraw'
                            }
                        }
                }
                baseChartOptions.scales.y.max = 2
            }

            if (props.showErrorBars) {

                let showLabelErrorBars = [];
                if (chart.value && chart.value.chart) {
                    if (displayErrorBars.value) {
                        showLabelErrorBars = chart.value.chart.legend.legendItems.map((item: any) => !item.hidden);
                    } else {
                        showLabelErrorBars = chart.value.chart.legend.legendItems.map(() => false);
                    }
                }
                const errorLines = getErrorLineAnnotations(chartData.value, displayErrorBars.value, showLabelErrorBars);

                chartOptions.value = {
                    ...baseChartOptions,
                    plugins: {
                        ...baseChartOptions.plugins,
                        annotation: {
                            annotations: errorLines
                        },
                        legend: {
                            onClick: customLegendClick
                        },
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
                                            indicatorMetadata.value.accuracy).toString()
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

        // Data will already have been fetched for output plots, but if this is the
        // input barchart we need to be careful and make sure we don't try and update chart or options too soon.
        const dataAlreadyFetched = props.plot !== "inputComparisonBarchart" || !!store.state.reviewInput.inputComparison.data

        watch(filterSelections, updateChart, { immediate: dataAlreadyFetched });
        watch(displayErrorBars, updateChartOptions, { immediate: dataAlreadyFetched });

        return {
            chart,
            chartData,
            chartOptions,
        }
    },
    components: {
        Bar
    }
})
</script>
