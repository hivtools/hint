<template>
    <div>
        <br>
        <div v-if="filteredData.length > 0">
            <b-form-group class="mb-0">
                <b-input-group size="sm">
                    <b-form-input
                        :model-value="filter"
                        type="search"
                        id="filterInput"
                        @update:model-value="changeFilter"
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
                :sort-by="sortBy"
                :sort-desc="sortDesc"
                :filter="filter"
                responsive="sm"
                show-empty>
                <template v-for="(_, slot) in $slots" v-slot:[slot]="props">
                    <slot :name="slot" v-bind="props" />
                </template>
            </b-table>
        </div>
        <div v-else v-translate="'noData'"></div>
    </div>
</template>

<script lang="ts">
    import i18next from "i18next";
    import {mapStateProp} from "../../../utils";
    import {BButton, BFormGroup, BFormInput, BInputGroup, BInputGroupAppend, BTable} from 'bootstrap-vue-next';
    import {RootState} from "../../../root";
    import {Language} from "../../../store/translations/locales";
    import {Field} from "../../../types";
    import { PropType, defineComponent } from "vue";

    export default defineComponent({
        name: "table-view",
        props: {
            filteredData: {
                type: Array as PropType<any[]>,
                required: true
            },
            fields: {
                type: Array as PropType<Field[]>,
                required: true
            }
        },
        data() {
            return {
                sortBy: "",
                sortDesc: false,
                filter: ""
            }
        },
        methods: {
            translate(word: string) {
                return i18next.t(word, {lng: this.currentLanguage})
            },
            changeFilter(filter: string) {
                this.filter = filter;
            }
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
