<template>
    <dynamic-form :form-meta="form"
                  submit-text="Validate"
                  @submit="validated"></dynamic-form>
</template>
<script lang="ts">
    import Vue from "vue";
    import DynamicForm from "../forms/DynamicForm.vue";
    import {DynamicFormMeta, formMeta} from "../forms/types";
    import {mapActionsByNames} from "../../utils";

    interface Methods {
        validated: () => void
    }

    export default Vue.extend<{ form: DynamicFormMeta }, { validated: () => void }, {}, {}>({
        name: "ModelOptions",
        data() {
            return {form: formMeta}
        },
        methods: {
            ...mapActionsByNames<keyof Methods>("modelOptions", ["validated"])
        },
        components: {
            DynamicForm
        }
    });
</script>