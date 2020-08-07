<template>
    <div>
        <br>
        <div v-if="filteredData.length > 0">
            <table class="table">
                <div>
                    <tr>
                        <th v-translate="'area'"></th>
                        <th v-for="f in filtersToDisplay" v-translate="f.label"></th>
                        <th v-for="i in indicators">{{ i.name }}</th>
                    </tr>
                    <tr v-for="row in filteredData">
                        <td>{{ row.areaLabel }}</td>
                        <td v-for="f in filtersToDisplay">{{ row.filterLabels[f.id] }}</td>
                        <td v-for="i in indicators">{{ row.indicatorValues[i.indicator] }}</td>
                    </tr>
                </div>
            </table>
        </div>
        <div v-else>No data are available for these selections.</div>
        <ul>
          <li v-for="x in flattenedAreas">{{ x }}</li>
        </ul>
    </div>
    
</template>

<script lang="ts">
import Vue from "vue";
import Filters from "../Filters.vue";
import {iterateDataValues} from "../utils";
import {ChoroplethIndicatorMetadata, FilterOption, NestedFilterOption} from "../../../generated";
import {Dict, Filter} from "../../../types";
import {ChoroplethSelections} from "../../../store/plottingSelections/plottingSelections";
import {flattenOptions, flattenToIdSet} from "../../../utils";
interface Props {
    tabledata: any[],
    indicators: ChoroplethIndicatorMetadata[],
    selections: {
        indicatorId: string,
        selectedFilterOptions: Dict<FilterOption[]>,
        detail: number | null
    },
    filters: Filter[],
    areaFilterId: string
}
interface DisplayRow {
    areaLabel: string,
    filterLabels: Dict<string>,
    indicatorValues: Dict<string>
}
interface Computed {
    nonAreaFilters: Filter[],
    filtersToDisplay: Filter[],
    areaFilter: Filter,
    filteredData: DisplayRow[],
    flattenedAreas: Dict<NestedFilterOption>,
    selectedAreaIds: string[],
    selectedAreaFilterOptions: FilterOption[]
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
    data() {
      return {
          
      }
    },
    mounted(){
        // const start = "MWI_4_7"
        // const level = parseInt(start[4])
        // const hArray = []

        // for (let index = level; index > 0; index--) {
        //   const currentId = start.slice(0,4) + index + start.slice(5)
        //   const subLevel = parseInt(currentId.slice(6))
        //   console.log('currentId', currentId)
        //   if (this.flattenedAreas[currentId]){
        //     hArray.unshift(this.flattenedAreas[currentId].label)
        //   } else {
        //     for (let i = subLevel; i > 0; i--) {
        //       const currentId2 = currentId.slice(0,6) + i
        //       console.log('currentId2', currentId2)
        //       if (this.flattenedAreas[currentId2]){
        //         hArray.unshift(this.flattenedAreas[currentId2].label)
        //         break;
        //       }
        //     }
        //   }
          
          
        // }
        // console.log('this.flattenedAreas[start]', this.flattenedAreas[start])
        // console.log('level', level)
        // console.log('hArray', hArray)
        console.log('this.filters', this.filters[0].options)

        const obj = this.filters[0].options

        function findPath(id, obj) {
            for(var key in obj) {                                         // for each key in the object obj
                if(obj.hasOwnProperty(key)) {                             // if it's an owned key
                    if(id === obj[key]) return obj.label;                        // if the item beign searched is at this key then return this key as the path
                    else if(obj[key] && typeof obj[key] === "object") {   // otherwise if the item at this key is also an object
                        var path = findPath(id, obj[key]);                 // search for the item a in that object
                        if(path) return obj.label + "/" + path;                 // if found then the path is this key followed by the result of the search
                    }
                }
            }
        }
        console.log('path', findPath('MWI_4_7', obj))
        console.log('path', findPath("MWI_4_7", obj).replace(/undefined\//g, ""))
        
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
            const areaArray = Array.from(selectedAreaIdSet)
            if (this.selections.detail === 0 || !this.selections.detail){
                return [areaArray[0]]
            } else return areaArray.filter(val => parseInt(val[4]) === this.selections.detail);
        },
        selectedAreaFilterOptions() {
            const selectedOptions = this.selections.selectedFilterOptions[this.areaFilterId];
            if (selectedOptions && selectedOptions.length > 0) {
                return selectedOptions
            }
            return this.areaFilter ? this.areaFilter.options : []; //consider all top level areas to be selected if none are
        },
        filtersToDisplay() {
            return this.nonAreaFilters.filter(f => f.options.length > 0)
        },
        filteredData() {
            const filteredValues: any[] = [];
            iterateDataValues(this.tabledata,
                this.indicators,
                this.selectedAreaIds,
                this.nonAreaFilters,
                this.selections.selectedFilterOptions,
                (areaId: string, indicatorMeta: ChoroplethIndicatorMetadata, value: number, row: any) => {
                    const filterValues: Dict<any> = {};
                    this.filtersToDisplay.forEach(f => {
                        if (row[f.column_id]) {
                        filterValues[f.id] = row[f.column_id]
                        }});
                    filteredValues.push({areaId, filterValues, indicatorMeta, value});
                });
                console.log('filteredValues', filteredValues)
                const displayRows: Dict<any> = {};
                filteredValues.forEach(current => {
                    const key = [current.areaId, ...this.nonAreaFilters.map(f => current.filterValues[f.id])].join("_");
                    if (!(key in displayRows)) {
                        const areaLabel =  this.flattenedAreas[current.areaId].label;
                        const filterLabels: Dict<string> = {};
                        Object.keys(current.filterValues).forEach(k => {
                            const selectedOptions =  this.selections.selectedFilterOptions[k];
                            filterLabels[k] = selectedOptions.filter(o => o.id == current.filterValues[k])[0].label;
                        });
                        displayRows[key] = {
                            areaLabel,
                            filterLabels,
                            indicatorValues: {}
                        }
                    }
                    displayRows[key].indicatorValues[current.indicatorMeta.indicator] = current.value;
                });
                console.log('filteredData', Object.values(displayRows))

                // const start = "MWI_4_7"
        // const level = parseInt(start[4])
        // const hArray = []

        // for (let index = level; index > 0; index--) {
        //   const currentId = start.slice(0,4) + index + start.slice(5)
        //   console.log('start.slice(0,4)', start.slice(0,4))
        //   console.log('currentId', currentId)
        //   hArray.unshift(this.flattenedAreas[currentId].id)
          
        // }
        // console.log('this.flattenedAreas[start]', this.flattenedAreas[start])
        // console.log('level', level)
        // console.log('hArray', hArray)

                return Object.values(displayRows);
        }
    }
});
</script>