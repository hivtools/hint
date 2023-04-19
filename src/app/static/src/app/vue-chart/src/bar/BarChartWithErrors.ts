import {Bar} from 'vue-chartjs'
// import ErrorBarsPlugin from 'chartjs-plugin-error-bars'
import {BarChartData} from "./utils";
import { ChartDataSetsWithErrors } from "./types"
import { defineComponent } from 'vue';

interface Props {
    [key:string]: any
    chartData: BarChartData
    xLabel: string
    yLabel: string
    yFormat: (value: number | string) => string
    showErrors: boolean
}

interface Methods {
    [key:string]: any
    updateRender(): void
}

export default defineComponent<Props, unknown, unknown, Record<string, any>, Methods>({
    extends: Bar,
    methods: {
        updateRender() {
        // (this as any).addPlugin(ErrorBarsPlugin);

        const formatCallback = this.yFormat || ((value: number | string) => value);
        (this as any).renderChart(this.chartData, {
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: this.yLabel
                    },
                    ticks: {
                        suggestedMax: this.chartData.maxValuePlusError,
                        beginAtZero: true,
                        callback: formatCallback
                    }
                }],
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: this.xLabel
                    }
                }]
            },
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
                chartJsPluginErrorBars: {
                    color: '#000',
                    width: '2px',
                    lineWidth: '2px',
                    absoluteValues: true
                }
            }
        })
        },
    },
    mounted() {
        this.updateRender();
    },
    watch: {
        chartData: {
            handler: 'updateRender'
        }
    }
    // @Watch("chartData")
    // chartDataChanged() {
    //     this.updateRender();
    // }
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
