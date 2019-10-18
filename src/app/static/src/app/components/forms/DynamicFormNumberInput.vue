<template>
    <b-form-input :name="formControl.name"
                  type="number"
                  :number="true"
                  :value="formControl.default"
                  :min="formControl.min"
                  :max="formControl.max"
                  :required="formControl.required"
                  @change="change"></b-form-input>
</template>

<script lang="ts">
    import Vue from "vue";
    import {BFormInput} from "bootstrap-vue";
    import {NumberControl} from "./types";

    interface Props {
        formControl: NumberControl
    }

    export default Vue.extend<{}, {}, {}, Props>({
        name: "DynamicFormNumberInput",
        props: {
            formControl: Object
        },
        methods: {
            change(value: string) {
                this.$emit("change", value);
            }
        },
        components: {
            BFormInput
        }
    })
</script>
