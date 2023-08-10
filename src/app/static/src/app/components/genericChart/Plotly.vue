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
    import jsonata from "jsonata";
    import LoadingSpinner from "../LoadingSpinner.vue";
    import { PropType, defineComponent } from "vue";
import { Dict } from "../../types";

    export default defineComponent({
        name: "Plotly",
        props: {
            chartMetadata: {
                type: String,
                required: true
            },
            chartData: {
                type: Object as PropType<Dict<unknown[]> | null>,
                required: true
            },
            layoutData: {
                type: Object as PropType<Dict<unknown>>,
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
                } as any;
            }
        },
        methods: {
            drawChart: async function() {
                this.rendering = true;
                const el = this.$refs.chart;
                const drawFunc = this.layoutRequired ? Plotly.newPlot : Plotly.react;
                this.layoutRequired = false;
                await drawFunc(el as HTMLElement, this.data.data, this.data.layout, {...this.data.config as any});
                this.rendering = false;
            }
        },
        async mounted() {
            await this.drawChart();
        },
        watch: {
            data: {
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
