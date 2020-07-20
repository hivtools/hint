<template>
    <div>
        <br>
        <div v-if="combinedData.length > 0">
            <table style="display: flex">
                <div>
                    <tr>
                        <th>Area</th>
                        <th v-for="(value, key) in combinedData[0]['filter']">{{ key === 'survey' ? 'Household survey' : key === 'quarter' ? 'Period' : key.charAt(0).toUpperCase() + key.slice(1) }}</th>
                        <th>{{ combinedData[0]['indicatorMeta']['name'] }}</th>
                        <th v-if="filteredDataSize.length > 0">{{ filteredDataSize[0]['indicatorMeta']['name'] }}</th>
                    </tr>
                    <tr v-for="row in combinedData">
                        <td :style="styleObject">{{ flattenedAreas[row['areaId']]['label'] }}</td>
                        <td :style="styleObject" v-for="(value2, key2) in row['filter']">{{ typeof value2 === 'string' ? value2.charAt(0).toUpperCase() + value2.slice(1) : value2 }}</td>
                        <td :style="styleObject">{{ row['value'] }}</td>
                        <td :style="styleObject" v-if="filteredDataSize.length > 0">{{ row['sizeValue'] }}</td>
                    </tr>
                </div>
            </table>
        </div>
        <div v-else>No data are available for these selections.</div>
        <div v-if="filteredData2.length > 0">
            <table style="display: flex">
                <div>
                    <tr>
                        <th v-for="filter in filteredFilters">{{ filter.column_id }}</th>
                        <th v-for="indicator in indicators">{{ indicator.indicator }}</th>
                    </tr>
                    <tr v-for="row in filteredData2">
                        <td :style="styleObject" v-for="filter in filteredFilters">{{ row.row[filter.column_id] }}</td>
                        <td :style="styleObject" v-for="indicator in indicators">{{ row.value }}</td>
                    </tr>
                </div>
            </table>
        </div>
        <div v-else>No data are available for these selections.</div>
        <ul><li v-for="x in filteredData2">{{ x }}</li></ul>
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
    filteredDataSize: any[],
    filteredData2: any[],
    combinedData: any[],
    flattenedAreas: Dict<NestedFilterOption>,
    selectedAreaIds: string[],
    selectedAreaFilterOptions: FilterOption[],
    filteredFilters: any[]
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
    mounted(){
        console.log('filteredData2', this.filteredData2),
        console.log('filters', this.filters),
        console.log('filteredFilters', this.filteredFilters)
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
            const result: any[] = [];
            iterateDataValues(this.tabledata,
                this.indicators,
                this.selectedAreaIds,
                this.nonAreaFilters,
                this.selections.selectedFilterOptions,
                (areaId: string, indicatorMeta: ChoroplethIndicatorMetadata, value: number, row: object) => {
                    result.push({areaId, indicatorMeta, value, row});
                });

            if (result.length > 0){

                let filterObject: any = {...this.selections.selectedFilterOptions}
                delete filterObject['area']
                Object.keys(filterObject).map(function(key, index) {
                    if (filterObject[key].length < 1 || key === 'area') {
                        delete filterObject[key]
                    } else if (key === 'survey'){
                        filterObject[key] = filterObject[key][0]['label']
                    }
                })
                const addFilterObject = result.map((row, index, array) => {
                    row['filter'] = {...filterObject}
                    // maps through the row property for each row in the table and checks if it matches a selected filter
                    Object.keys(row['row']).map(function(key, index) {
                    if (row['filter'][key]) {
                        row['filter'][key] = row['row'][key]
                    // age_group and age have different ids in the row and filter so this matches them
                    } else if (key === 'age_group' && 'age' in row['filter']){
                        row['filter']['age'] = row['row'][key]
                    // checks if calender_quarter id in row matches the quarter id in filter and assigns filter the value label
                    } else if (key === 'calendar_quarter' && 'quarter' in row['filter']){
                        row['filter']['quarter'].map((value2: any) => {
                            if(value2.id === row['row'][key]){
                                row['filter']['quarter'] = value2.label
                                return
                            }
                        })
                    }
                })

                    return row
                })
                return addFilterObject
            } else return result
        },
        filteredDataSize() {
            if (this.indicatorsSize){
                const result: any[] = [];
                iterateDataValues(this.tabledata,
                    this.indicatorsSize,
                    this.selectedAreaIds,
                    this.nonAreaFilters,
                    this.selections.selectedFilterOptions,
                    (areaId: string, indicatorMeta: ChoroplethIndicatorMetadata, value: number) => {
                        result.push({areaId, indicatorMeta, value});
                    });
                return result
            } else return []
        },
        combinedData(){
            const colourArray = [...this.filteredData]
            const sizeArray = [...this.filteredDataSize]
            if (sizeArray.length > 0){
                return colourArray.map((val: any, index: any) => {
                    val.sizeValue = sizeArray[index].value
                    return val
                    })
            } else return colourArray
        },
        filteredData2() {
            const result: any[] = [];
            iterateDataValues(this.tabledata,
                this.indicators,
                this.selectedAreaIds,
                this.nonAreaFilters,
                this.selections.selectedFilterOptions,
                (areaId: string, indicatorMeta: ChoroplethIndicatorMetadata, value: number, row: object) => {
                    result.push({areaId, indicatorMeta, value, row});
                });
            // if (result.length > 0) {
                let addAreaLabels = result.map((value: any) => {
                    console.log('expected value', this.flattenedAreas[value.row.area_id].label)
                    console.log('replaced value', value.row.area_id)
                value.row.area_id = this.flattenedAreas[value.row.area_id].label
                return value
                })
                console.log('add labels', addAreaLabels)
            // }
            
            console.log('flatten area', this.flattenedAreas)
            
            return result
        },
        filteredFilters(){
            return this.filters.filter(value => this.filteredData2[0].row[value.column_id])
        }
    }
});
</script>