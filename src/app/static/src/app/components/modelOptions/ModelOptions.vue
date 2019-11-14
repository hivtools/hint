<template>
    <div>
        <div v-if="loading" class="text-center">
            <loading-spinner size="lg"></loading-spinner>
            <h2 id="loading-message">Loading options</h2>
        </div>
        <dynamic-form v-if="!loading"
                      v-model="modelOptions"
                      submit-text="Validate"
                      @submit="validate"></dynamic-form>
        <h4 v-if="valid" class="mt-3">Options are valid
            <tick color="#e31837" width="20px"></tick>
        </h4>
    </div>
</template>
<script lang="ts">
    import Vue from "vue";
    import DynamicForm from "../forms/DynamicForm.vue";
    import {DynamicFormData, DynamicFormMeta} from "../forms/types";
    import {mapActionByName, mapMutationsByNames, mapStateProps} from "../../utils";
    import {ModelOptionsState} from "../../store/modelOptions/modelOptions";
    import LoadingSpinner from "../LoadingSpinner.vue";
    import Tick from "../Tick.vue";

    interface Methods {
        fetchOptions: () => void
        validate: (data: DynamicFormData) => void
        update: (data: DynamicFormMeta) => void
    }

    interface Computed {
        modelOptions: DynamicFormMeta
        loading: boolean
        valid: boolean
    }

    const namespace = "modelOptions";

    export default Vue.extend<{ form: DynamicFormMeta }, Methods, Computed, {}>({
        name: "ModelOptions",
        computed: {
            ...mapStateProps<ModelOptionsState, keyof Computed>(namespace, {
                loading: s => s.fetching,
                valid: s => s.valid
            }),
            modelOptions: {
                get() {
                    return this.$store.state.modelOptions.optionsFormMeta
                },
                set(value: DynamicFormMeta) {
                    this.update(value);
                }
            }
        },
        methods: {
            fetchOptions: mapActionByName(namespace, "fetchModelRunOptions"),
            ...mapMutationsByNames<keyof Methods>(namespace, ["validate", "update"])
        },
        components: {
            DynamicForm,
            LoadingSpinner,
            Tick
        },
        mounted() {
            this.fetchOptions();
        }
    });
</script>
