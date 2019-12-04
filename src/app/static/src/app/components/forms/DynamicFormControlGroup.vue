<template>
    <b-row class="my-2">
        <label v-if="controlGroup.label" class="col-form-label col-md-5">{{controlGroup.label}}
            <span v-if="helpText" class="icon-small" v-tooltip="helpText">
                    <info-icon></info-icon>
                </span>
            <span v-if="required" class="small">(required)</span>
        </label>
        <dynamic-form-control v-for="(control, index) in controlGroup.controls"
                              :key="control.name"
                              :form-control="control"
                              @change="change($event, index)"
                              :col-width="colWidth"></dynamic-form-control>
    </b-row>
</template>
<script lang="ts">
    import Vue from "vue";
    import {BCol, BRow} from "bootstrap-vue";
    import {Control, DynamicControlGroup} from "./types";
    import DynamicFormControl from "./DynamicFormControl.vue";
    import {VTooltip} from 'v-tooltip'
    import {InfoIcon} from "vue-feather-icons";

    Vue.directive('tooltip', VTooltip);

    interface Methods {
        change: (newVal: Control, index: number) => void
    }

    interface Computed {
        colWidth: string,
        required: boolean
        helpText: string | undefined
    }

    interface Props {
        controlGroup: DynamicControlGroup
    }

    export default Vue.extend<{}, Methods, Computed, Props>({
        name: "DynamicFormControlGroup",
        props: {
            controlGroup: Object
        },
        model: {
            prop: "controlGroup",
            event: "change"
        },
        components: {
            BRow,
            BCol,
            DynamicFormControl,
            InfoIcon
        },
        methods: {
            change(newVal: Control, index: number) {
                const controls = [...this.controlGroup.controls];
                controls[index] = newVal;
                this.$emit("change", {...this.controlGroup, controls})
            }
        },
        computed: {
            colWidth() {
                const numCols = this.controlGroup.controls.length;
                if (numCols == 1) {
                    return "6"
                } else {
                    return "3"
                }
            },
            required() {
                return this.controlGroup.controls.length == 1
                    && this.controlGroup.controls[0].required
            },
            helpText() {
                return this.controlGroup.controls.length == 1 ?
                    this.controlGroup.controls[0].helpText : ""
            }
        }
    });

</script>
