<template>
    <div v-if="showAlert">
        <div class="content alert alert-warning pt-0">
            <button @click="$emit('clear-warnings')" type="button" class="close pt-2 pull-right" v-translate:aria-label="'close'">
                <span aria-hidden="true">&times;</span>
            </button>
            <warning v-for="(value, key) in filteredWarnings" :key="key" :origin="`${key}`" :warnings="value" :max-lines="maxLines"></warning>
        </div>
    </div>
</template>

<script lang="ts">
    import { defineComponentVue2WithProps } from "../defineComponentVue2/defineComponentVue2";
    import { Warning as WarningType } from "../generated";
    import { Dict } from "../types";
    import Warning from "./Warning.vue"

    interface Props {
        warnings: Dict<WarningType[]>;
        maxLines?: number;
    }

    interface Computed  {
        filteredWarnings: Dict<WarningType[]>;
        showAlert: boolean;
    }

    export default defineComponentVue2WithProps<unknown, unknown, Computed, Props>({
        name: "WarningAlert",
        props: {
            warnings: {
                type: Object,
                required: true
            },
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
        },
        components: {
            Warning
        }
    })
</script>



