<template>
    <div>
        <div v-if="rendering" class="text-center mt-4" style="position: absolute; top: 0; width: 100%;">
            <loading-spinner size="lg"></loading-spinner>
            <h2 id="loading-message" v-translate="'loadingChart'"></h2>
        </div>
        <div id="chart" ref="chart" :style="style"></div>
    </div>
</template>

<script lang="ts">
    import Plotly from "plotly.js-basic-dist";
    import LoadingSpinner from "../LoadingSpinner.vue";
    import { PropType, defineComponent } from "vue";
    import { Dict } from "../../types";

    const config = {
        responsive: false,
        scrollZoom: false,
        modeBarButtonsToRemove: ['zoom2d', 'pan2d', 'select2d', 'lasso2d', 'autoScale2d', 'resetScale2d', 'zoomIn2d', 'zoomOut2d']
    };

    const lineColor = "rgb(51, 51, 51)";
    const highlightColor = "rgb(255, 51, 51)";

    export default defineComponent({
        name: "Plotly",
        props: {
            chartMetadata: {
                type: String,
                required: true
            },
            chartData: {
                type: Object as PropType<Dict<any[]> | null>,
                required: true
            },
            layoutData: {
                type: Object as PropType<Dict<any>>,
                required: true
            }
        },
        components: {
            LoadingSpinner
        },
        data: function() {
            return {
                rendering: false,
                layoutRequired: false
            };
        },
        computed: {
            inputData() { 
                return {
                    ...this.chartData,
                    ...this.layoutData
                };
            },
            style() {
                return {
                    width:'100%',
                    height: '100%',
                    visibility: this.rendering ? 'hidden' : 'visible'
                } as any;
            }
        },
        methods: {
            drawChart: async function() {
                this.rendering = true;
                const el = this.$refs.chart;
                const drawFunc = this.layoutRequired ? Plotly.newPlot : Plotly.react;
                this.layoutRequired = false;
                const drawData = await this.getData()
                await drawFunc(el as HTMLElement, drawData.data, drawData.layout, {...config as any});
                this.rendering = false;
            },
            getData: async function() {
                const dataByArea: Record<string, any[]> = {};
                this.chartData?.data.forEach(dataPoint => {
                    const areaId = dataPoint.area_id;
                    if (areaId in dataByArea) {
                        dataByArea[areaId].push(dataPoint);
                    } else {
                        dataByArea[areaId] = [dataPoint];
                    }
                })
                const areaIds = Object.keys(dataByArea);

                const numOfRows = this.layoutData?.subplots?.rows || 1;
                const subPlotHeight = 1/numOfRows * 0.6;
                const timePeriods = this.chartData?.data.map(dataPoint => dataPoint.time_period).sort() || [];
                const firstXAxisVal = timePeriods[0];
                const lastXAxisVal = timePeriods[timePeriods.length - 1];

                const data: any = [];
                data.sequence = true;
                data.keepSingleton = true;
                areaIds.forEach((id, index) => {
                    const areaData = dataByArea[id];
                    const values = areaData.map(data => data.value);

                    const highlightedLineIndexes: boolean[] = [];
                    for (let i = 1; i < values.length; i++) {
                        const thisVal = values[i];
                        const prevVal = values[i - 1];

                        const isHighlighted = !!((thisVal !== null && prevVal !== null && thisVal > 0)
                        && (thisVal > 1.25 * prevVal || thisVal < 0.75 * prevVal));

                        highlightedLineIndexes.push(isHighlighted);
                    }

                    const noHighlightsRequired = highlightedLineIndexes.every(v => v === false);
                    
                    let highlightXAndY: any[][] = [[], []];
                    if (!noHighlightsRequired) {
                        const interpolateIndexes: boolean[] = [];
                        for (let i = 0; i < highlightedLineIndexes.length - 1; i++) {
                            const interpolate = !!((i > 0)
                            && (highlightedLineIndexes[i - 1] && !highlightedLineIndexes[i] && highlightedLineIndexes[i + 1]))
                            interpolateIndexes.push(interpolate)
                        }

                        const interpolationRequired = !(interpolateIndexes.every(v => v === false));

                        const highlightY = [];
                        for (let i = 0; i < values.length; i++) {
                            const isHighlighted = (i === 0 && highlightedLineIndexes[0])
                            || (i === highlightedLineIndexes.length && highlightedLineIndexes[i - 1])
                            || (i > 0 && i < highlightedLineIndexes.length && (highlightedLineIndexes[i - 1] || highlightedLineIndexes[i]));

                            const markerVal = isHighlighted ? values[i] : null;
                            highlightY.push(markerVal);
                            if (interpolateIndexes[i]) {
                                highlightY.push(null);
                            }
                        }

                        let highlightX = [];
                        const localTimePeriods = dataByArea[id].map(x => x.time_period);
                        if (!interpolationRequired) {
                            highlightX = localTimePeriods
                        } else {
                            for (let i = 0; i < values.length; i++) {
                                highlightX.push(localTimePeriods[i]);
                                if (interpolateIndexes[i]) {
                                    highlightX.push(null);
                                }
                            }
                        }

                        highlightXAndY = [highlightX, highlightY]
                    }

                    const areaHierarchy = dataByArea[id][0].area_hierarchy;
                    const areaHierarchyTooltip = areaHierarchy ? "<br>" + areaHierarchy : "";
                    const hoverTemplate = "%{x}, %{y}" + areaHierarchyTooltip + "<extra></extra>";

                    const normalColorPoints: any = {
                        name: dataByArea[id][0].area_name,
                        showlegend: false,
                        x: dataByArea[id].map(x => x.time_period),
                        y: dataByArea[id].map(x => x.value),
                        xaxis: `x${index+1}`,
                        yaxis: `y${index+1}`,
                        type: "scatter",
                        line: {
                            color: lineColor
                        },
                        hoverTemplate
                    }
                    normalColorPoints.x.sequence = true;
                    normalColorPoints.y.sequence = true;

                    const highlightedPoints: any = {
                        name: dataByArea[id][0].area_name,
                        showlegend: false,
                        x: highlightXAndY[0],
                        y: highlightXAndY[1],
                        xaxis: `x${index+1}`,
                        yaxis: `y${index+1}`,
                        type: "scatter",
                        line: {
                            color: highlightColor
                        },
                        hovertemplate: hoverTemplate
                    };
                    highlightedPoints.x.sequence = true;
                    highlightedPoints.y.sequence = true;

                    data.push(normalColorPoints);
                    data.push(highlightedPoints);
                });

                const baseLayout: Dict<any> = {
                    "margin": {"t": 32},
                    "dragmode": false,
                    "grid": {
                        "columns": this.layoutData.subplots.columns,
                        "rows": this.layoutData.subplots.rows,
                        "pattern": 'independent'
                    },
                    "annotations": areaIds.map((id, index) => {
                        return {
                            "text": dataByArea[id][0].area_name + " (" + id + ")",
                            "textfont": {},
                            "showarrow": false,
                            "x": 0.5,
                            "xanchor": "middle",
                            "xref": "x" + `${index+1}` + " domain",
                            "y": 1.1,
                            "yanchor": "middle",
                            "yref": "y" + `${index+1}` + " domain"
                        }
                    })
                };

                baseLayout.annotations.sequence = true;
                baseLayout.annotations.keepSingleton = true;

                for (let i = 0; i < areaIds.length; i++) {
                    const row = Math.floor((i - 1)/this.layoutData.subplots.columns);
                    baseLayout[`yaxis${i + 1}`] = {
                        "rangemode": "tozero",
                        "zeroline": false,
                        "tickformat": this.layoutData.yAxisFormat,
                        "tickfont": {
                            "color": "grey"
                        },
                        "domain": [
                            1 - (row/this.layoutData.subplots.rows),
                            1 - ((row/this.layoutData.subplots.rows) + subPlotHeight)
                        ],
                        "autorange": true,
                        "type": "linear"
                    };
                    baseLayout[`xaxis${i + 1}`] = {
                        "zeroline": false,
                        "tickvals": [firstXAxisVal, lastXAxisVal],
                        "tickfont": {
                            "color": "grey"
                        },
                        "autorange": true,
                        "type": "category"
                    };
                }

                return { data, layout: baseLayout }
            }
        },
        async mounted() {
            await this.drawChart();
        },
        watch: {
            chartMetadata: {
                handler: async function() {
                    await this.drawChart();
                },
                deep: true
            },
            chartData: {
                handler: async function() {
                    await this.drawChart();
                },
                deep: true
            },
            layoutData: function(newVal, oldVal) {
                if (oldVal?.subplots && newVal?.subplots && oldVal.subplots.rows != newVal.subplots.rows) {
                    this.layoutRequired = true;
                }
            }
        }
    });
</script>
