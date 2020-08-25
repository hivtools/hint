<template>
    <div>
        <br>
        <div v-if="filteredData.length > 0">
          <!-- <table class="table">
                <div>
                    <tr>
                        <th v-translate="'area'"></th>
                        <th v-for="f in filtersToDisplay" v-translate="f.label"></th>
                        <th v-for="i in indicators">{{ i.name }}</th>
                    </tr>
                    <tr v-for="row in filteredData">
                        <td>
                          <div>{{ row.areaLabel }}</div>
                          <div class="small">{{ row.areaHierarchy }}</div>
                        </td>
                        <td v-for="f in filtersToDisplay">{{ row.filterLabels[f.id] }}</td>
                        <td v-for="i in indicators">{{ row.indicatorValues[i.indicator] }}</td>
                    </tr>
                </div>
            </table> -->
            <b-form-group
              class="mb-0"
            >
              <b-input-group size="sm">
                <b-form-input
                  v-model="filter"
                  type="search"
                  id="filterInput"
                  placeholder="Type to Search"
                ></b-form-input>
                <b-input-group-append>
                  <b-button :disabled="!filter" @click="filter = ''">Clear</b-button>
                </b-input-group-append>
              </b-input-group>
            </b-form-group>
            <b-table striped hover 
            :fields="generatedFields" 
            :items="flatFilteredData"
            :sort-by.sync="sortBy"
            :sort-desc.sync="sortDesc"
            :filter="filter"
            responsive="sm"
            >
            <template v-slot:cell(areaLabel)="data">
              <div>{{ data.item.areaLabel }}</div>
              <div class="small">{{ data.item.areaHierarchy }}</div>
            </template>
            </b-table>
        </div>
        <div v-else>No data are available for these selections.</div>
    </div>
    
</template>

<script lang="ts">
import Vue from "vue";
import i18next from "i18next";
import Filters from "../Filters.vue";
import {iterateDataValues, findPath} from "../utils";
import {ChoroplethIndicatorMetadata, FilterOption, NestedFilterOption} from "../../../generated";
import {Dict, Filter} from "../../../types";
import {ChoroplethSelections} from "../../../store/plottingSelections/plottingSelections";
import {flattenOptions, flattenToIdSet, mapStateProp, mapStateProps} from "../../../utils";
import { BTable, BFormGroup, BFormInput, BInputGroup, BInputGroupAppend, BButton } from 'bootstrap-vue';
import {RootState} from "../../../root";
import {Language} from "../../../store/translations/locales";

interface Props {
    tabledata: any[],
    indicators: ChoroplethIndicatorMetadata[],
    selections: {
        indicatorId: string,
        selectedFilterOptions: Dict<FilterOption[]>,
        detail: number | null
    },
    filters: Filter[],
    countryAreaFilterOption: NestedFilterOption,
    areaFilterId: string
}
interface DisplayRow {
    areaLabel: string,
    areaHierarchy: string,
    filterLabels: Dict<string>,
    indicatorValues: Dict<string>
}
interface Field {
    key: string,
    label?: string
}
interface TableItem {
    areaLabel: string
}
interface Computed {
    nonAreaFilters: Filter[],
    filtersToDisplay: Filter[],
    areaFilter: Filter,
    filteredData: DisplayRow[],
    flattenedAreas: Dict<NestedFilterOption>,
    selectedAreaIds: string[],
    selectedAreaFilterOptions: FilterOption[],
    generatedFields: Array<Field>,
    flatFilteredData: Array<TableItem>,
    currentLanguage: Language
}
const props = {
    tabledata: {
        type: Array
    },
    filters: {
        type: Array
    },
    countryAreaFilterOption: {
        type: Object
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
        sortBy: '',
        sortDesc: false,
        filter: null
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
          if (this.selections.detail === 0 || !this.selections.detail){
            return this.areaFilter ? flattenOptions([this.countryAreaFilterOption]) : {};
          }
          return this.areaFilter ? flattenOptions(this.areaFilter.options) : {};
        },
        selectedAreaIds() {
            const selectedAreaIdSet = flattenToIdSet(this.selectedAreaFilterOptions.map(o => o.id), this.flattenedAreas);
            const areaArray = Array.from(selectedAreaIdSet);
            if (this.selections.detail === 0){
                return [areaArray[0]]
            } else if (!this.selections.detail){
              return this.selections.selectedFilterOptions.area.map(row => row.id)
            } else return areaArray.filter(val => parseInt(val[4]) === this.selections.detail);
        },
        selectedAreaFilterOptions() {
            const selectedOptions = this.selections.selectedFilterOptions[this.areaFilterId];
            if(this.selections.detail === 0){
                return this.countryAreaFilterOption ? [this.countryAreaFilterOption] : []
            }
            else if (selectedOptions && selectedOptions.length > 0) {
                return selectedOptions
            } else return this.areaFilter ? this.areaFilter.options : []; //consider all top level areas to be selected if none are
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
                const displayRows: Dict<any> = {};
                filteredValues.forEach(current => {
                    const key = [current.areaId, ...this.nonAreaFilters.map(f => current.filterValues[f.id])].join("_");
                    if (!(key in displayRows)) {
                        const areaLabel =  this.flattenedAreas[current.areaId].label;
                        const areaHierarchy = findPath(current.areaId, this.countryAreaFilterOption.children)
                        const filterLabels: Dict<string> = {};
                        Object.keys(current.filterValues).forEach(k => {
                            const selectedOptions =  this.selections.selectedFilterOptions[k];
                            filterLabels[k] = selectedOptions.filter(o => o.id == current.filterValues[k])[0].label;
                        });
                        displayRows[key] = {
                            areaLabel,
                            areaHierarchy,
                            filterLabels,
                            indicatorValues: {}
                        }
                    }
                    displayRows[key].indicatorValues[current.indicatorMeta.indicator] = current.value;
                });
                // console.log('filtereddata', Object.values(displayRows))
                // console.log('filters to display', this.filtersToDisplay)
                return Object.values(displayRows);
        },
        generatedFields(){
          const fields: any[] = [];
          fields.push({
            key: 'areaLabel',
            label: i18next.t('area', this.currentLanguage)
            })
          this.filtersToDisplay.map(value =>{
            const field: Dict<any> = {};
            field.key = value.id
            field.label = i18next.t(value.label.toLowerCase(), this.currentLanguage)
            fields.push(field)
          })
          this.indicators.map(value =>{
            const field: Dict<any> = {};
            field.key = value.indicator
            field.label = value.name
            fields.push(field)
          })
          fields.map(field => {
            field.sortable = true
            field.sortByFormatted = true
          })
          return fields
        },
        flatFilteredData(){
          const values: any[] = [];
          this.filteredData.map(value => {
            let row: Dict<any> = {};
            row = {...value.filterLabels, ...value.indicatorValues}
            row.areaLabel = value.areaLabel
            row.areaHierarchy = value.areaHierarchy
            values.push(row)
          })
          return values
        },
        currentLanguage: mapStateProp<RootState, Language>(null,
                (state: RootState) => state.language)
    },
    components: {
      BTable,
      BFormGroup,
      BFormInput,
      BInputGroup,
      BButton,
      BInputGroupAppend
    }
});
</script>