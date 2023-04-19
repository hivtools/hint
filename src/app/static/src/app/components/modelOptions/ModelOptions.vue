<template>
    <div id="model-options">
        <div v-if="loading" class="text-center">
            <loading-spinner size="lg"></loading-spinner>
            <h2 id="loading-message" v-translate="'loadingOptions'"></h2>
        </div>
        <dynamic-form v-if="!loading && !hasOptionsError"
                      :formMeta="modelOptions"
                      @update:formMeta="newOptions => modelOptions = newOptions"
                      :submit-text="validateText"
                      @confirm="confirmEditing"
                      @submit="handleValidation"
                      :required-text="requiredText"
                      :select-text="selectText"></dynamic-form>
        <error-alert v-if="hasOptionsError" :error="optionsError || {detail: ' ', error: ' '}"></error-alert>
        <div v-if="validating" id="validating" class="mt-3">
            <loading-spinner size="xs"></loading-spinner>
            <span v-translate="'validating'"></span>
        </div>
        <h4 v-if="valid" class="mt-3">
            <span v-translate="'optionsValid'"></span>
            <tick color="#e31837" width="20px"></tick>
        </h4>
        <error-alert v-if="hasValidateError" :error="validateError || {detail: ' ', error: ' '}"></error-alert>
        <reset-confirmation :continue-editing="continueEditing"
                            :cancel-editing="cancelEditing"
                            :open="showConfirmation"></reset-confirmation>
    </div>

</template>
<script lang="ts">
    import {ComputedGetter} from "vue";
    import i18next from "i18next";
    import {DynamicFormData, DynamicFormMeta} from "../../vue-dynamic-form/src/types";
    import DynamicForm from "../../vue-dynamic-form/src/DynamicForm.vue";
    import LoadingSpinner from "../LoadingSpinner.vue";
    import Tick from "../Tick.vue";

    import {mapActionByName, mapGetterByName, mapMutationByName, mapStateProp, mapStateProps} from "../../utils";
    import {ModelOptionsMutation} from "../../store/modelOptions/mutations";
    import {ModelOptionsState} from "../../store/modelOptions/modelOptions";
    import ResetConfirmation from "../resetConfirmation/ResetConfirmation.vue";
    import {StepDescription} from "../../store/stepper/stepper";
    import {RootState} from "../../root";
    import {Language} from "../../store/translations/locales";
    import ErrorAlert from "../ErrorAlert.vue";
    import { defineComponentVue2GetSet } from "../../defineComponentVue2/defineComponentVue2";
    import { Error } from "../../generated";

    interface Methods {
        fetchOptions: () => void
        validate: (data: DynamicFormData) => void
        handleValidation: (data: DynamicFormData) => void
        unValidate: () => void
        update: (data: DynamicFormMeta) => void
        cancelEditing: () => void
        continueEditing: () => void
        confirmEditing: (e: Event) => void
    }

    interface Computed extends Record<string, any> {
        modelOptions: {
            get: ComputedGetter<DynamicFormMeta>,
            set: (newVal: DynamicFormMeta) => void
        }
        loading: ComputedGetter<boolean>
        valid: ComputedGetter<boolean>
        validating: ComputedGetter<boolean>,
        validateError: ComputedGetter<Error | null>
        hasOptionsError: ComputedGetter<boolean>
        optionsError: ComputedGetter<Error | null>
        editsRequireConfirmation: ComputedGetter<boolean>
        currentLanguage: ComputedGetter<Language>
        selectText: ComputedGetter<string>
        requiredText: ComputedGetter<string>
        validateText: ComputedGetter<string>
    }

    interface Data {
        showConfirmation: boolean
    }

    type ModelOptionsStateKeys = "loading" |
        "valid" |
        "validating" |
        "validateError" |
        "hasValidateError" |
        "hasOptionsError" |
        "optionsError"

    const namespace = "modelOptions";

    export default defineComponentVue2GetSet<Data, Methods, Computed>({
        data() {
            return {
                showConfirmation: false
            }
        },
        name: "ModelOptions",
        computed: {
            ...mapStateProps<ModelOptionsState, ModelOptionsStateKeys>(namespace, {
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
                return i18next.t("select", {lng: this.currentLanguage})
            },
            requiredText() {
                return i18next.t("required", {lng: this.currentLanguage})
            },
            validateText() {
                return i18next.t("validate", {lng: this.currentLanguage})
            },
            editsRequireConfirmation: mapGetterByName("stepper", "editsRequireConfirmation"),
            modelOptions: {
                get() {
                    return this.$store.state.modelOptions.optionsFormMeta
                },
                set(newVal: DynamicFormMeta) {
                    console.log(["set", newVal])
                    this.update(newVal)
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
            unValidate: mapMutationByName(namespace, ModelOptionsMutation.UnValidate),
            fetchOptions: mapActionByName(namespace, "fetchModelRunOptions"),
            validate: mapActionByName(namespace, "validateModelOptions"),
            handleValidation(options) {
                if (options) {
                    this.validate(options)
                }
            }
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
