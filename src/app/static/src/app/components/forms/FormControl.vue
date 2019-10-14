<template>
    <b-col :md="colWidth">
        <label v-if="control.label">{{control.label}}</label>
        <form-multi-select v-if="control.type === 'multiselect'"
                           :form-control="control"></form-multi-select>
        <form-select v-if="control.type === 'select'"
                     :form-control="control"></form-select>
        <b-form-input v-if="control.type === 'number'"
                      :name="control.name"
                      type="number"
                      :number="true"
                      :value="control.default"
                     :form-control="control"></b-form-input>
    </b-col>
</template>

<script lang="ts">
    import Vue from "vue";
    import {BCol, BFormInput} from "bootstrap-vue";
    import FormMultiSelect from "./FormMultiSelect.vue";
    import FormSelect from "./FormSelect.vue";
    import {FormControl} from "./fakeFormMeta";

    export default Vue.extend<{}, {}, {}, { control: FormControl, colWidth: string }>({
        props: {
            control: Object,
            colWidth: String
        },
        components: {
            BCol,
            BFormInput,
            FormMultiSelect,
            FormSelect
        },
    });
</script>