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

            <div class="col" v-if="selectedTab==='Bar'">
                Bar chart coming soon!
            </div>
        </div>
    </div>
</template>

<script lang="ts">

    import Vue from "vue";
    import {mapActions} from "vuex";
    import Choropleth from "../plots/Choropleth.vue";
    import ChoroplethFilters from "../plots/ChoroplethFilters.vue";
    import {DataType} from "../../store/filteredData/filteredData";
    import {mapActionsByNames} from "../../utils";

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

    export default Vue.extend<Data, Methods, {}, {}>({
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
        methods: {
            ...mapActionsByNames<keyof Methods>(namespace, ["selectDataType"]),
            selectTab: function(tab: string){
                this.selectedTab = tab;
            }
        },
        components: {
            Choropleth,
            ChoroplethFilters
        }
    })
</script>