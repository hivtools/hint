<template>
    <div>
        <div ref="chart" style="width:100%; height:100%;"></div>
    </div>
</template>

<script lang="ts">
    import Plotly from "plotly.js";
    import Vue from "vue";
    import jsonata from "jsonata";
    import {Dict} from "../../types";

    interface Props {
        chartMetadata: string,
        chartData: Dict<unknown[]>,
        layoutData: Dict<unknown>
    }

    interface Computed {
        inputData: Dict<unknown>,
        data: {
            data: unknown,
            layout: Dict<unknown>,
            config: unknown
        }
    }

    interface Methods {
        drawChart: () => void
    }

    export default Vue.extend<unknown, Methods, Computed, Props>( {
        name: "Plotly",
        props: {
            chartMetadata: String,
            chartData: Object,
            layoutData: Object
        },
        computed: {
            inputData(){
                return {
                    ...this.chartData,
                    ...this.layoutData
                };
            },
            data() {
                const j = jsonata(this.chartMetadata)
                const results = j.evaluate(this.inputData);
                return results
            }
        },
        methods: {
            drawChart() {
                const el = this.$refs.chart;
                console.log("DATA: " + JSON.stringify(this.data.data))
                console.log("LAYOUT:" + JSON.stringify(this.data.layout))
                Plotly.newPlot(el as HTMLElement, this.data.data as any, this.data.layout, this.data.config as any);
            }
        },
        mounted() {
            this.drawChart();
        },
        watch: {
            data: function() {
                this.drawChart();
            }
        }
    });
</script>
