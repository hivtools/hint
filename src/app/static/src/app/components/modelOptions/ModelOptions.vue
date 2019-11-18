<template>
    <dynamic-form v-model="modelOptions"
                  submit-text="Validate"
                  @submit="Validate"></dynamic-form>
</template>
<script lang="ts">
    import Vue from "vue";
    import DynamicForm from "../forms/DynamicForm.vue";
    import {DynamicFormData, DynamicFormMeta} from "../forms/types";
    import {mapMutationsByNames} from "../../utils";
    import {ModelOptionsMutation} from "../../store/modelOptions/mutations";

    interface Methods {
        [ModelOptionsMutation.Validate]: (data: DynamicFormData) => void
        [ModelOptionsMutation.Update]: (data: DynamicFormMeta) => void
    }

    export default Vue.extend<{ form: DynamicFormMeta }, Methods, { modelOptions: DynamicFormMeta }, {}>({
        name: "ModelOptions",
        computed: {
            modelOptions: {
                get() {
                    return this.$store.state.modelOptions.optionsFormMeta
                },
                set(value: DynamicFormMeta) {
                    this[ModelOptionsMutation.Update](value);
                }
            }
        },
        methods: {
            ...mapMutationsByNames<keyof Methods>("modelOptions",
                [ModelOptionsMutation.Update, ModelOptionsMutation.Validate])
        },
        components: {
            DynamicForm
        }
    });
</script>
