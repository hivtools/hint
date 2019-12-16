<template>
    <div>
        <div v-if="loading" class="text-center">
            <loading-spinner size="lg"></loading-spinner>
            <h2 id="loading-message" v-translate="'loadingOptions'"></h2>
        </div>
        <dynamic-form v-if="!loading"
                      v-model="modelOptions"
                      submit-text="Validate"
                      v-on:mousedown.native="confirmEditing"
                      @submit="validate"></dynamic-form>
        <h4 v-if="valid" class="mt-3" v-translate="'optionsValid'">
            <tick color="#e31837" width="20px"></tick>
        </h4>
        <reset-confirmation :continue-editing="continueEditing"
                            :cancel-editing="cancelEditing"
                            :steps="laterCompleteSteps"
                            :open="showConfirmation"></reset-confirmation>
    </div>

</template>
<script lang="ts">
    import Vue from "vue";
    import DynamicForm from "../forms/DynamicForm.vue";
    import {DynamicFormData, DynamicFormMeta} from "../forms/types";
    import LoadingSpinner from "../LoadingSpinner.vue";
    import Tick from "../Tick.vue";

    import {mapActionByName, mapGetterByName, mapMutationByName, mapStateProps} from "../../utils";
    import {ModelOptionsMutation} from "../../store/modelOptions/mutations";
    import {ModelOptionsState} from "../../store/modelOptions/modelOptions";
    import ResetConfirmation from "../ResetConfirmation.vue";
    import {StepDescription} from "../../store/stepper/stepper";

    interface Methods {
        fetchOptions: () => void
        validate: (data: DynamicFormData) => void
        unValidate: () => void
        update: (data: DynamicFormMeta) => void
        cancelEditing: () => void
        continueEditing: () => void
        confirmEditing: (e: Event) => void
    }

    interface Computed {
        modelOptions: DynamicFormMeta
        loading: boolean
        valid: boolean
        editsRequireConfirmation: boolean
        laterCompleteSteps: StepDescription[]
    }

    interface Data {
        showConfirmation: boolean
    }

    const namespace = "modelOptions";

    export default Vue.extend<Data, Methods, Computed, {}>({
        data() {
            return {
                showConfirmation: false
            }
        },
        name: "ModelOptions",
        computed: {
            laterCompleteSteps: mapGetterByName("stepper", "laterCompleteSteps"),
            editsRequireConfirmation: mapGetterByName("stepper", "editsRequireConfirmation"),
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
            confirmEditing(e: Event) {
                if (this.editsRequireConfirmation) {
                    e.preventDefault();
                    this.showConfirmation = true;
                }
            },
            cancelEditing() {
                this.showConfirmation = false;
            },
            continueEditing() {
                this.unValidate();
                this.showConfirmation = false;
            },
            update: mapMutationByName(namespace, ModelOptionsMutation.Update),
            validate: mapMutationByName(namespace, ModelOptionsMutation.Validate),
            unValidate: mapMutationByName(namespace, ModelOptionsMutation.UnValidate),
            fetchOptions: mapActionByName(namespace, "fetchModelRunOptions")
        },
        components: {
            DynamicForm,
            LoadingSpinner,
            Tick,
            ResetConfirmation
        },
        mounted() {
            this.fetchOptions();
        }
    });
</script>
