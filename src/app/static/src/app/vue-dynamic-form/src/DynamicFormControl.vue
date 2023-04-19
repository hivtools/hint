<template>
    <!-- <b-col :md="colWidth">
        <label v-if="formControl.label">{{formControl.label}}
            <span v-if="formControl.helpText"
                  class="icon-small"
                  v-tooltip="formControl.helpText">
                <help-circle-icon></help-circle-icon>
            </span>
            <span v-if="formControl.required" class="small" :class="{'text-danger': valueIsEmpty(formControl.value)}">({{requiredText}})</span>
        </label>
        <component :is="dynamicComponent"
                   v-model="formControlLocal"
                   :select-text="selectText"></component>
    </b-col> -->

    <div>
        <label v-if="formControl.label">{{formControl.label}}
            <span v-if="formControl.helpText"
                  class="icon-small"
                  v-tooltip="formControl.helpText">
                <help-circle-icon></help-circle-icon>
            </span>
            <span v-if="formControl.required" class="small" :class="{'text-danger': valueIsEmpty(formControl.value)}">({{requiredText}})</span>
        </label>
        <component :is="dynamicComponent"
                   v-model="formControlLocal"
                   :form-control="formControlLocal"
                   @change="(newVal: any) => formControlLocal = newVal"
                   :select-text="selectText"></component>
    </div>
</template>

<script lang="ts">
    import {defineComponentVue2GetSetWithProps} from "../../defineComponentVue2/defineComponentVue2";
    // import {BCol} from "bootstrap-vue";
    import DynamicFormMultiSelect from "./DynamicFormMultiSelect.vue";
    import DynamicFormSelect from "./DynamicFormSelect.vue";
    import {DynamicControl} from "./types";
    import DynamicFormNumberInput from "./DynamicFormNumberInput.vue";
    import {VTooltip} from 'floating-vue'
    import HelpCircleIcon from "vue-feather";
    import FormsMixin from "./FormsMixin";
    import { ComputedGetter } from "vue";

    interface Computed extends Record<string, any> {
        dynamicComponent: ComputedGetter<string | undefined>,
        formControlLocal: {
            get: ComputedGetter<DynamicControl>
            set: (newVal: DynamicControl) => void
        }
    }

    interface Props {
        formControl: DynamicControl,
        colWidth: string
        requiredText?: string
        selectText?: string
    }

    export default defineComponentVue2GetSetWithProps<unknown, unknown, Computed, Props>({
        extends: FormsMixin,
        name: "DynamicFormControl",
        model: {
            prop: "formControl",
            event: "change"
        },
        props: {
            formControl: {
                type: Object,
                required: true
            },
            colWidth: {
                type: String,
                required: true
            },
            requiredText: {
                type: String,
                required: false
            },
            selectText: {
                type: String,
                required: false
            },
        },
        computed: {
            formControlLocal: {
                get() {
                    return this.formControl
                },
                set(newVal: DynamicControl) {
                    console.log(["dynamicFormControl", newVal])
                    this.$emit("change", newVal);
                }
            },
            dynamicComponent() {
                switch (this.formControl.type) {
                    case "select":
                        return "dynamic-form-select";
                    case "multiselect":
                        return "dynamic-form-multi-select";
                    case "number":
                        return "dynamic-form-number-input";
                    default:
                        return undefined
                }
            }
        },
        components: {
            // BCol,
            DynamicFormNumberInput,
            DynamicFormSelect,
            DynamicFormMultiSelect,
            HelpCircleIcon
        },
        directives: {
            tooltip: VTooltip
        }
    });
</script>
