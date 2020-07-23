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
        <!-- <div>areaFilterId: {{ areaFilterId }}</div>
        <div>indicators: {{ indicators }}</div>
        <div>selections: {{ selections }}</div>
        <div>filters: {{ filters }}</div>
        <div>selectedFilterOptions: {{ selectedFilterOptions }}</div> -->
        <!-- <br>
        <div>tabledata: {{ tabledata }}</div> -->
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
    // indicatorsSize: ChoroplethIndicatorMetadata[],
    selections: {
        indicatorId: string,
        selectedFilterOptions: Dict<FilterOption[]>,
        detail: number
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
    // filteredDataDisplayRow {
    //    areaId: string,
    //    nonAreaFilters: Dict<string>
    //    indicators: Dict<number>
    // },
    // filterLabels: Dict<string>
    nonAreaFilters: Filter[],
    filtersToDisplay: Filter[],
    areaFilter: Filter,
    filteredData: DisplayRow[],
    // filteredData: [filteredDataDisplayRow],
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
    // indicatorsSize: {
    //     type: Array
    // },
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
        // var templatehtml = document.getElementsByClassName('table')[0]['outerHTML']
        // console.log('tabledata:', JSON.stringify(this.tabledata))
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
        // filterLabels(){
        //     let filterLabels: Dict<string> = {}
        //     this.filters.map(row => {
        //         filterLabels[row.column_id] = row.label
        //         if (row.options.length > 0){
        //             row.options.map(row2 => {
        //                 filterLabels[row2.id] = row2.label
        //             })
        //         }
        //     })
        //     return filterLabels
        // },
        filtersToDisplay() {
            return this.nonAreaFilters.filter(f => f.options.length > 0)
        },
        filteredData() {
            /*let filterLabels: Dict<string> = {}
            this.filters.map(row => {
                filterLabels[row.column_id] = row.label
                if (row.options.length > 0){
                    row.options.map(row2 => {
                        filterLabels[row2.id] = row2.label
                    })
                }
            })*/
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
                return Object.values(displayRows);
           /* const addLabels = combinedArray.map((row: any) => {
                    row.areaId = this.flattenedAreas[row.areaId].label
                    Object.keys(row.nonAreaFilters).map(function(key, index) {
                        if (filterLabels[row.nonAreaFilters[key]]){
                            row.nonAreaFilters[key] = filterLabels[row.nonAreaFilters[key]]
                        }
                    })
                    return row
                    })
        // console.log('nonAreaFilters', this.nonAreaFilters)
        // console.log('indicators', this.indicators)
        console.log('addLabels', addLabels)*/
        }
    }
});
</script>