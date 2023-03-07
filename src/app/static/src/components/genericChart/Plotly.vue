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
    import {defineComponent, StyleValue} from "vue";
    import type { PropType } from "vue";
    import jsonata from "jsonata";
    import {Dict} from "../../types";
    import LoadingSpinner from "../LoadingSpinner.vue";

    interface Data {
        rendering: boolean,
        layoutRequired: boolean
    }

    interface Props {
        [key: string]: any
        chartMetadata: string,
        chartData: Dict<unknown[]>,
        layoutData: Dict<unknown>
    }

    interface Computed {
        [key: string]: any
        inputData(): Dict<unknown>,
        data(): {
            data: unknown,
            layout: Dict<unknown>,
            config: unknown
        },
        style(): StyleValue
    }

    interface Methods {
        [key: string]: any
        drawChart: () => void
    }

    export default defineComponent<Props, unknown, Data, Computed, Methods>({
        name: "Plotly",
        components: {
            LoadingSpinner
        },
        data() {
            return {
                rendering: false,
                layoutRequired: false
            };
        },
        computed: {
            inputData(){
                return {
                    ...this.chartData,
                    ...this.layoutData
                };
            },
            data() {
                const j = jsonata(this.chartMetadata);
                const results = j.evaluate(this.inputData);
                return results
            },
            style() {
                return {
                    width:'100%',
                    height: '100%',
                    visibility: this.rendering ? 'hidden' : 'visible'
                };
            }
        },
        methods: {
            drawChart: function() {
                this.rendering = true;
                setTimeout(() => {
                    try {
                        const el = this.$refs.chart;
                        const drawFunc = this.layoutRequired ? Plotly.newPlot : Plotly.react;
                        this.layoutRequired = false;
                        drawFunc(el as HTMLElement, this.data.data as any, this.data.layout, this.data.config as any);
                    }
                    finally {
                        this.rendering = false;
                    }
                }, 0);
            }
        },
        mounted() {
            this.drawChart();
        },
        watch: {
            data: function() {
                this.drawChart();
            },
            layoutData: function(newVal, oldVal) {
                if (oldVal.subplots && newVal.subplots && oldVal.subplots.rows != newVal.subplots.rows) {
                    this.layoutRequired = true;
                }
            }
        }
    });
</script>
