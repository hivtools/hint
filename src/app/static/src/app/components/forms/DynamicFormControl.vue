<template>
    <b-col :md="colWidth">
        <label v-if="formControl.label">{{formControl.label}}
            <span v-if="formControl.helpText"
                  class="icon-small"
                  v-tooltip="formControl.helpText">
                <help-circle-icon></help-circle-icon>
            </span>
            <span v-if="formControl.required" class="small">({{requiredText}})</span>
        </label>
        <component :is="dynamicComponent"
                   :select-text="selectText"
                   v-model="formControlLocal"></component>
    </b-col>
</template>

<script lang="ts">
    import Vue from "vue";
    import {BCol} from "bootstrap-vue";
    import DynamicFormMultiSelect from "./DynamicFormMultiSelect.vue";
    import DynamicFormSelect from "./DynamicFormSelect.vue";
    import {DynamicControl, SharedDynamicFormProps} from "./types";
    import DynamicFormNumberInput from "./DynamicFormNumberInput.vue";
    import {VTooltip} from 'v-tooltip'
    import {HelpCircleIcon} from "vue-feather-icons";

    Vue.directive('tooltip', VTooltip);

    interface Computed {
        dynamicComponent: string,
        formControlLocal: DynamicControl
    }

    interface Props extends SharedDynamicFormProps {
        formControl: DynamicControl,
        colWidth: string
    }

    export default Vue.extend<{}, {}, Computed, Props>({
        name: "DynamicFormControl",
        model: {
            prop: "formControl",
            event: "change"
        },
        props: {
            formControl: Object,
            colWidth: String,
            selectText: {
                type: String, default: "Select..."
            },
            requiredText: {
                type: String, default: "required"
            }
        },
        computed: {
            formControlLocal: {
                get() {
                    return this.formControl
                },
                set(newVal: DynamicControl) {
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
                }
            }
        },
        components: {
            BCol,
            DynamicFormNumberInput,
            DynamicFormSelect,
            DynamicFormMultiSelect,
            HelpCircleIcon
        },
    });
</script>
