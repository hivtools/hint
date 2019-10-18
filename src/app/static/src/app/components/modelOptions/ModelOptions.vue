<template>
    <dynamic-form :form-meta="form"
                  submit-text="Validate"
                  @change="save"
                  @submit="save"></dynamic-form>
</template>
<script lang="ts">
    import Vue from "vue";
    import DynamicForm from "../forms/DynamicForm.vue";
    import {DynamicFormData, DynamicFormMeta, formMeta} from "../forms/types";
    import {mapActionsByNames} from "../../utils";

    interface Methods {
        save: (data: DynamicFormData) => void
    }

    export default Vue.extend<{ form: DynamicFormMeta }, Methods, {}, {}>({
        name: "ModelOptions",
        data() {
            return {form: formMeta}
        },
        methods: {
            ...mapActionsByNames<keyof Methods>("modelOptions", ["save"])
        },
        components: {
            DynamicForm
        }
    });
</script>