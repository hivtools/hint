<template>
    <div>
        <br>
        <div v-if="filteredData.length > 0">
            <table style="display: flex">
                <div>
                    <tr>
                        <th v-for="(v, k) in filteredData[0]" v-if="typeof v === 'string'">{{ k }}</th>
                        <th v-for="(v, k) in filteredData[0].nonAreaFilters">{{ k }}</th>
                        <th v-for="(v, k) in filteredData[0].indicators">{{ k }}</th>
                    </tr>
                    <tr v-for="row in filteredData">
                        <td :style="styleObject">{{ row.areaId }}</td>
                        <td :style="styleObject" v-for="nonAreaFilter in row.nonAreaFilters">{{ nonAreaFilter }}</td>
                        <td :style="styleObject" v-for="indicator in row.indicators">{{ indicator }}</td>
                    </tr>
                </div>
            </table>
        </div>
        <div v-else>No data are available for these selections.</div>
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
        indicatorsSize: ChoroplethIndicatorMetadata[],
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
    indicatorsSize: {
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
          styleObject: {
            width: '150px'
          }
      }
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
        filteredData() {
            let filterLabels: Dict<string> = {}
            this.filters.map(row => {
                filterLabels[row.column_id] = row.label
                if (row.options.length > 0){
                    row.options.map(row2 => {
                        filterLabels[row2.id] = row2.label
                    })
                }
            })
            const filteredValues: any[] = [];
            iterateDataValues(this.tabledata,
                this.indicators,
                this.selectedAreaIds,
                this.nonAreaFilters,
                this.selections.selectedFilterOptions,
                (areaId: string, indicatorMeta: ChoroplethIndicatorMetadata, value: number, row: any) => {
                    const filterValues: Dict<any> = {};
                    this.nonAreaFilters.forEach(f => {
                        if (row[f.column_id]) {
                        filterValues[f.id] = row[f.column_id]
                        }});
                    filteredValues.push({areaId, filterValues, indicatorMeta, value});
                });
            const combined: Dict<any> = {};
            filteredValues.forEach(current => {
            const key = [current.areaId, ...this.nonAreaFilters.map(f => current.filterValues[f.id])].join("_");
            if (!(key in combined)) {
                combined[key] = {
                    areaId: current.areaId,
                    nonAreaFilters: current.filterValues,
                    indicators: {}
                }
            }
            combined[key].indicators[current.indicatorMeta.name] = current.value;
            });
            const combinedArray = Object.values(combined);
            const addLabels = combinedArray.map((row: any) => {
                    row.areaId = this.flattenedAreas[row.areaId].label
                    Object.keys(row.nonAreaFilters).map(function(key, index) {
                        if (filterLabels[row.nonAreaFilters[key]]){
                            row.nonAreaFilters[key] = filterLabels[row.nonAreaFilters[key]]
                        }
                    })
                    return row
                    })
        return addLabels;
        }
    }
});
</script>