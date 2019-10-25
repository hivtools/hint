<template>
    <div>
        <div class="row">
            <div class="col">
                <ul class="nav nav-tabs col-md-12">
                    <li v-for="tab in tabs" class="nav-item">
                        <a class="nav-link" :class="selectedTab === tab ? 'active' :  ''" v-on:click="selectTab(tab)">{{tab}}</a>
                    </li>
                </ul>
            </div>
        </div>
        <div class="row mt-2">
            <div v-if="selectedTab==='Map'" class="col-md-3">
                <choropleth-filters></choropleth-filters>
            </div>
            <div v-if="selectedTab==='Map'" class="col-md-9">
                <choropleth></choropleth>
            </div>

            <div class="col-md-12" :display="selectedTab==='Bar' ? '' : 'none'">
                <barchart :chartdata="chartdata" :filters="barchartFilters" :indicators="barchartIndicators"></barchart>
            </div>
        </div>
    </div>
</template>

<script lang="ts">

    import Vue from "vue";
    import Choropleth from "../plots/Choropleth.vue";
    import ChoroplethFilters from "../plots/ChoroplethFilters.vue";
    import Barchart from "../plots/barchart/Barchart.vue";
    import {DataType} from "../../store/filteredData/filteredData";
    import {mapActionsByNames, mapGettersByNames, mapStateProp, mapStatePropByName} from "../../utils";
    import {BarchartIndicator, Filter} from "../../types";
    import {BaselineState} from "../../store/baseline/baseline";
    import {ModelRunState} from "../../store/modelRun/modelRun";
    import {ModelResultResponse} from "../../generated";

    const namespace: string = 'filteredData';

    const tabs = ["Map", "Bar"];

    interface Data {
        tabs: string[],
        selectedTab: string
    }

    interface Methods {
        selectDataType: (dataType: DataType) => void,
        selectTab: (tab: string) => void
    }

    interface Computed {
        barchartFilters: Filter[],
        barchartIndicators: BarchartIndicator[],
        chartdata: any
    }

    export default Vue.extend<Data, Methods, Computed, {}>({
        name: "ModelOutput",
        created() {
            this.selectDataType(DataType.Output)
        },
        data: () => {
            return {
                tabs: tabs,
                selectedTab: tabs[0]
            }
        },
        computed: {
            ...mapGettersByNames("modelOutput", ["barchartFilters", "barchartIndicators"]),
            chartdata: mapStateProp<ModelRunState, any>("modelRun", state => {
                return state.result ? state.result.data : [];
            })
        },
        methods: {
            ...mapActionsByNames<keyof Methods>(namespace, ["selectDataType"]),
            selectTab: function(tab: string){
                this.selectedTab = tab;
            }
        },
        components: {
            Choropleth,
            ChoroplethFilters,
            Barchart
        }
    })
</script>