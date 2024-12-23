<template>
    <div id="chart" ref="chart" style="width: 100%; height: 100%;"></div>
</template>

<script lang="ts">
import { PropType, computed, defineComponent, onMounted, ref, watch } from 'vue';
import { InputTimeSeriesData } from '../../../generated';
import { useStore } from 'vuex';
import { RootState } from '../../../root';
import {
    drawConfig,
    getScatterPointsFromAreaIds,
    Layout,
    getChartDataByArea,
    getChartDataByIndicatorGroup,
    getScatterPointsFromIndicator,
    getLayoutFromData,
    HintPlotlyAnnotation
} from "./utils";
import Plotly from "plotly.js-basic-dist";


export default defineComponent({
    props: {
        chartData: {
            type: Object as PropType<InputTimeSeriesData>,
            required: true
        },
        layout: {
            type: Object as PropType<Layout>,
            required: true
        },
        pageNumber: {
            type: Number,
            required: true
        },
    },
    emits: ['open-context'],
    expose: ['highlightTrace', 'resetStyle'],
    setup(props, { emit }) {
        const store = useStore<RootState>();
        const currentLanguage = computed(() => store.state.language);

        const dataByGroup = computed(() => {
            if (!props.chartData || props.chartData.length == 0) return {};
            if (props.layout.subplots.distinctColumn === "plot") {
                return getChartDataByIndicatorGroup(props.chartData, props.layout.subplots.indicators);
            } else {
                return getChartDataByArea(props.chartData);
            }
        });

        const getData = () => {
            if (props.layout.subplots.distinctColumn === "plot") {
                return getScatterPointsFromIndicator(props.layout.subplots.indicators, dataByGroup.value, props.layout.timeSeriesPlotLabels, currentLanguage.value);
            } else {
                return getScatterPointsFromAreaIds(dataByGroup.value, currentLanguage.value);
            }
        };

        const layout = computed(() => {
            const timePeriods = props.chartData.map(dataPoint => dataPoint.time_period).sort() || [];
            return getLayoutFromData(dataByGroup.value, props.layout, timePeriods)
        });

        const chart = ref<HTMLElement | null>(null);

        const drawChart = async () => {
            const data = getData()
            await Plotly.newPlot(chart.value!, data, layout.value, drawConfig as any)
                .then(gd => {
                    gd.on('plotly_clickannotation', (data) => {
                        emit("open-context",
                            (data.annotation as HintPlotlyAnnotation).areaId,
                            (data.annotation as HintPlotlyAnnotation).plotType)
                    })
                });
        };

        const highlightTrace = (plotType: string) => {
            const data = getData()
            const newStyle = data.map(line => {
                if (line.plotType === plotType) {
                    return {}
                } else {
                    return {
                        line: {color: "lightgrey"},
                        marker: {color: "lightgrey", line: {color: "lightgrey"}}
                    }
                }
            })
            animate(newStyle);
        };

        const resetStyle = () => {
            const data = getData();
            animate(data);
        }

        const animate = (data: any = [], layout: any = {}) => {
            Plotly.animate(chart.value!, {
                data: data,
                layout: layout
            }, {
                transition: { duration: 0 },
                frame: { duration: 0, redraw: false },
            })
        }

        onMounted(drawChart);
        watch(() => [props.chartData], async () => {if (props.layout.isModal) {
            await drawChart()
        }})
        watch(() => [store.state.plotSelections.timeSeries, props.pageNumber], () => {
            if (!props.layout.isModal) drawChart()
        });

        return {
            chart,
            highlightTrace,
            resetStyle
        }
    }
});
</script>
