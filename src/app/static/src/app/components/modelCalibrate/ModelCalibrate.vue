<template>
    <div id="model-options">
        <div v-if="loading" class="text-center">
            <loading-spinner size="lg"></loading-spinner>
            <h2 id="loading-message" v-translate="'loadingOptions'"></h2>
        </div>
        <dynamic-form v-if="!loading"
                      v-model="calibrateOptions"
                      :submit-text="submitText"
                      @submit="calibrate"
                      :required-text="requiredText"
                      :select-text="selectText"></dynamic-form>
        <div v-if="calibrating" id="calibrating" class="mt-3">
            <loading-spinner size="xs"></loading-spinner>
            <span v-translate="'calibrating'"></span>
        </div>
        <error-alert v-if="hasError" :error="error"></error-alert>
        <div v-if="complete" id="calibration-complete" class="mt-3">
            <h4 class="d-inline" id="calibrate-complete" v-translate="'calibrationComplete'"></h4>
            <tick color="#e31837" width="20px"></tick>
        </div>
    </div>

</template>
<script lang="ts">
    import Vue from "vue";
    import i18next from "i18next";
    import {DynamicFormData, DynamicFormMeta, DynamicForm} from "@reside-ic/vue-dynamic-form";

    import LoadingSpinner from "../LoadingSpinner.vue";
    import Tick from "../Tick.vue";

    import {mapActionByName, mapGetterByName, mapMutationByName, mapStateProp, mapStateProps} from "../../utils";
    import {ModelCalibrateMutation} from "../../store/modelCalibrate/mutations";
    import {StepDescription} from "../../store/stepper/stepper";
    import {RootState} from "../../root";
    import {Language} from "../../store/translations/locales";
    import {ModelCalibrateState} from "../../store/modelCalibrate/modelCalibrate";
    import ErrorAlert from "../ErrorAlert.vue";

    interface Methods {
        fetchOptions: () => void
        calibrate: (data: DynamicFormData) => void
        update: (data: DynamicFormMeta) => void
    }

    interface Computed {
        calibrateOptions: DynamicFormMeta
        loading: boolean
        calibrating: boolean
        complete: boolean
        editsRequireConfirmation: boolean
        laterCompleteSteps: StepDescription[]
        currentLanguage: Language
        selectText: string
        requiredText: string,
        submitText: string,
        hasError: boolean,
        error: Error
    }

    interface Data {
        showConfirmation: boolean
    }

    const namespace = "modelCalibrate";

    export default Vue.extend<Data, Methods, Computed, unknown>({
        name: "ModelCalibrate",
        data() {
            return {
                showConfirmation: false
            }
        },
        computed: {
            ...mapStateProps<ModelCalibrateState, keyof Computed>(namespace, {
                loading: s => s.fetching,
                calibrating: s => s.calibrating,
                error: s => s.error
            }),
            currentLanguage: mapStateProp<RootState, Language>(null, (state: RootState) => state.language),
            selectText() {
                return i18next.t("select", this.currentLanguage)
            },
            requiredText() {
                return i18next.t("required", this.currentLanguage)
            },
            submitText() {
                return i18next.t("calibrate", {lng: this.currentLanguage})
            },
            laterCompleteSteps: mapGetterByName("stepper", "laterCompleteSteps"),
            editsRequireConfirmation: mapGetterByName("stepper", "editsRequireConfirmation"),
            complete: mapStateProp<ModelCalibrateState, boolean>(namespace, state => state.complete),
            calibrateOptions: {
                get() {
                    return this.$store.state.modelCalibrate.optionsFormMeta
                },
                set(value: DynamicFormMeta) {
                    this.update(value);
                }
            },
            hasError() {
                return !!this.error;
            }
        },
        methods: {
            update: mapMutationByName(namespace, ModelCalibrateMutation.Update),
            calibrate: mapActionByName(namespace,"calibrate"),
            fetchOptions: mapActionByName(namespace, "fetchModelCalibrateOptions")
        },
        components: {
            DynamicForm,
            LoadingSpinner,
            Tick,
            ErrorAlert
        },
        mounted() {
            this.fetchOptions();
        }
    });
</script>
