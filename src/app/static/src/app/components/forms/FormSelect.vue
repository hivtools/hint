<template>
    <b-form-select :options="formControl.options"
                   :plain="true"
                   :name="formControl.name"
                   :value="formControl.default || formControl.options[0]"></b-form-select>
</template>

<script lang="ts">
    import Vue from "vue";
    import {BFormSelect} from "bootstrap-vue";
    import {SelectControl} from "./fakeFormMeta";

    interface Props {
        formControl: SelectControl
    }

    export default Vue.extend<{}, {}, {}, Props>({
        name: "FormSelect",
        props: {
            formControl: Object
        },
        components: {
            BFormSelect
        }
    })
</script>