<template>
    <div v-if="showAlert">
        <div class="content alert alert-warning pt-0">
            <warning v-for="(value, key) in filteredWarnings" :key="key" :origin="key" :warnings="value" :max-lines="maxLines"></warning>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import { Warning as WarningType } from "../generated";
    import { Dict } from "../types";
    import Warning from "./Warning.vue"

    interface Props {
        warnings: Dict<WarningType[]>;
        maxLines: number;
    }

    interface Computed  {
        filteredWarnings: Dict<WarningType[]>;
        showAlert: boolean;
    }

    export default Vue.extend<unknown, unknown, Computed, Props>({
        name: "WarningAlert",
        props: {
            warnings: Object,
            maxLines: {
                default: 2,
                required: false,
                type: Number
            }
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
            }
        },
        components: {
            Warning
        }
    })
</script>



