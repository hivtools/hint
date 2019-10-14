<template>
    <b-col :md="colWidth">
        <label v-if="control.label">{{control.label}}</label>
        <component :is="dynamicComponent"
                   :form-control="control"></component>
    </b-col>
</template>

<script lang="ts">
    import Vue from "vue";
    import {BCol} from "bootstrap-vue";
    import DynamicFormMultiSelect from "./DynamicFormMultiSelect.vue";
    import DynamicFormSelect from "./DynamicFormSelect.vue";
    import {DynamicControl} from "./fakeFormMeta";
    import DynamicFormNumberInput from "./DynamicFormNumberInput.vue";

    export default Vue.extend<{}, {}, {}, { control: DynamicControl, colWidth: string }>({
        name: "DynamicFormControl",
        props: {
            control: Object,
            colWidth: String
        },
        computed: {
            dynamicComponent: function() {
                switch(this.control.type) {
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
            DynamicFormMultiSelect
        },
    });
</script>