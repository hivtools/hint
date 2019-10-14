<template>
    <b-form-input v-if="formControl.type === 'number'"
                  :name="formControl.name"
                  type="number"
                  :number="true"
                  :value="formControl.default"
                  :form-control="formControl"
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
        name: "FormSelect",
        props: {
            formControl: Object
        },
        components: {
            BFormInput
        }
    })
</script>
