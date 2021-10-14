<template>
    <div>
        <div class="row">
            <template v-for="step in steps">
                <step :key="step.number"
                      :active="isActive(step.number)"
                      :number="step.number"
                      :text-key="step.textKey"
                      :enabled="isEnabled(step.number)"
                      :complete="isComplete(step.number)"
                      @jump="jump">
                </step>
                <div class="col step-connector" v-if="step.number < steps.length"
                     :key="step.number + 'conn'"
                     :class="[{'enabled': isEnabled(step.number + 1)}]">
                    <hr/>
                </div>
            </template>
        </div>
        <stepper-navigation v-bind="navigationProps"/>
        <hr/>
        <warnings :location="activeStep" :warnings="['a warning', 'another warning', 'third warning', 'final warning']"></warnings>
        <warnings :location="activeStep" :warnings="['a warning', 'another warning']"></warnings>
        <div v-if="loading" class="text-center">
            <loading-spinner size="lg"></loading-spinner>
            <h2 id="loading-message" v-translate="'loadingData'"></h2>
        </div>
        <div v-if="!loading" class="content">
            <version-status></version-status>
            <div class="pt-4">
                <adr-integration v-if="isActive(1)"></adr-integration>
                <baseline v-if="isActive(1)"></baseline>
                <survey-and-program v-if="isActive(2)"></survey-and-program>
                <model-options v-if="isActive(3)"></model-options>
                <model-run v-if="isActive(4)"></model-run>
                <model-calibrate v-if="isActive(5)"></model-calibrate>
                <model-output v-if="isActive(6)"></model-output>
                <download-results v-if="isActive(7)"></download-results>
            </div>
        </div>
        <template v-if="activeStep === 3">
            <hr class="mt-3"/>
            <stepper-navigation v-bind="navigationProps"/>
        </template>
    </div>
</template>

<script lang="ts">

    import Vue from "vue";
    import {mapActions, mapGetters} from "vuex";
    import AdrIntegration from "./adr/ADRIntegration.vue";
    import Step from "./Step.vue";
    import Baseline from "./baseline/Baseline.vue";
    import SurveyAndProgram from "./surveyAndProgram/SurveyAndProgram.vue";
    import LoadingSpinner from "./LoadingSpinner.vue";
    import ModelRun from "./modelRun/ModelRun.vue";
    import ModelCalibrate from "./modelCalibrate/ModelCalibrate.vue";
    import ModelOutput from "./modelOutput/ModelOutput.vue";
    import DownloadResults from "./downloadResults/DownloadResults.vue";
    import {StepDescription, StepperState} from "../store/stepper/stepper";
    import {LoadingState, LoadState} from "../store/load/load";
    import ModelOptions from "./modelOptions/ModelOptions.vue";
    import VersionStatus from "./projects/VersionStatus.vue";
    import {mapGettersByNames, mapStateProp, mapStateProps} from "../utils";
    import {Project} from "../types";
    import {ProjectsState} from "../store/projects/projects";
    import {RootState} from "../root";
    import StepperNavigation, {Props as StepperNavigationProps} from "./StepperNavigation.vue";
    import Warnings from "./Warnings.vue";

    interface ComputedState {
        activeStep: number,
        steps: StepDescription[],
        currentProject: Project | null
        projectLoading: boolean,
        updatingLanguage: boolean,
        navigationProps: StepperNavigationProps
    }

    interface ComputedGetters {
        ready: boolean,
        complete: boolean,
        loadingFromFile: boolean
        loading: boolean
    }

    const namespace = 'stepper';

    export default Vue.extend<unknown, any, ComputedState & ComputedGetters, unknown>({
        computed: {
            ...mapStateProps<StepperState, keyof ComputedState>(namespace, {
                activeStep: state => state.activeStep,
                steps: state => state.steps
            }),
            ...mapStateProps<LoadState, keyof ComputedState>("load", {
                loadingFromFile: state => [LoadingState.SettingFiles, LoadingState.UpdatingState].includes(state.loadingState)
            }),
            ...mapStateProps<ProjectsState, keyof ComputedState>("projects", {
                currentProject: state => state.currentProject,
                projectLoading: state => state.loading
            }),
            updatingLanguage: mapStateProp<RootState, boolean>(null,
                (state: RootState) => state.updatingLanguage
            ),
            ...mapGettersByNames<keyof ComputedGetters>(namespace, ["ready", "complete"]),
            loading: function () {
                return this.loadingFromFile || this.updatingLanguage || !this.ready;
            },
            ...mapGetters(["isGuest"]),
            navigationProps: function() {
                return {
                    back: this.back,
                    backDisabled: this.activeStep === 1,
                    next: this.next,
                    nextDisabled: this.activeContinue(this.activeStep)
                };
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
            }
        },
        created() {
            //redirect to Projects if logged in with no currentProject
            if ((!this.isGuest) && (this.currentProject == null) && (!this.projectLoading)) {
                this.$router.push('/projects');
            }
        },
        components: {
            AdrIntegration,
            Step,
            Baseline,
            SurveyAndProgram,
            LoadingSpinner,
            ModelRun,
            ModelCalibrate,
            ModelOutput,
            ModelOptions,
            DownloadResults,
            VersionStatus,
            StepperNavigation,
            Warnings
        },
        watch: {
            complete: function (){
                if (this.activeStep === 4 && this.isComplete(4) && this.isEnabled(5)){
                    this.next()
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
