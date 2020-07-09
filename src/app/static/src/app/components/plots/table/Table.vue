<template>
    <div>
        <br>
        <div v-if="filteredData.length > 0">
            <!-- <h3>Table</h3> -->
            <table>
                <tr>
                    <th>Area</th>
                    <th>{{ filteredData[0]['indicatorMeta']['name'] }}</th>
                    <th v-for="(value, key) in filteredData[0]['filter']">{{ key === 'survey' ? 'Household survey' : key.charAt(0).toUpperCase() + key.slice(1) }}</th>
                </tr>
                <tr v-for="row in filteredData">
                    <td :style="styleObject">{{ flattenedAreas[row['areaId']]['label'] }}</td>
                    <td :style="styleObject">{{ row['value'] }}</td>
                    <td :style="styleObject" v-for="(value2, key2) in row['filter']">{{ value2[0]['label'] }}</td>
                </tr>
            </table>
            <!-- <h3>flattenedAreas</h3>
            <div>{{ flattenedAreas }}</div> -->
            <!-- <h3>filteredData</h3>
            <ul>
                <li v-for="x in filteredData">{{ x }}</li>
            </ul> -->
            <!-- <div>{{ filteredData }}</div> -->
            <!-- <h3>Filters</h3>
            <div>{{ filters }}</div>
            <h3>Indicators</h3>
            <div>{{ indicators }}</div>
            <h3>areafilterid</h3>
            <div>{{ areaFilterId }}</div> -->
            <!-- <h3>selectedfilter options</h3>
            <div>{{ selectedFilterOptions }}</div> -->
            <!-- <h3>selections</h3>
            <div>{{ selections }}</div>
            <h3>table data</h3>
            <div>{{ tabledata }}</div> -->
        </div>
        <div v-else>No data to show.</div>
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
          styleObject: {
            // display: 'block',
            // float: 'left',
            // padding: '10px 0',
            // marginRight:'50px'
            width: '150px'
          }
      }
    },
    // mounted(){
    // console.log('selections', this.selections)
    // },
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
            // console.log('filterdata', result)
            // return result;
            const filterByIndicator = result.filter(row => row.indicatorMeta.indicator === this.selections.indicatorId)
            const filterByDetail = filterByIndicator.filter(row => row.areaId[4] == this.selections.detail)
            let filterObject = {...this.selections.selectedFilterOptions}
            // console.log('filterObject', filterObject)
            delete filterObject['area']
            Object.keys(filterObject).map(function(key, index) {
                if (filterObject[key].length < 1 || key === 'area') {
                    delete filterObject[key]
                }
            })
            // console.log('filterObject', filterObject)
            const addFilterObject = filterByDetail.map(row => {
                row['filter'] = {...filterObject}
                return row
            })
            return addFilterObject
            // return filterByDetail
        }
    }
});
</script>