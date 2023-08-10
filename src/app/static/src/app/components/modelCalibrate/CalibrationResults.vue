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
            :x-axis-config="{
                    fixed: true,
                    hideFilter: true,
                }"
            :disaggregate-by-config="{
                    fixed: true,
                    hideFilter: true,
                }"
            @update:selections="updateCalibratePlotSelections({ payload: $event })"
        ></bar-chart-with-filters>
    </div>
</template>

<script lang="ts">
    import { defineComponentVue2 } from "../../defineComponentVue2/defineComponentVue2";
    import i18next from "i18next";
    import { Language, Translations } from "../../store/translations/locales";
    import {
        BarchartIndicator,
        Filter,
        FilterConfig
    } from "../../vue-chart/src/bar/types";
    import BarChartWithFilters from "../../vue-chart/src/bar/BarChartWithFilters.vue";
    import {
        mapGettersByNames,
        mapMutationByName,
        mapMutationsByNames,
        mapStateProp,
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
        chartData: any;
        filterConfig: FilterConfig;
        filters: Filter[];
        selections: BarchartSelections;
        indicators: BarchartIndicator[];
        currentLanguage: Language;
    }

    export default defineComponentVue2<unknown, Methods, Computed>({
        name: "CalibrationResults",
        components: {
            BarChartWithFilters,
        },
        computed: {
            ...mapGettersByNames(namespace, ["indicators", "filters"]),
            ...mapGettersByNames("modelCalibrate", [
                "calibratePlotDefaultSelections",
            ]),
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
            currentLanguage: mapStateProp<RootState, Language>(
                null,
                (state: RootState) => state.language
            ),
        },
        methods: {
            ...mapMutationsByNames<"updateCalibratePlotSelections">("plottingSelections", [
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
            const {
                selected_filter_options,
                indicator_id,
                x_axis_id,
                disaggregate_by_id,
            } = this.calibratePlotDefaultSelections;
            const data: BarchartSelections = {
                selectedFilterOptions: selected_filter_options,
                indicatorId: indicator_id,
                xAxisId: x_axis_id,
                disaggregateById: disaggregate_by_id,
            };
            this.updateCalibratePlotSelections({ payload: data });
        },
    });
</script>