<template>
    <div>
        <hr />
        <h3>Review calibration results</h3>
        <p class="text-muted">Comparison of unadjusted estimates (uncalibrated) to model estimates calibrated to spectrum results as specified in calibration options above. ​</p>
        <!-- <bar-chart-with-filters
            :chart-data="chartData.data"
            :filter-config="chartData.plottingMetadata.barchart"
            :indicators="chartData.plottingMetadata.barchart.indicators"
            :selections="chartData.plottingMetadata.barchart.defaults"
            :formatFunction="formatBarchartValue"
        ></bar-chart-with-filters> -->
        <bar-chart-with-filters
            :chart-data="chartData.data"
            :filter-config="filterConfig()"
            :indicators="chartData.plottingMetadata.barchart.indicators"
            :selections="chartData.plottingMetadata.barchart.defaults"
        ></bar-chart-with-filters>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {BarchartIndicator, Filter} from "@reside-ic/vue-charts/src/bar/types";
import {BarChartWithFilters, FilterConfig, FilterOption} from "@reside-ic/vue-charts";
import {mapGettersByNames, mapMutationByName, mapMutationsByNames, mapStateProp, mapStateProps,} from "../../utils";
import {ModelCalibrateState} from "../../store/modelCalibrate/modelCalibrate";
import {formatOutput} from "../plots/utils";

const namespace = "modelCalibrate";

export default Vue.extend({
    name: "CalibrationResults",
    components: {
        BarChartWithFilters
    },
    computed: {
        chartData: mapStateProp<ModelCalibrateState, any>(namespace, state => {
            console.log("chart data1", state.chartData )
            return state.chartData ? state.chartData.data : [];
        }),
    },
    methods: {
        formatBarchartValue: (value: string | number, indicator: BarchartIndicator) => {
            return formatOutput(value, indicator.format, indicator.scale, indicator.accuracy).toString();
        },
        filterConfig() {
                return {
                    filterLabel: "filters",
                    indicatorLabel: "indicator",
                    xAxisLabel: "xaxis",
                    disaggLabel: "disagg",
                    filters: this.chartData.plottingMetadata.barchart.filters
                }
            }
    },
    mounted(){
        console.log("chart data2", this.chartData)
        console.log("indicators", this.chartData.plottingMetadata.barchart.indicators)
        console.log("filterConfig", this.filterConfig())
        console.log("selections", this.chartData.plottingMetadata.barchart.defaults)
    }
})
</script>