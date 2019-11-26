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
        update: (data: DynamicFormMeta) => void
        cancelEditing: () => void
    }

    interface Computed {
        modelOptions: DynamicFormMeta
        fetching: boolean
        loading: boolean
        valid: boolean
        editsRequireConfirmation: boolean
        laterCompleteSteps: StepDescription[]
    }

    interface Data {
        reloading: boolean
        showConfirmation: boolean,
        continueEditing: () => void
    }

    const namespace = "modelOptions";

    export default Vue.extend<Data, Methods, Computed, {}>({
        data() {
            return {
                continueEditing: () => {
                },
                showConfirmation: false,
                reloading: false
            }
        },
        name: "ModelOptions",
        computed: {
            laterCompleteSteps: mapGetterByName("stepper", "laterCompleteSteps"),
            editsRequireConfirmation: mapGetterByName("stepper", "editsRequireConfirmation"),
            ...mapStateProps<ModelOptionsState, keyof Computed>(namespace, {
                fetching: s => s.fetching,
                valid: s => s.valid
            }),
            loading() {
                return this.fetching || this.reloading
            },
            modelOptions: {
                get() {
                    return this.$store.state.modelOptions.optionsFormMeta
                },
                set(value: DynamicFormMeta) {
                    if (this.editsRequireConfirmation) {
                        this.showConfirmation = true;
                        this.continueEditing = () => {
                            this.update(value);
                            this.showConfirmation = false;
                        }
                    } else {
                        this.update(value);
                    }
                }
            }
        },
        methods: {
            cancelEditing() {
                this.showConfirmation = false;

                // This is a little awkward - the form data in the store has not been updated
                // but the html input element has. We force the component to re-render so that
                // the correct data is reflected once again.
                this.reloading = true;
                const self = this;
                setTimeout(() => {
                    self.reloading = false;
                })
            },
            update: mapMutationByName(namespace, ModelOptionsMutation.Update),
            validate: mapMutationByName(namespace, ModelOptionsMutation.Validate),
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
