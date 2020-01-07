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
            <div v-if="selectedTab==='map'" class="col-md-3">
                <choropleth-filters></choropleth-filters>
            </div>
            <div v-if="selectedTab==='map'" class="col-md-9">
                <choropleth></choropleth>
            </div>

            <div id="barchart-container" :class="selectedTab==='bar' ? 'col-md-12' : 'd-none'">
                <barchart :chartdata="chartdata" :filters="barchartFilters" :indicators="barchartIndicators"
                          :selections="barchartSelections"
                          v-on:update="updateBarchartSelections({payload: $event})"></barchart>
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

    import Vue from "vue";
    import Choropleth from "../plots/Choropleth.vue";
    import ChoroplethFilters from "../plots/ChoroplethFilters.vue";
    import Barchart from "../plots/barchart/Barchart.vue";
    import BubblePlot from "../plots/bubble/BubblePlot.vue";
    import {DataType} from "../../store/filteredData/filteredData";
    import {
        mapActionsByNames,
        mapGettersByNames,
        mapMutationByName,
        mapMutationsByNames,
        mapStateProp, mapStatePropByName, mapStateProps,
    } from "../../utils";
    import {BarchartIndicator, Filter, LevelLabel} from "../../types";
    import {ModelRunState} from "../../store/modelRun/modelRun";
    import {
        BarchartSelections,
        BubblePlotSelections,
        PlottingSelectionsState
    } from "../../store/plottingSelections/plottingSelections";
    import {ModelOutputState} from "../../store/modelOutput/modelOutput";
    import {ModelOutputMutation} from "../../store/modelOutput/mutations";
    import {Feature} from "geojson";
    import {BaselineState} from "../../store/baseline/baseline";
    import {Translations} from "../../store/translations/locales";
    import {inactiveFeatures} from "../../main";

    const namespace: string = 'filteredData';

    interface Data {
        tabs: string[]
    }

    interface Methods {
        selectDataType: (dataType: DataType) => void,
        tabSelected: (tab: string) => void
        updateBarchartSelections: (data: BarchartSelections) => void
        updateBubblePlotSelections: (data: BubblePlotSelections) => void
    }

    interface Computed {
        barchartFilters: Filter[],
        bubblePlotFilters: Filter[],
        barchartIndicators: BarchartIndicator[],
        chartdata: any,
        barchartSelections: BarchartSelections,
        bubblePlotSelections: BubblePlotSelections,
        selectedTab: string,
        features: Feature[],
        featureLevels: LevelLabel[]
    }

    export default Vue.extend<Data, Methods, Computed, {}>({
        name: "ModelOutput",
        created() {
            this.selectDataType(DataType.Output);

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
                "bubblePlotFilters", "bubblePlotIndicators"]),
            selectedTab: mapStateProp<ModelOutputState, string>("modelOutput", state => state.selectedTab),
            chartdata: mapStateProp<ModelRunState, any>("modelRun", state => {
                return state.result ? state.result.data : [];
            }),
            ...mapStateProps<PlottingSelectionsState, keyof Computed>("plottingSelections", {
                barchartSelections: state => state.barchart,
                bubblePlotSelections: state => state.bubble
            }),
            ...mapStateProps<BaselineState, keyof Computed>("baseline", {
                    features: state => state.shape!!.data.features as Feature[],
                    featureLevels: state => state.shape!!.filters.level_labels || []
                }
            ),
        },
        methods: {
            ...mapActionsByNames<keyof Methods>(namespace, ["selectDataType"]),
            ...mapMutationsByNames<keyof Methods>("plottingSelections", ["updateBarchartSelections", "updateBubblePlotSelections"]),
            tabSelected: mapMutationByName<keyof Methods>("modelOutput", ModelOutputMutation.TabSelected)
        },
        components: {
            Choropleth,
            ChoroplethFilters,
            Barchart,
            BubblePlot
        }
    })
</script>