<template>
    <div id="model-options">
        <div v-if="loading" class="text-center">
            <loading-spinner size="lg"></loading-spinner>
            <h2 id="loading-message" v-translate="'loadingOptions'"></h2>
        </div>
        <dynamic-form v-if="!loading && !hasOptionsError"
                      v-model:formMeta="modelOptions"
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
    import { defineComponent } from "vue";
    import i18next from "i18next";
    import {DynamicFormData, DynamicFormMeta, DynamicForm} from "@reside-ic/vue-next-dynamic-form";
    import LoadingSpinner from "../LoadingSpinner.vue";
    import Tick from "../Tick.vue";

    import {mapActionByName, mapGetterByName, mapMutationByName, mapStateProp, mapStateProps} from "../../utils";
    import {ModelOptionsMutation} from "../../store/modelOptions/mutations";
    import {ModelOptionsState} from "../../store/modelOptions/modelOptions";
    import ResetConfirmation from "../resetConfirmation/ResetConfirmation.vue";
    import {RootState} from "../../root";
    import {Language} from "../../store/translations/locales";
    import ErrorAlert from "../ErrorAlert.vue";

    const namespace = "modelOptions";

    export default defineComponent({
        data() {
            return {
                showConfirmation: false
            }
        },
        name: "ModelOptions",
        computed: {
            ...mapStateProps(namespace, {
                loading: (state: ModelOptionsState) => state.fetching,
                valid: (state: ModelOptionsState) => state.valid,
                validating: (state: ModelOptionsState) => state.validating,
                validateError: (state: ModelOptionsState) => state.validateError,
                hasValidateError: (state: ModelOptionsState) => !!state.validateError,
                hasOptionsError: (state: ModelOptionsState) => !!state.optionsError,
                optionsError: (state: ModelOptionsState) => state.optionsError
            }),
            currentLanguage: mapStateProp<RootState, Language>(null,
                (state: RootState) => state.language),
            selectText(): string {
                return i18next.t("select", {lng: this.currentLanguage})
            },
            requiredText(): string {
                return i18next.t("required", {lng: this.currentLanguage})
            },
            validateText(): string {
                return i18next.t("validate", {lng: this.currentLanguage})
            },
            editsRequireConfirmation: mapGetterByName("stepper", "editsRequireConfirmation"),
            modelOptions: {
                get() {
                    return this.$store.state.modelOptions.optionsFormMeta
                },
                set(newVal: DynamicFormMeta) {
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
            handleValidation(options: DynamicFormData) {
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
