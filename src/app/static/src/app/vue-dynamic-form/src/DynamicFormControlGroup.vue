<template>
    <tr class="my-2">
        <label v-if="controlGroup.label" class="col-form-label col-md-5">{{controlGroup.label}}
            <span v-if="helpText" class="icon-small" v-tooltip="helpText">
                    <help-circle-icon></help-circle-icon>
                </span>
            <span v-if="required" class="small" :class="{'text-danger': anyValueEmpty(controlGroup)}">({{requiredText}})</span>
        </label>
        <dynamic-form-control v-for="(control, index) in controlGroup.controls"
                              :key="control.name"
                              :form-control="control"
                              @mousedown="confirm"
                              @click="confirm"
                              :required-text="requiredText"
                              :select-text="selectText"
                              @change="change($event, index)"
                              :col-width="colWidth"></dynamic-form-control>
    </tr>
</template>
<script lang="ts">
    import {defineComponent} from "vue";
    // import {BCol, BRow} from "bootstrap-vue";
    import {Control, DynamicControlGroup} from "./types";
    import DynamicFormControl from "./DynamicFormControl.vue";
    import {VTooltip} from 'floating-vue';
    import HelpCircleIcon from "vue-feather";
    import FormsMixin from "./FormsMixin";
    import { defineComponentVue2WithProps } from "../../defineComponentVue2/defineComponentVue2";

    interface Methods {
        anyValueEmpty: (controlGroup: DynamicControlGroup) => boolean
        change: (newVal: Control, index: number) => void
        confirm:(e: Event) => void
    }

    interface Computed {
        colWidth: string,
        required: boolean
        helpText: string | undefined
    }

    interface Props {
        controlGroup: DynamicControlGroup
        requiredText?: string
        selectText?: string
    }

    export default defineComponentVue2WithProps<unknown, Methods, Computed, Props>({
        extends: FormsMixin,
        name: "DynamicFormControlGroup",
        model: {
            prop: "controlGroup",
            event: "change"
        },
        props: {
            controlGroup: {
                type: Object,
                required: true
            },
            requiredText: {
                type: String,
                required: false
            },
            selectText: {
                type: String,
                required: false
            }
        },
        components: {
            // BRow,
            // BCol,
            DynamicFormControl,
            HelpCircleIcon
        },
        directives: {
            tooltip: VTooltip
        },
        methods: {
            anyValueEmpty(controlGroup: DynamicControlGroup){
                return !!controlGroup.controls.find(c => this.valueIsEmpty(c.value))
            },
            change(newVal: Control, index: number) {
                const controls = [...this.controlGroup.controls];
                controls[index] = newVal;
                this.$emit("change", {...this.controlGroup, controls})
            },
            confirm(e: Event) {
                this.$emit("confirm", e)
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
