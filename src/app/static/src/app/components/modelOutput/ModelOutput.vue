<template>
    <div>
        <div class="row">
            <div class="col">
                <ul class="nav nav-tabs col-md-12">
                    <li v-for="tab in tabs" class="nav-item">
                        <a class="nav-link"
                           :class="selectedTab === tab ? 'active' :  ''"
                           v-on:click="tabSelected(tab)" v-translate="tab">
                        </a>
                    </li>
                </ul>
            </div>
        </div>
        <div class="row mt-2">
            <div v-if="selectedTab==='map'" id="choropleth-container" class="col-md-12">
                <choropleth :chartdata="chartdata"
                            :filters="choroplethFilters"
                            :features="features"
                            :feature-levels="featureLevels"
                            :indicators="choroplethIndicators"
                            :selections="choroplethSelections"
                            area-filter-id="area"
                            v-on:update="updateOutputChoroplethSelections({payload: $event})"></choropleth>
            </div>

            <div id="barchart-container" :class="selectedTab==='bar' ? 'col-md-12' : 'd-none'">
                <bar-chart-with-filters
                        :chart-data="chartdata"
                        :filter-config="filterConfig"
                        :indicators="barchartIndicators"
                        :selections="barchartSelections"
                        v-on:update="updateBarchartSelections({payload: $event})"></bar-chart-with-filters>
            </div>

            <div v-if="selectedTab==='bubble'" id="bubble-plot-container" class="col-md-12">
                <bubble-plot :chartdata="chartdata" :features="features" :featureLevels="featureLevels"
                             :filters="bubblePlotFilters" :indicators="bubblePlotIndicators"
                             :selections="bubblePlotSelections"
                             area-filter-id="area"
                             v-on:update="updateBubblePlotSelections({payload: $event})"></bubble-plot>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import i18next from "i18next";
    import Vue from "vue";
    import Choropleth from "../plots/choropleth/Choropleth.vue";
    import BubblePlot from "../plots/bubble/BubblePlot.vue";
    import {BarchartIndicator, Filter} from "@reside-ic/vue-charts/src/bar/types";
    import {BarChartWithFilters, FilterConfig} from "@reside-ic/vue-charts";

    import {mapGettersByNames, mapMutationByName, mapMutationsByNames, mapStateProp, mapStateProps,} from "../../utils";
    import {ModelRunState} from "../../store/modelRun/modelRun";
    import {
        BarchartSelections,
        BubblePlotSelections,
        ChoroplethSelections,
        PlottingSelectionsState
    } from "../../store/plottingSelections/plottingSelections";
    import {ModelOutputState} from "../../store/modelOutput/modelOutput";
    import {ModelOutputMutation} from "../../store/modelOutput/mutations";
    import {Feature} from "geojson";
    import {BaselineState} from "../../store/baseline/baseline";
    import {Language, Translations} from "../../store/translations/locales";
    import {inactiveFeatures} from "../../main";
    import {RootState} from "../../root";
    import {LevelLabel} from "../../types";

    const namespace: string = 'filteredData';

    interface Data {
        tabs: string[]
    }

    interface Methods {
        tabSelected: (tab: string) => void
        updateBarchartSelections: (data: BarchartSelections) => void
        updateBubblePlotSelections: (data: BubblePlotSelections) => void
    }

    interface Computed {
        barchartFilters: Filter[],
        bubblePlotFilters: Filter[],
        choroplethFilters: Filter[],
        barchartIndicators: BarchartIndicator[],
        chartdata: any,
        barchartSelections: BarchartSelections,
        bubblePlotSelections: BubblePlotSelections,
        choroplethSelections: ChoroplethSelections,
        selectedTab: string,
        features: Feature[],
        featureLevels: LevelLabel[]
        currentLanguage: Language,
        filterConfig: FilterConfig
    }

    export default Vue.extend<Data, Methods, Computed, {}>({
        name: "ModelOutput",
        created() {
            if (!this.selectedTab) {
                this.tabSelected(this.tabs[0]);
            }
        },
        data: () => {
            const tabs: (keyof Translations)[] = ["map", "bar"];

            if (!inactiveFeatures.includes("BubblePlot")) {
                tabs.push("bubble");
            }

            return {
                tabs: tabs
            }
        },
        computed: {
            ...mapGettersByNames("modelOutput", [
                "barchartFilters", "barchartIndicators",
                "bubblePlotFilters", "bubblePlotIndicators",
                "choroplethFilters", "choroplethIndicators"]),
            selectedTab: mapStateProp<ModelOutputState, string>("modelOutput", state => state.selectedTab),
            chartdata: mapStateProp<ModelRunState, any>("modelRun", state => {
                return state.result ? state.result.data : [];
            }),
            barchartSelections() {
                return this.$store.state.plottingSelections.barchart
            },
            ...mapStateProps<PlottingSelectionsState, keyof Computed>("plottingSelections", {
                barchartSelections: state => state.barchart,
                bubblePlotSelections: state => state.bubble,
                choroplethSelections: state => state.outputChoropleth
            }),
            ...mapStateProps<BaselineState, keyof Computed>("baseline", {
                    features: state => state.shape!!.data.features as Feature[],
                    featureLevels: state => state.shape!!.filters.level_labels || []
                }
            ),
            currentLanguage: mapStateProp<RootState, Language>(null,
                (state: RootState) => state.language),
            filterConfig() {
                return {
                    filterLabel: i18next.t("filters", this.currentLanguage),
                    indicatorLabel: i18next.t("indicator", this.currentLanguage),
                    xAxisLabel: i18next.t("xAxis", this.currentLanguage),
                    disaggLabel: i18next.t("disaggBy", this.currentLanguage),
                    filters: this.barchartFilters
                }
            }
        },
        methods: {
            ...mapMutationsByNames<keyof Methods>("plottingSelections",
                ["updateBarchartSelections", "updateBubblePlotSelections", "updateOutputChoroplethSelections"]),
            tabSelected: mapMutationByName<keyof Methods>("modelOutput", ModelOutputMutation.TabSelected)
        },
        components: {
            BarChartWithFilters,
            BubblePlot,
            Choropleth
        }
    })
</script>