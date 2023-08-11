<template>
    <b-col :md="colWidth">
        <label v-if="formControl.label">{{formControl.label}}
            <span v-if="formControl.helpText"
                  class="icon-small"
                  v-tooltip="formControl.helpText">
                <vue-feather type="help-circle" class="align-middle"></vue-feather>
            </span>
            <span v-if="formControl.required"
                  class="ml-1"
                  :class="{'text-danger': valueIsEmpty(formControl.value)}"
                  style="font-size: small;">({{requiredText}})</span>
        </label>
        <component :is="dynamicComponent!"
                   v-model:formControl="formControlLocal"
                   :select-text="selectText"></component>
    </b-col>
</template>

<script lang="ts">
    import {BCol} from "bootstrap-vue-next";
    import DynamicFormMultiSelect from "./DynamicFormMultiSelect.vue";
    import DynamicFormSelect from "./DynamicFormSelect.vue";
    import {DynamicControl} from "./types";
    import DynamicFormNumberInput from "./DynamicFormNumberInput.vue";
    import VueFeather from "vue-feather";
    import FormsMixin from "./FormsMixin";
    import { PropType, defineComponent } from "vue";

    export default defineComponent({
        extends: FormsMixin,
        name: "DynamicFormControl",
        props: {
            formControl: {
                type: Object as PropType<DynamicControl>,
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
                    this.$emit("update:formControl", newVal);
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
            BCol,
            DynamicFormNumberInput,
            DynamicFormSelect,
            DynamicFormMultiSelect,
            VueFeather
        }
    });
</script>
