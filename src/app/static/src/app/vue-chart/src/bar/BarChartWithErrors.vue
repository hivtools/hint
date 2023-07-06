<template>
    <Bar :data="chartData" :options="chartOptions"/>
</template>

<script lang="ts">
import {Bar} from 'vue-chartjs';
import {BarChartData} from "./utils";
import { ChartDataSetsWithErrors } from "./types";
import { PropType, defineComponent } from 'vue';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, Chart } from 'chart.js';
import annotationPlugin from "chartjs-plugin-annotation";

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, annotationPlugin);

interface Data {
    displayErrorBars: boolean,
    errorBarTimeout: any
}

export default defineComponent({
    components: {
        Bar
    },
    data(): Data {
        return {
            displayErrorBars: true,
            errorBarTimeout: null
        }
    },
    props: {
        chartData: {
            type: Object as PropType<BarChartData>,
            required: true
        },
        xLabel: {
            type: String,
            required: true
        },
        yLabel: {
            type: String,
            required: true
        },
        yFormat: {
            type: Function as PropType<(value: number | string) => string>,
            required: true
        },
        showErrors: {
            type: Boolean,
            required: true
        },
    },
    computed: {
        chartDataString() {
            console.log(this.chartData)
            console.log(this.xLabel)
            console.log(this.yLabel)
            return JSON.stringify(this.chartData)
        },
        chartOptions() {
            const formatCallback = this.yFormat || ((value: number | string) => value);

            const chartData = this.chartData as any;
            console.log(chartData)
            const datasets = chartData.datasets as any[];
            const errorLines = [] as any[];
            const numOfDatasets = datasets.length;
            const numOfLabels = chartData.labels.length;
            const numOfBars = numOfDatasets * numOfLabels;
            const barPercentage = 0.8;
            const barWidth = barPercentage/(numOfDatasets * 2);
            const errorBarWeight = 1;
            datasets.forEach((dataset, indexDataset) => {
                const errorBarData = dataset.errorBars;
                const label = dataset.label;
                Object.keys(errorBarData).forEach((xLabel) => {
                    const labelIndex = chartData.labels.indexOf(xLabel)
                    const barMidPoint = labelIndex - barPercentage/2 + barWidth * (indexDataset * 2 + 1);
                    const errorBarWidth = (numOfBars/(numOfBars + 10)) * barWidth * 0.3;
                    const config = [
                        {
                            drawTime: "afterDraw",
                            type: "line",
                            label: {
                                content: label
                            },
                            display: this.displayErrorBars,
                            xMin: barMidPoint,
                            xMax: barMidPoint,
                            yMin: errorBarData[xLabel].minus,
                            yMax: errorBarData[xLabel].plus,
                            borderWidth: errorBarWeight
                        },
                        {
                            drawTime: "afterDraw",
                            type: "line",
                            label: {
                                content: label
                            },
                            display: this.displayErrorBars,
                            xMin: barMidPoint - errorBarWidth,
                            xMax: barMidPoint + errorBarWidth,
                            yMin: errorBarData[xLabel].plus,
                            yMax: errorBarData[xLabel].plus,
                            borderWidth: errorBarWeight
                        },
                        {
                            drawTime: "afterDraw",
                            type: "line",
                            label: {
                                content: label
                            },
                            display: this.displayErrorBars,
                            xMin: barMidPoint - errorBarWidth,
                            xMax: barMidPoint + errorBarWidth,
                            yMin: errorBarData[xLabel].minus,
                            yMax: errorBarData[xLabel].minus,
                            borderWidth: errorBarWeight
                        },
                    ];
                    errorLines.push(...config);
                })

            });

            return {
                legend: {
                    position: "right",
                },
                tooltips: {
                    callbacks: {
                        label: (tooltipItem: any, data: any) => {
                            let label = ((typeof tooltipItem.datasetIndex !== "undefined") && data.datasets && data.datasets[tooltipItem.datasetIndex].label)
                                            || '';
                            if (label) {
                                label += ': ';
                            }

                            if (tooltipItem.yLabel) {
                                label += formatCallback(tooltipItem.yLabel);
                            }

                            let minus = null
                            let plus = null

                            if (this.showErrors && tooltipItem.xLabel && typeof tooltipItem.datasetIndex !== "undefined" && data.datasets && data.datasets[tooltipItem.datasetIndex]) {
                                const errorBars = (data.datasets[tooltipItem.datasetIndex] as ChartDataSetsWithErrors).errorBars
                                const xLabelErrorBars = errorBars ? errorBars[tooltipItem.xLabel] : null
                                if (xLabelErrorBars) {
                                    minus = xLabelErrorBars.minus
                                    plus = xLabelErrorBars.plus
                                }
                            }

                            if ((typeof minus === "number") && (typeof plus === "number")) {
                                label = `${label} (${formatCallback(minus)} - ${formatCallback(plus)})`
                            }

                            return label;
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    annotation: {
                        annotations: errorLines
                    }
                },
                scales: {
                    y: {
                        max: this.chartData.maxValuePlusError * 1.1
                    }
                }
            }
        }
    },
    watch: {
        chartDataString: function(newVal, oldVal) {
            this.displayErrorBars = false;
            if (this.errorBarTimeout) {
                window.clearTimeout(this.errorBarTimeout)
            }
            this.errorBarTimeout = setTimeout(() => {
                this.displayErrorBars = true
            }, 900)
        }
    }
})

// @Component
// export default class BarChartWithErrors extends mixins(Bar) {

//     @Prop()
//     chartData!: BarChartData;

//     @Prop()
//     xLabel!: string;

//     @Prop()
//     yLabel!: string;

//     @Prop()
//     yFormat!: (value: number | string) => string;

//     @Prop()
//     showErrors!: boolean;

    // updateRender() {
    //     (this as any).addPlugin(ErrorBarsPlugin);

    //     const formatCallback = this.yFormat || ((value: number | string) => value);
    //     (this as any).renderChart(this.chartData, {
    //         scales: {
    //             yAxes: [{
    //                 scaleLabel: {
    //                     display: true,
    //                     labelString: this.yLabel
    //                 },
    //                 ticks: {
    //                     suggestedMax: this.chartData.maxValuePlusError,
    //                     beginAtZero: true,
    //                     callback: formatCallback
    //                 }
    //             }],
    //             xAxes: [{
    //                 scaleLabel: {
    //                     display: true,
    //                     labelString: this.xLabel
    //                 }
    //             }]
    //         },
    //         legend: {
    //             position: "right",
    //         },
    //         tooltips: {
    //             callbacks: {
    //                 label: (tooltipItem, data) => {
    //                     let label = ((typeof tooltipItem.datasetIndex !== "undefined") && data.datasets && data.datasets[tooltipItem.datasetIndex].label)
    //                                     || '';
    //                     if (label) {
    //                         label += ': ';
    //                     }

    //                     if (tooltipItem.yLabel) {
    //                         label += formatCallback(tooltipItem.yLabel);
    //                     }

    //                     let minus = null
    //                     let plus = null

    //                     if (this.showErrors && tooltipItem.xLabel && typeof tooltipItem.datasetIndex !== "undefined" && data.datasets && data.datasets[tooltipItem.datasetIndex]) {
    //                         const errorBars = (data.datasets[tooltipItem.datasetIndex] as ChartDataSetsWithErrors).errorBars
    //                         const xLabelErrorBars = errorBars ? errorBars[tooltipItem.xLabel] : null
    //                         if (xLabelErrorBars) {
    //                             minus = xLabelErrorBars.minus
    //                             plus = xLabelErrorBars.plus
    //                         }
    //                     }

    //                     if ((typeof minus === "number") && (typeof plus === "number")) {
    //                         label = `${label} (${formatCallback(minus)} - ${formatCallback(plus)})`
    //                     }

    //                     return label;
    //                 }
    //             }
    //         },
    //         responsive: true,
    //         maintainAspectRatio: false,
    //         plugins: {
    //             chartJsPluginErrorBars: {
    //                 color: '#000',
    //                 width: '2px',
    //                 lineWidth: '2px',
    //                 absoluteValues: true
    //             }
    //         }
    //     })
    // }

//     mounted() {
//         this.updateRender();
//     }

//     @Watch("chartData")
//     chartDataChanged() {
//         this.updateRender();
//     }
// };
</script>
