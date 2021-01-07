<template>
    <div id="model-options">
        <div v-if="loading" class="text-center">
            <loading-spinner size="lg"></loading-spinner>
            <h2 id="loading-message" v-translate="'loadingOptions'"></h2>
        </div>
        <dynamic-form ref="form"
                      v-if="!loading"
                      v-model="calibrateOptions"
                      @submit="submitCalibrate"
                      :required-text="requiredText"
                      :select-text="selectText"
                      :include-submit-button="false"></dynamic-form>
        <button v-if="!loading"
                class="btn"
                :class="calibrating ? 'btn-secondary' : 'btn-submit'"
                :disabled="calibrating"
                @click="submitForm">
            {{submitText}}
        </button>
        <div v-if="calibrating" id="calibrating" class="mt-3">
            <loading-spinner size="xs"></loading-spinner>
            <span v-if="!progressMessage" v-translate="'calibrating'"></span>
            <span v-else>{{progressMessage}}</span>
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
        submitCalibrate: (data: DynamicFormData) => void
        update: (data: DynamicFormMeta) => void
        submitForm: (e: Event) => void
    }

    interface Computed {
        calibrateOptions: DynamicFormMeta
        loading: boolean
        calibrating: boolean
        complete: boolean
        currentLanguage: Language
        selectText: string
        requiredText: string,
        submitText: string,
        hasError: boolean,
        error: Error,
        progressMessage: string
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
                error: s => s.error,
                progressMessage: s => {
                    if (s.status && s.status.progress && s.status.progress.length > 0) {
                        const p = s.status.progress[0]; //This may be either a string or ProgressPhase
                        return (typeof p =="string") ? p : `${p.name}: ${p.helpText}`
                    } else {
                        return null;
                    }
                }
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
            submitCalibrate: mapActionByName(namespace,"submit"),
            fetchOptions: mapActionByName(namespace, "fetchModelCalibrateOptions"),
            submitForm() {
                (this.$refs.form as any).submit()
            }
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
