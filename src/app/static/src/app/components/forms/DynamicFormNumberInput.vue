<template>
    <b-form-input :name="formControl.name"
                  type="number"
                  :number="true"
                  :value="formControl.default"
                  :min="formControl.min"
                  :max="formControl.max"></b-form-input>
</template>

<script lang="ts">
    import Vue from "vue";
    import {BFormInput} from "bootstrap-vue";
    import {NumberControl} from "./fakeFormMeta";

    interface Props {
        formControl: NumberControl
    }

    export default Vue.extend<{}, {}, {}, Props>({
        name: "DynamicFormNumberInput",
        props: {
            formControl: Object
        },
        components: {
            BFormInput
        }
    })
</script>
