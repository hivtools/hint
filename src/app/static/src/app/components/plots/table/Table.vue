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
              label="Filter"
              label-cols-sm="3"
              label-align-sm="left"
              label-size="sm"
              label-for="filterInput"
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
            <!-- Originally I tried to use the filteredData (as is) in the items property. However because this contains nested data
            in the filterLabels and indicatorValues objects, I needed to format the table data with the below commented 
            out templates. Unfortunately the default sort-compare routine only looks at the original data passed 
            to the items property, not the formatted data shown in the table, so the sort feature would not work here.
            It is possible to supply the sort-compare property with a custom routine but after looking into this I realised it was
            much more straight forward to pass a flattend filteredData object to the items property instead. This approach could
            run into trouble when keys of the same name are used however (eg, uncertainties). The question is whether to go down this route 
            and refactor the filteredData object to be flat or to use a custom sort-compare instead. I also don't think it is 
            possible to filter formatted data (referred to as scoped fields in the documentation). With regard to the filter,
            it depends how granualar you want to go with the filtering. Currently I have the filter just search for anything matching
            the supplied value in any column. See here for an example of a more complex filter: https://bootstrap-vue.org/docs/components/table#complete-example 
            Will also need to rethink how areaHierachies get added to the table. 
            Finally, I need to find a way of getting the translations to the label props for the generatedFields-->
              <!-- <template v-for="f in filtersToDisplay" v-slot:[`cell(${f.label})`]="data">
                {{ data.item.filterLabels[f.label] }}
              </template>
              <template v-for="i in indicators" v-slot:[`cell(${i.indicator})`]="data">
                {{ data.item.indicatorValues[i.indicator] }}
              </template> -->
            </b-table>
            <div>
              Sorting By: <b>{{ sortBy }}</b>, Sort Direction:
              <b>{{ sortDesc ? 'Descending' : 'Ascending' }}</b>
            </div>
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

Vue.component('b-table', BTable)
Vue.component('b-form-group', BFormGroup)
Vue.component('b-form-input', BFormInput)
Vue.component('b-input-group', BInputGroup)
Vue.component('b-button', BButton)
Vue.component('b-input-group-append', BInputGroupAppend)

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
interface Computed {
    nonAreaFilters: Filter[],
    filtersToDisplay: Filter[],
    areaFilter: Filter,
    filteredData: DisplayRow[],
    flattenedAreas: Dict<NestedFilterOption>,
    selectedAreaIds: string[],
    selectedAreaFilterOptions: FilterOption[],
    generatedFields: any[],
    flatFilteredData: any[],
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
    mounted(){
      console.log('filteredData', this.filteredData)
      console.log('filtersToDisplay', this.filtersToDisplay)
      console.log('indicators', this.indicators)
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
            field.label = i18next.t(value.id, this.currentLanguage)
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
          console.log('fields', fields)
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
            // selectText() {
            //     return i18next.t("select", this.currentLanguage)
            // },
            // requiredText() {
            //     return i18next.t("required", this.currentLanguage)
            // },
            // laterCompleteSteps: mapGetterByName("stepper", "laterCompleteSteps"),
            // editsRequireConfirmation: mapGetterByName("stepper", "editsRequireConfirmation"),
            // ...mapStateProps<ModelOptionsState, keyof Computed>(namespace, {
            //     loading: s => s.fetching,
            //     valid: s => s.valid
            // }),
    }
});
</script>