<template>
    <div id="model-options">
        <div v-if="handleLoading" class="text-center">
            <loading-spinner size="lg"></loading-spinner>
            <h2 id="loading-message" v-translate="'loadingOptions'"></h2>
        </div>
        <dynamic-form v-if="!loading"
                      v-model="modelOptions"
                      submit-text="Validate"
                      v-on:mousedown.native="confirmEditing"
                      @submit="validate"
                      :required-text="requiredText"
                      :select-text="selectText"></dynamic-form>

        <div v-if="hasOptionsError" id="model-option">
            <div v-if="!otherError" class="error-message" id="model-option-error">
                <span v-translate="'loadOptionsError'"></span>
                {{ optionsError.key }}
            </div>
            <error-alert v-else :error="optionsError"></error-alert>
        </div>
        <div v-if="validating" id="validating" class="mt-3">
            <loading-spinner size="xs"></loading-spinner>
            <span v-translate="'validating'"></span>
        </div>
        <h4 v-if="valid" class="mt-3">
            <span v-translate="'optionsValid'"></span>
            <tick color="#e31837" width="20px"></tick>
        </h4>
        <error-alert v-if="hasValidateError" :error="validateError"></error-alert>
        <reset-confirmation :continue-editing="continueEditing"
                            :cancel-editing="cancelEditing"
                            :steps="laterCompleteSteps"
                            :open="showConfirmation"></reset-confirmation>
    </div>

</template>
<script lang="ts">
    import Vue from "vue";
    import i18next from "i18next";
    import {DynamicFormData, DynamicFormMeta, DynamicForm} from "@reside-ic/vue-dynamic-form";

    import LoadingSpinner from "../LoadingSpinner.vue";
    import Tick from "../Tick.vue";

    import {mapActionByName, mapGetterByName, mapMutationByName, mapStateProp, mapStateProps} from "../../utils";
    import {ModelOptionsMutation} from "../../store/modelOptions/mutations";
    import {ModelOptionsState} from "../../store/modelOptions/modelOptions";
    import ResetConfirmation from "../ResetConfirmation.vue";
    import {StepDescription} from "../../store/stepper/stepper";
    import {RootState} from "../../root";
    import {Language} from "../../store/translations/locales";
    import ErrorAlert from "../ErrorAlert.vue";
    import {ADRSchemas} from "../../types";
    import {ModelRunState} from "../../store/modelRun/modelRun";

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
        errorMessage: string
        editsRequireConfirmation: boolean
        laterCompleteSteps: StepDescription[]
        currentLanguage: Language
        selectText: string
        requiredText: string
        hasOptionsError: boolean
        handleLoading: boolean,
        optionsError: any
        otherError: boolean
    }

    interface Data {
        showConfirmation: boolean
    }

    const namespace = "modelOptions";

    export default Vue.extend<Data, Methods, Computed, unknown>({
        data() {
            return {
                showConfirmation: false
            }
        },
        name: "ModelOptions",
        computed: {
            ...mapStateProps<ModelOptionsState, keyof Computed>(namespace, {
                loading: state => state.fetching,
                valid: state => state.valid,
                validating: state => state.validating,
                validateError: state => state.validateError,
                hasValidateError: state => !!state.validateError,
                hasOptionsError: state => !!state.optionsError,
                optionsError: state => state.optionsError
            }),
            currentLanguage: mapStateProp<RootState, Language>(null,
                (state: RootState) => state.language),
            selectText() {
                return i18next.t("select", this.currentLanguage)
            },
            requiredText() {
                return i18next.t("required", this.currentLanguage)
            },
            laterCompleteSteps: mapGetterByName("stepper", "laterCompleteSteps"),
            editsRequireConfirmation: mapGetterByName("stepper", "editsRequireConfirmation"),
            modelOptions: {
                get() {
                    return this.$store.state.modelOptions.optionsFormMeta
                },
                set(value: DynamicFormMeta) {
                    this.update(value);
                }
            },
            handleLoading() {
                if (this.loading && this.hasOptionsError) {
                    return !this.loading
                }
                return this.loading
            },
            otherError() {
                return this.optionsError.error === "OTHER_ERROR"
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
            unValidate: mapMutationByName(namespace, ModelOptionsMutation.UnValidate),
            fetchOptions: mapActionByName(namespace, "fetchModelRunOptions"),
            validate: mapActionByName(namespace, "validateModelOptions")
        },
        components: {
            DynamicForm,
            LoadingSpinner,
            Tick,
            ResetConfirmation,
            ErrorAlert
        },
        mounted() {
            this.fetchOptions();
        }
    });
</script>
