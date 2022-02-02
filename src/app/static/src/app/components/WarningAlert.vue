<template>
    <div v-if="showAlert">
        <div class="content alert alert-warning pt-0">
            <warning v-for="(value, key) in filteredWarnings" :key="key" :origin="key" :warnings="value" :max-lines="maxLines"></warning>
            <button @click="dismissWarnings">Dismiss</button>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import { Warning as WarningType } from "../generated";
    import { Dict } from "../types";
    import Warning from "./Warning.vue"
    import { mapMutationByName} from "../utils";
    import {ModelRunMutation} from "../store/modelRun/mutations";
    import {ModelOptionsMutation} from "../store/modelOptions/mutations";
    import {ModelCalibrateMutation} from "../store/modelCalibrate/mutations";

    interface Props {
        warnings: Dict<WarningType[]>;
        maxLines: number;
        activeStep: number;
    }

    interface Computed  {
        filteredWarnings: Dict<WarningType[]>;
        showAlert: boolean;
    }

    interface Methods {
        dismissWarnings: () => void;
        clearModelRun: () => void;
        clearModelCalibrate: () => void;
        clearModelOptions: () => void;
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
            activeStep: Number
        },
        computed: {
            filteredWarnings(){
                const anObject: Dict<WarningType[]> = {}
                Object.keys(this.warnings).forEach((k) => {
                    if (this.warnings[k].length > 0){
                        anObject[k] = this.warnings[k]
                    }
                });
                console.log(this.warnings, anObject)
                return anObject
            },
            showAlert(){
                return Object.keys(this.warnings).some(key => this.warnings[key].length > 0)
            }
        },
        methods: {
            dismissWarnings(){
                const mutationMethods: { [key: number]: () => void; } = {
                    3: this.clearModelOptions,
                    4: this.clearModelRun,
                    5: this.clearModelCalibrate,
                    6: this.clearModelCalibrate,
                }
                if (this.activeStep in mutationMethods){
                    mutationMethods[this.activeStep]()
                }
            },
            clearModelRun: mapMutationByName("modelRun", ModelRunMutation.ClearWarnings),
            clearModelCalibrate: mapMutationByName("modelCalibrate", ModelCalibrateMutation.ClearWarnings),
            clearModelOptions: mapMutationByName("modelOptions", ModelOptionsMutation.ClearWarnings)
        },
        components: {
            Warning
        }
    })
</script>



