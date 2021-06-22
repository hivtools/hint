<template>
    <div>
        <hr />
        <h3 v-translate="'calibrateResultsHeader'"></h3>
        <p class="text-muted" v-translate="'calibrateResultsDesc'"></p>
        <bar-chart-with-filters
            :chart-data="chartData"
            :filter-config="filterConfig"
            :indicators="indicators"
            :selections="selections"
            :formatFunction="formatBarchartValue"
            @update="updateCalibratePlotSelections({ payload: $event })"
        ></bar-chart-with-filters>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import i18next from "i18next";
import { Language, Translations } from "../../store/translations/locales";
import { BarchartIndicator, Filter } from "@reside-ic/vue-charts/src/bar/types";
import {
    BarChartWithFilters,
    FilterConfig,
    FilterOption,
} from "@reside-ic/vue-charts";
import {
    mapGettersByNames,
    mapMutationByName,
    mapMutationsByNames,
    mapStateProp,
    mapStateProps,
} from "../../utils";
import {
    PlottingSelectionsState,
    BarchartSelections,
    UnadjustedBarchartSelections,
} from "../../store/plottingSelections/plottingSelections";
import { ModelCalibrateState } from "../../store/modelCalibrate/modelCalibrate";
import { formatOutput } from "../plots/utils";
import { RootState } from "../../root";
import { PayloadWithType } from "../../types";

const namespace = "modelCalibrate";

interface Methods {
    updateCalibratePlotSelections: (data: {
        payload: BarchartSelections;
    }) => void;
    formatBarchartValue: (
        value: string | number,
        indicator: BarchartIndicator
    ) => string;
}

interface Computed {
    calibratePlotDefaultSelections: UnadjustedBarchartSelections;
    allData: any;
    chartData: any;
    filterConfig: FilterConfig;
    filters: Filter[];
    selections: BarchartSelections;
    indicators: BarchartIndicator[];
    filteredIndicators: BarchartIndicator[];
    currentLanguage: Language;
}

export default Vue.extend<unknown, Methods, Computed, unknown>({
    name: "CalibrationResults",
    components: {
        BarChartWithFilters,
    },
    computed: {
        ...mapGettersByNames(namespace, ["indicators", "filters"]),
        ...mapGettersByNames("plottingSelections", [
            "calibratePlotDefaultSelections",
        ]),
        ...mapStateProps<PlottingSelectionsState, keyof Computed>(
            "plottingSelections",
            {
                selections: (state) => state.calibratePlot,
            }
        ),
        allData: mapStateProp<ModelCalibrateState, any>(namespace, (state) => {
            return state.calibratePlotResult ? state.calibratePlotResult : [];
        }),
        chartData: mapStateProp<ModelCalibrateState, any>(
            namespace,
            (state) => {
                return state.calibratePlotResult
                    ? state.calibratePlotResult.data
                    : [];
            }
        ),
        filterConfig() {
            return {
                filterLabel: i18next.t("filters", this.currentLanguage),
                indicatorLabel: i18next.t("indicator", this.currentLanguage),
                xAxisLabel: i18next.t("xAxis", this.currentLanguage),
                disaggLabel: i18next.t("disaggBy", this.currentLanguage),
                filters: this.filters,
            };
        },
        selections() {
            return this.$store.state.plottingSelections.calibratePlot;
        },
        filteredIndicators() {
            return this.indicators.filter(
                (val: BarchartIndicator) =>
                    val.indicator === this.selections.indicatorId
            );
        },
        currentLanguage: mapStateProp<RootState, Language>(
            null,
            (state: RootState) => state.language
        ),
    },
    methods: {
        ...mapMutationsByNames("plottingSelections", [
            "updateCalibratePlotSelections",
        ]),
        formatBarchartValue: (
            value: string | number,
            indicator: BarchartIndicator
        ) => {
            return formatOutput(
                value,
                indicator.format,
                indicator.scale,
                indicator.accuracy
            ).toString();
        },
    },
    mounted() {
        // console.log("pre selections", this.selections)
        // console.log("pre default selections", this.calibratePlotDefaultSelections)
        const data: BarchartSelections = {
            ...this.calibratePlotDefaultSelections,
            selectedFilterOptions: {
                ...this.calibratePlotDefaultSelections.selected_filter_options,
            },
            indicatorId: this.calibratePlotDefaultSelections.indicator_id,
            xAxisId: "spectrumRegionName", //defaults.x_axis_id,
            disaggregateById: "dataType", //defaults.disaggregate_by_id
        };
        data.selectedFilterOptions["sex"] = [{ id: "male", label: "Male" }];
        data.selectedFilterOptions["dataType"] = [
            { id: "spectrum", label: "spectrum" },
            { id: "unadjusted", label: "unadjusted" },
            { id: "calibrated", label: "calibrated" },
        ];
        data.selectedFilterOptions["spectrumRegionName"] = [
            { id: "Northern", label: "Northern" },
            { id: "Southern", label: "Southern" },
        ];
        this.updateCalibratePlotSelections({ payload: data });
        // console.log("post selections", this.selections)
        // console.log("post default selections", this.calibratePlotDefaultSelections)
        // console.log("alldata", this.allData);
        // console.log("chartData", this.chartData);
        // console.log("indicators", this.indicators);
        // console.log("filtered indicators", this.filteredIndicators);
        // console.log("filterConfig", this.filterConfig);
        // console.log("selections", this.selections);
        // console.log("filters", this.filters);
    },
});
</script>