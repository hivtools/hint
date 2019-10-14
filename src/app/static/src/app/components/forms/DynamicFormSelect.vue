<template>
    <b-form-select :options="formControl.options"
                   :plain="true"
                   :name="formControl.name"
                   :value="formControl.default">
        <template v-if="!formControl.default" v-slot:first>
            <option :value="null" disabled>Select...</option>
        </template>
    </b-form-select>
</template>

<script lang="ts">
    import Vue from "vue";
    import {BFormSelect} from "bootstrap-vue";
    import {SelectControl} from "./fakeFormMeta";

    interface Props {
        formControl: SelectControl
    }

    export default Vue.extend<{}, {}, {}, Props>({
        name: "DynamicFormSelect",
        props: {
            formControl: Object
        },
        components: {
            BFormSelect
        }
    })
</script>