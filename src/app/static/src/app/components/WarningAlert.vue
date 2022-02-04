<template>
    <div v-if="showAlert">
        <div class="content alert alert-warning pt-0">
            <button @click="$emit('clear-warnings')" type="button" class="close pt-2 pull-right" :aria-label="translate('close')">
                <span aria-hidden="true">&times;</span>
            </button>
            <warning v-for="(value, key) in filteredWarnings" :key="key" :origin="key" :warnings="value" :max-lines="maxLines"></warning>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import { Warning as WarningType } from "../generated";
    import { Dict } from "../types";
    import Warning from "./Warning.vue"
    import i18next from "i18next";
    import { Language } from "../store/translations/locales";
    import { mapStateProp } from "../utils";
    import { RootState } from "../root";

    interface Props {
        warnings: Dict<WarningType[]>;
        maxLines: number;
    }

    interface Computed  {
        filteredWarnings: Dict<WarningType[]>;
        showAlert: boolean;
        currentLanguage: Language;
    }

    interface Methods {
        translate(text: string): string;
    }

    export default Vue.extend<unknown, Methods, Computed, Props>({
        name: "WarningAlert",
        props: {
            warnings: Object,
            maxLines: {
                default: 2,
                required: false,
                type: Number
            },
        },
        computed: {
            filteredWarnings(){
                const anObject: Dict<WarningType[]> = {}
                Object.keys(this.warnings).forEach((k) => {
                    if (this.warnings[k].length > 0){
                        anObject[k] = this.warnings[k]
                    }
                });
                return anObject
            },
            showAlert(){
                return Object.keys(this.warnings).some(key => this.warnings[key].length > 0)
            },
            currentLanguage: mapStateProp<RootState, Language>(
                null,
                (state: RootState) => state.language
            ),
        },
        methods: {
            translate(text) {
                return i18next.t(text, { lng: this.currentLanguage });
            },
        },
        components: {
            Warning
        }
    })
</script>



