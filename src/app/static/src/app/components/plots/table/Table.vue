<template>
    <div>
        <br>
        <div v-if="filteredData.length > 0">
            <b-form-group class="mb-0">
                <b-input-group size="sm">
                    <b-form-input
                        v-model="filter"
                        type="search"
                        id="filterInput"
                        :placeholder="translate('typeSearch')"></b-form-input>
                    <b-input-group-append>
                        <b-button :disabled="!filter" @click="filter = ''" v-translate="'clearText'"></b-button>
                    </b-input-group-append>
                </b-input-group>
            </b-form-group>
            <b-table
                striped hover
                :fields="fields"
                :items="filteredData"
                :sort-by.sync="sortBy"
                :sort-desc.sync="sortDesc"
                :filter="filter"
                responsive="sm"
                show-empty>
                <template v-for="(_, slot) in $scopedSlots" v-slot:[slot]="props">
                    <slot :name="slot" v-bind="props" />
                </template>
            </b-table>
        </div>
        <div v-else v-translate="'noData'"></div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import i18next from "i18next";
    import {mapStateProp} from "../../../utils";
    import {BButton, BFormGroup, BFormInput, BInputGroup, BInputGroupAppend, BTable} from 'bootstrap-vue';
    import {RootState} from "../../../root";
    import {Language} from "../../../store/translations/locales";

    interface Props {
        filteredData: any[],
        fields: Field[]
    }

    export interface Field {
        key: string,
        label?: string
        sortable: boolean,
        sortByFormatted: boolean
    }

    interface Methods {
        translator: string
    }

    interface Computed {
        currentLanguage: Language
    }

    const props = {
        filteredData: {
            type: Array
        },
        fields: {
            type: Array
        }
    };

    export default Vue.extend<unknown, unknown, Computed, Props>({
        name: "table-view",
        props: props,
        data() {
            return {
                sortBy: '',
                sortDesc: false,
                filter: null
            }
        },
        methods: {
            translate(word: string) {
                return i18next.t(word, {lng: this.currentLanguage})
            },
        },
        computed: {
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
