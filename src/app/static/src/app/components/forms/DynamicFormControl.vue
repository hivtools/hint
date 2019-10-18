<template>
    <b-col :md="colWidth">
        <label v-if="formControl.label">{{formControl.label}}</label>
        <component :is="dynamicComponent"
                   :form-control="formControl"
                   @change="change"></component>
        <div class="invalid-feedback">This field is required</div>
    </b-col>
</template>

<script lang="ts">
    import Vue from "vue";
    import {BCol} from "bootstrap-vue";
    import DynamicFormMultiSelect from "./DynamicFormMultiSelect.vue";
    import DynamicFormSelect from "./DynamicFormSelect.vue";
    import {DynamicControl} from "./types";
    import DynamicFormNumberInput from "./DynamicFormNumberInput.vue";

    export default Vue.extend<{}, { change: (value: string | string[]) => void }, {},
        { formControl: DynamicControl, colWidth: string }>({
        name: "DynamicFormControl",
        props: {
            formControl: Object,
            colWidth: String
        },
        methods: {
            change(value: string | string[]) {
                this.$emit("change", {name: this.formControl.name, value: value})
            }
        },
        computed: {
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
            DynamicFormMultiSelect
        },
    });
</script>
