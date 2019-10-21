<template>
    <dynamic-form v-model="modelOptions"
                  submit-text="Validate"
                  @submit="validate"></dynamic-form>
</template>
<script lang="ts">
    import Vue from "vue";
    import DynamicForm from "../forms/DynamicForm.vue";
    import {DynamicFormData, DynamicFormMeta} from "../forms/types";
    import {mapMutationsByNames} from "../../utils";
    interface Methods {
        validate: (data: DynamicFormData) => void
        update: (data: DynamicFormMeta) => void
    }
    export default Vue.extend<{ form: DynamicFormMeta }, Methods, {modelOptions: DynamicFormMeta}, {}>({
        name: "ModelOptions",
        computed: {
            modelOptions: {
                get () {
                    return this.$store.state.modelOptions.optionsFormMeta
                },
                set (value: DynamicFormMeta) {
                    this.update(value);
                }
            }
        },
        methods: {
            ...mapMutationsByNames<keyof Methods>("modelOptions", ["validate", "update"])
        },
        components: {
            DynamicForm
        }
    });
</script>
