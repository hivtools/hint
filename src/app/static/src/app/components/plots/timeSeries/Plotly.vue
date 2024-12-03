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
    setup(props, { emit }) {
        const store = useStore<RootState>();
        const currentLanguage = computed(() => store.state.language);

        const getData = () => {
            if (!props.chartData || props.chartData.length == 0) return { data: [], layout: {} };
            let data
            let dataByGroup
            if (props.layout.subplots.distinctColumn === "plot") {
                dataByGroup = getChartDataByIndicatorGroup(props.chartData, props.layout.subplots.indicators);
                data = getScatterPointsFromIndicator(props.layout.subplots.indicators, dataByGroup, props.layout.timeSeriesPlotLabels, currentLanguage.value);
            } else {
                dataByGroup = getChartDataByArea(props.chartData);
                data = getScatterPointsFromAreaIds(dataByGroup, currentLanguage.value);
            }
            const timePeriods = props.chartData.map(dataPoint => dataPoint.time_period).sort() || [];
            const layout = getLayoutFromData(dataByGroup, props.layout, timePeriods)
            return { data, layout };
        };

        const chart = ref<HTMLElement | null>(null);

        const drawChart = async () => {
            const drawData = getData();
            await Plotly.newPlot(chart.value!, drawData.data, drawData.layout, drawConfig as any)
                .then(gd => {
                    gd.on('plotly_clickannotation', (data) => {
                        emit("open-context",
                            (data.annotation as HintPlotlyAnnotation).areaId,
                            (data.annotation as HintPlotlyAnnotation).plotType)
                    })
                });
        };

        const resize = async () => {
            Plotly.Plots.resize(chart.value!)
        };

        onMounted(drawChart);
        watch(() => [props.chartData], async () => {if (props.layout.isModal) {
            // Bit gross but we need to resize here because when opening this in a modal it reverts to
            // default width of 700px unless we manually call the resize function. Not really sure why
            // or what is going on here.
            await resize()
            await drawChart()
        }})
        watch(() => [store.state.plotSelections.timeSeries, props.pageNumber], () => {
            if (!props.layout.isModal) drawChart()
        });

        return {
            chart,
            resize
        }
    }
});
</script>
