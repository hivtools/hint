<template>
<div v-if="filteredData.length > 0">
    <h3>Table</h3>
    <table>
         <tr>
             <th>Area</th>
             <th>{{ filteredData[0]['indicatorMeta']['name'] }}</th>
             <th v-for="(options, key) in selectedFilterOptions" v-if="options.length > 0">{{ key.charAt(0).toUpperCase() + key.slice(1) }}</th>
             <!-- <th v-for="options in selectedFilterOptions">{{ options.label }}</th> -->
        </tr>
        <tr v-for="x in filteredData">
            <td>{{ flattenedAreas[x['areaId']]['label'] }}</td>
            <td>{{ x['value'] }}</td>
            <td v-for="(options, key) in selectedFilterOptions" v-if="options.length > 0 && key !== 'area'">{{ options[0]['label'] }}</td>
        </tr>
    </table>
    <!-- <h3>flattenedAreas</h3>
    <div>{{ flattenedAreas }}</div> -->
    <h3>filteredData</h3>
    <ul>
        <li v-for="x in filteredData">{{ x }}</li>
    </ul>
    <!-- <div>{{ filteredData }}</div> -->
    <!-- <h3>Filters</h3>
    <div>{{ filters }}</div>
    <h3>Indicators</h3>
    <div>{{ indicators }}</div>
    <h3>areafilterid</h3>
    <div>{{ areaFilterId }}</div> -->
    <h3>selectedfilter options</h3>
    <div>{{ selectedFilterOptions }}</div>
    <!-- <h3>selections</h3>
    <div>{{ selections }}</div>
    <h3>table data</h3>
    <div>{{ tabledata }}</div> -->
</div>
    
    
</template>

<script lang="ts">
import Vue from "vue";
import Filters from "../Filters.vue";
import {getColor, iterateDataValues} from "../utils";
import {ChoroplethIndicatorMetadata, FilterOption, NestedFilterOption} from "../../../generated";
import {Dict, Filter, IndicatorValuesDict, NumericRange} from "../../../types";
import {
        ChoroplethSelections,
        ColourScaleSelections,
        ColourScaleSettings,
        ColourScaleType
    } from "../../../store/plottingSelections/plottingSelections";
import {flattenOptions, flattenToIdSet} from "../../../utils";

interface Props {
        tabledata: any[],
        indicators: ChoroplethIndicatorMetadata[],
        selections: ChoroplethSelections,
        filters: Filter[],
        areaFilterId: string
}

interface Computed {
    nonAreaFilters: Filter[],
    areaFilter: Filter,
    filteredData: any[],
    flattenedAreas: Dict<NestedFilterOption>,
    selectedAreaIds: string[],
    selectedAreaFilterOptions: FilterOption[],
}

const props = {
    tabledata: {
        type: Array
    },
    filters: {
        type: Array
    },
    indicators: {
            type: Array
        },
    areaFilterId: {
        type: String
    },
    selectedFilterOptions: {
        type: Object
    },
    selections: {
        type: Object
    }
}



export default Vue.extend<{}, {}, Computed, Props>({
    name: "table-view",
    props: props,
    // data(): Data {
    data() {
      return {
      }
    },
    mounted(){
    console.log('selections', this.selections)
    },
    computed: {
        nonAreaFilters() {
             return this.filters.filter((f: Filter) => f.id != this.areaFilterId);
         },
        areaFilter() {
                 return this.filters.find((f: Filter) => f.id == this.areaFilterId)!!;
             },
        flattenedAreas() {
                 return this.areaFilter ? flattenOptions(this.areaFilter.options) : {};
             },
        selectedAreaIds() {
            const selectedAreaIdSet = flattenToIdSet(this.selectedAreaFilterOptions.map(o => o.id), this.flattenedAreas);
            return Array.from(selectedAreaIdSet);
        },
        selectedAreaFilterOptions() {
            const selectedOptions = this.selections.selectedFilterOptions[this.areaFilterId];
            if (selectedOptions && selectedOptions.length > 0) {
                return selectedOptions
            }
            return this.areaFilter ? this.areaFilter.options : []; //consider all top level areas to be selected if none are
        },
        filteredData() {
            const result: any[] = [];
            iterateDataValues(this.tabledata,
                this.indicators,
                this.selectedAreaIds,
                this.nonAreaFilters,
                this.selections.selectedFilterOptions,
                (areaId: string, indicatorMeta: ChoroplethIndicatorMetadata, value: number) => {
                    result.push({areaId, indicatorMeta, value});
                });
            console.log('filterdata', result)
            // return result;
            const filterByIndicator = result.filter(row => row.indicatorMeta.indicator === this.selections.indicatorId)
            const filterByDetail = filterByIndicator.filter(row => row.areaId[4] == this.selections.detail)
            return filterByDetail
        }
        // filterByIndicator() {
        //     return this.filteredData().filter(row => row.indicatorMeta.indicatorMeta === this.selections.indicatorId)
        // }
    }
});
</script>
