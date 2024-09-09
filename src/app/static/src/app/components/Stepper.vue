<template>
    <div id="stepper">
        <div class="row">
            <template v-for="step in steps" :key="step.number">
                <step :active="isActive(step.number)"
                      :number="step.number"
                      :text-key="step.textKey"
                      :enabled="isEnabled(step.number)"
                      :complete="isComplete(step.number)"
                      @jump="jump">
                </step>
                <div class="col step-connector mt-2" v-if="step.number < steps.length"
                     :key="step.number + 'conn'"
                     :class="[{'enabled': isEnabled(step.number + 1)}]">
                    <hr/>
                </div>
            </template>
        </div>
        <stepper-navigation v-bind="navigationProps"/>
        <hr/>
        <div v-if="loading" class="text-center">
            <loading-spinner size="lg"></loading-spinner>
            <h2 id="loading-message" v-translate="'loadingData'"></h2>
        </div>
        <div v-if="!loading" class="content">
            <warning-alert v-if="activeStep !== 3" :warnings="activeStepWarnings" @clear-warnings="clearWarnings"></warning-alert>
            <version-status></version-status>
            <div class="pt-4">
                <adr-integration v-if="isActive(1)"></adr-integration>
                <upload-inputs v-if="isActive(1)"></upload-inputs>
                <review-inputs v-if="isActive(2)"></review-inputs>
                <model-options v-if="isActive(3)"></model-options>
                <model-run v-if="isActive(4)"></model-run>
                <model-calibrate v-if="isActive(5)"></model-calibrate>
                <model-output v-if="isActive(6)"></model-output>
                <download-results v-if="isActive(7)"></download-results>
            </div>
            <load-invalid-modal></load-invalid-modal>
            <template v-if="activeStep === 3">
              <warning-alert :warnings="activeStepWarnings" @clear-warnings="clearWarnings"></warning-alert>
            </template>
        </div>
        <template v-if="activeStep !== 4">
            <hr class="mt-3"/>
            <stepper-navigation v-bind="navigationProps"/>
        </template>
    </div>
</template>

