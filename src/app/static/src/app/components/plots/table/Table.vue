<template>
<div>
    <h3>Selections</h3>
    <div>{{ selections }}</div>
    <h3>Stuff</h3>
    <!-- <div>{{ filterData() }}</div> -->
<!-- <ul>
        <h3>Selections</h3>
        <li v-for="x in selections">{{ x }}</li>
        <h3>Filters</h3>
        <li v-for="x in filters">{{ x }}</li>
    </ul> -->
    <h3>Table</h3>
<table>
         <tr>
             <th v-for="(v, k, i) in tabledata[0]">{{ k }}</th>
        </tr>
        <tr v-for="x in tabledata">
            <td v-for="z in x">{{ z }}</td>
        </tr>
    </table>
</div>
    
    
</template>

<script lang="ts">
import Vue from "vue";
import Filters from "../Filters.vue";
import {getColor, iterateDataValues} from "../utils";
import {ChoroplethIndicatorMetadata, FilterOption} from "../../../generated";
import {Dict, Filter, IndicatorValuesDict, NumericRange} from "../../../types";
import {
        ChoroplethSelections,
        ColourScaleSelections,
        ColourScaleSettings,
        ColourScaleType
    } from "../../../store/plottingSelections/plottingSelections";
import {flattenOptions, flattenToIdSet} from "../../../utils";
// import featureIndicators from "src/app/static/src/app/components/plots/choropleth/Choropleth.vue"

interface Props {
        tabledata: any[],
        indicators: ChoroplethIndicatorMetadata[],
        selections: ChoroplethSelections
        // filters: Filter[],
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

// export default Vue.extend<Props>({
export default Vue.extend<{}, {}, {}, Props>({
    name: "table-view",
    props: props,
    mounted() {
    console.log('filterdata2', this.selections)
  },
    // data(): Data {
    data() {
      return {
        //   sel: this.selections
      }
    },
    computed: {
        // nonAreaFilters() {
        //         return this.filters.filter((f: Filter) => f.id != this.areaFilterId);
        //     },
        // colorIndicator(): ChoroplethIndicatorMetadata {
        //         return this.indicators.find(i => i.indicator == this.selections.indicatorId)!!;
        //     },
        // areaFilter() {
        //         return this.filters.find((f: Filter) => f.id == this.areaFilterId)!!;
        //     },
        // selectedAreaFilterOptions() {
        //         const selectedOptions = this.selections.selectedFilterOptions[this.areaFilterId];
        //         if (selectedOptions && selectedOptions.length > 0) {
        //             return selectedOptions
        //         }
        //         return this.areaFilter ? this.areaFilter.options : []; //consider all top level areas to be selected if none are
        //     },
        // flattenedAreas() {
        //         return this.areaFilter ? flattenOptions(this.areaFilter.options) : {};
        //     },
        // selectedAreaIds() {
        //         const selectedAreaIdSet = flattenToIdSet(this.selectedAreaFilterOptions.map(o => o.id), this.flattenedAreas);

        //         //Should also ensure include top level (country) included if no filters selected
        //         const selectedOptions = this.selections.selectedFilterOptions[this.areaFilterId];
        //         if (!selectedOptions || selectedOptions.length == 0) {
        //             this.currentLevelFeatureIds.forEach(id => selectedAreaIdSet.add(id));
        //         }

        //         return Array.from(selectedAreaIdSet);
        //     },


        filterData(indicatorMeta: ChoroplethIndicatorMetadata, selectedFilterValues: Dict<FilterOption[]>) {
            const result = {}
            iterateDataValues(this.tabledata, this.colorIndicator, this.selectedAreaIds, this.nonAreaFilters, this.selections.selectedFilterOptions,
        (areaId: string, indicatorMeta: ChoroplethIndicatorMetadata, value: number) => {
            // result[areaId] = {
            //     value: value
            // }
        })
        console.log('filterdata', result)
        return result
        }

    //     filterData2(){
    //         const getFeatureIndicator = function (tabledata: any[],
    //                                          selectedAreaIds: string[],
    //                                          indicatorMeta: ChoroplethIndicatorMetadata,
    //                                          colourRange: NumericRange,
    //                                          filters: Filter[],
    //                                          selectedFilterValues: Dict<FilterOption[]>): IndicatorValuesDict {

    // const result = {} as IndicatorValuesDict;
    // iterateDataValues(tabledata, [indicatorMeta], selectedAreaIds, filters, selectedFilterValues,
    //     (areaId: string, indicatorMeta: ChoroplethIndicatorMetadata, value: number) => {
    //         result[areaId] = {
    //             value: value,
    //             color: getColor(value, indicatorMeta, colourRange)
    //         }
    //     });
    // console.log('filterdata2', result)
    // return result;
    //         }
    //     return getFeatureIndicator
    //     }
    }
});
</script>