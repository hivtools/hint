<template>
    <b-col :md="colWidth">
        <label v-if="control.label">{{control.label}}</label>
        <component :is="dynamicComponent"
                   :form-control="control"></component>
    </b-col>
</template>

<script lang="ts">
    import Vue from "vue";
    import {BCol, BFormInput} from "bootstrap-vue";
    import DynamicFormMultiSelect from "./DynamicFormMultiSelect.vue";
    import DynamicFormSelect from "./DynamicFormSelect.vue";
    import DynamicFormInput from "./DynamicFormInput.vue";
    import {FormControl} from "./fakeFormMeta";

    export default Vue.extend<{}, {}, {}, { control: FormControl, colWidth: string }>({
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
                        return "dynamic-form-input";
                }
            }
        },
        components: {
            BCol,
            BFormInput,
            DynamicFormInput,
            DynamicFormSelect,
            DynamicFormMultiSelect
        },
    });
</script>