<script lang="ts">
    import {mapActions} from "vuex";
    import AdrIntegration from "./adr/ADRIntegration.vue";
    import Step from "./Step.vue";
    import UploadInputs from "./uploadInputs/UploadInputs.vue";
    import ReviewInputs from "./reviewInputs/ReviewInputs.vue";
    import LoadingSpinner from "./LoadingSpinner.vue";
    import ModelRun from "./modelRun/ModelRun.vue";
    import ModelCalibrate from "./modelCalibrate/ModelCalibrate.vue";
    import ModelOutput from "./modelOutput/ModelOutput.vue";
    import DownloadResults from "./downloadResults/DownloadResults.vue";
    import WarningAlert from "./WarningAlert.vue";
    import LoadInvalidModal from "./load/LoadInvalidModal.vue";
    import {StepDescription, StepperState} from "../store/stepper/stepper";
    import {LoadingState, LoadState} from "../store/load/state";
    import ModelOptions from "./modelOptions/ModelOptions.vue";
    import VersionStatus from "./projects/VersionStatus.vue";
    import {mapGettersByNames, mapStateProp, mapStateProps, mapMutationByName, mapGetterByName} from "../utils";
    import {StepperNavigationProps, StepWarnings, Step as StepEnum} from "../types";
    import {ProjectsState} from "../store/projects/projects";
    import {RootState} from "../root";
    import StepperNavigation from "./StepperNavigation.vue";
    import {ModelRunMutation} from "../store/modelRun/mutations";
    import {ModelOptionsMutation} from "../store/modelOptions/mutations";
    import {ModelCalibrateMutation} from "../store/modelCalibrate/mutations";
    import {GenericChartMutation} from "../store/genericChart/mutations";
    import {SurveyAndProgramMutation} from "../store/surveyAndProgram/mutations";
    import { defineComponent } from "vue";

    const namespace = 'stepper';

    const readyCompleteGetters = ["ready", "complete"] as const
    interface ReadyCompleteGetters {
        ready: boolean,
        complete: boolean[]
    }

    export default defineComponent({
        computed: {
            ...mapStateProps(namespace, {
                activeStep: (state: StepperState) => state.activeStep,
                steps: (state: StepperState) => state.steps
            }),
            ...mapStateProps("load", {
                loadingFromFile: (state: LoadState) => [LoadingState.SettingFiles, LoadingState.UpdatingState].includes(state.loadingState)
            }),
            ...mapStateProps("projects", {
                currentProject: (state: ProjectsState) => state.currentProject,
                projectLoading: (state: ProjectsState) => state.loading
            }),
            updatingLanguage: mapStateProp<RootState, boolean>(null,
                (state: RootState) => state.updatingLanguage
            ),
            ...mapGettersByNames<typeof readyCompleteGetters, ReadyCompleteGetters>(namespace, readyCompleteGetters),
            loading: function (): boolean {
                return this.loadingFromFile || this.updatingLanguage || !this.ready;
            },
            isGuest: mapGetterByName<boolean>(null, "isGuest"),
            warnings: mapGetterByName<(stepName: string) => StepWarnings>(null, "warnings"),
            navigationProps(): StepperNavigationProps {
                return {
                    back: this.back,
                    backDisabled: this.activeStep === 1,
                    next: this.next,
                    nextDisabled: this.activeContinue(this.activeStep)
                };
            },
            activeStepTextKey(): string {
                return this.steps.find((step: StepDescription) => step.number === this.activeStep)!.textKey;
            },
            activeStepWarnings(): StepWarnings {
                return this.warnings(this.activeStepTextKey);
            }
        },
        methods: {
            ...mapActions(namespace, ["jump", "next"]),
            ...mapActions(["validate"]),
            back() {
                this.jump(this.activeStep - 1);
            },
            isActive(num: number) {
                return !this.loading && this.activeStep == num;
            },
            isEnabled(num: number) {
                return !this.loading && this.steps.slice(0, num)
                    .filter((s: { number: number }) => this.complete[s.number])
                    .length >= num - 1
            },
            isComplete(num: number) {
                if (this.isActive(7)) {
                    this.complete[num] = true
                    return !this.loading;
                }
                return !this.loading && this.complete[num];
            },
            activeContinue(activeStep: number) {
                if(activeStep === 7) {
                    return true
                }
                return !this.isComplete(activeStep)
            },
            clearReviewInputsWarnings() {
                this.clearSurveyAndProgramWarnings()
                this.clearGenericChartWarnings()
            },
            clearWarnings(){
                const mutationMethods: { [key: number]: () => void; } = {
                    2: this.clearReviewInputsWarnings,
                    3: this.clearModelOptionsWarnings,
                    4: this.clearModelRunWarnings,
                    5: this.clearModelCalibrateWarnings,
                    6: this.clearModelCalibrateWarnings,
                    7: this.clearModelCalibrateWarnings
                }
                if (this.activeStep in mutationMethods){
                    mutationMethods[this.activeStep]()
                }
            },
            clearModelRunWarnings: mapMutationByName("modelRun", ModelRunMutation.ClearWarnings),
            clearModelCalibrateWarnings: mapMutationByName("modelCalibrate", ModelCalibrateMutation.ClearWarnings),
            clearModelOptionsWarnings: mapMutationByName("modelOptions", ModelOptionsMutation.ClearWarnings),
            clearGenericChartWarnings: mapMutationByName("genericChart", GenericChartMutation.ClearWarnings),
            clearSurveyAndProgramWarnings: mapMutationByName("surveyAndProgram", SurveyAndProgramMutation.ClearWarnings)
        },
        beforeMount() {
            //redirect to Projects if logged in with no currentProject
            if ((!this.isGuest) && (this.currentProject == null) && (!this.projectLoading)) {
                this.$router.push('/projects');
            }
        },
        components: {
            AdrIntegration,
            Step,
            UploadInputs,
            ReviewInputs,
            LoadingSpinner,
            LoadInvalidModal,
            ModelRun,
            ModelCalibrate,
            ModelOutput,
            ModelOptions,
            DownloadResults,
            VersionStatus,
            StepperNavigation,
            WarningAlert
        },
        watch: {
            complete: function (){
                // auto-progress from modelRun to modelCalibrate if there are no warnings to display
                if (this.activeStep === StepEnum.FitModel && this.isComplete(StepEnum.FitModel) &&
                    this.isEnabled(StepEnum.CalibrateModel) &&
                        this.activeStepWarnings.modelRun.length === 0) {
                    this.next();
                }
            },
            ready: function (newVal) {
                if (newVal) {
                    this.validate()
                }
            }
        }
    });

</script>
