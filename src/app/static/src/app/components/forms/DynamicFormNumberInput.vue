<template>
    <b-form-input :name="formControl.name"
                  type="number"
                  :number="true"
                  v-model="formControl.value"
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
        model: {
            prop: "formControl",
            event: "change"
        },
        props: {
            formControl: {
                type: Object
            }
        },
        methods: {
            change() {
                this.$emit("change", this.formControl);
            }
        },
        components: {
            BFormInput
        }
    })
</script>
