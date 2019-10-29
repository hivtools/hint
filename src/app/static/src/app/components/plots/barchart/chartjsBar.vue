<script lang="ts">
    import Vue from "vue";
    import { Bar } from 'vue-chartjs'
    import ErrorBarsPlugin from 'chartjs-plugin-error-bars'
    export default Vue.extend({
        extends: Bar,
        name: "ChartjsBar",
        props: {
            chartdata: {
                type: Object,
                default: null
            },
            xLabel: String,
            yLabel: String
        },
        methods: {
            updateRender: function(){
                (this as any).addPlugin(ErrorBarsPlugin as any);
                (this as any).renderChart(this.chartdata, {
                    scales: {
                        yAxes: [{
                            scaleLabel: {
                                display: true,
                                labelString: this.yLabel
                            },
                            ticks: {
                                beginAtZero: true
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
                    responsive:true,
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
            }
        },
        mounted () {
            this.updateRender();
        },
        watch: {
            chartdata: function(newVal) {
                this.updateRender();
            }
        }
    });
</script>