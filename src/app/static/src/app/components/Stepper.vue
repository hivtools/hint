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
                     :class="[{'enabled': isEnabled(step.number + 1)}]">
                    <hr/>
                </div>
            </template>
        </div>
        <div class="row mt-2">
            <div class="col">
                <a href="#" id="back"
                   v-on:click="back"
                   class="text-uppercase font-weight-bold pr-1"
                   :class="{'disabled': activeStep === 1}"
                   v-translate="'back'"></a>/
                <a href="#" id="continue"
                   v-on:click="next"
                   class="text-uppercase font-weight-bold"
                   :class="{'disabled': !isComplete(activeStep)}"
                   v-translate="'continue'"></a>
            </div>
        </div>
        <hr/>
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
    import { mapGettersByNames, mapStateProps} from "../utils";
    import {Project} from "../types";
    import {ProjectsState} from "../store/projects/projects";

    interface ComputedState {
        activeStep: number,
        steps: StepDescription[],
        currentProject: Project | null
        projectLoading: boolean
    }

    interface ComputedGetters {
        ready: boolean,
        complete: boolean,
        loadingFromFile: boolean
        loading: boolean
    }

    const namespace: string = 'stepper';

    export default Vue.extend<{}, any, ComputedState & ComputedGetters, {}>({
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
            ...mapGettersByNames<keyof ComputedGetters>(namespace, ["ready", "complete"]),
            loading: function () {
                return this.loadingFromFile || !this.ready;
            },
            ...mapGetters(["isGuest"]),
        },
        methods: {
            ...mapActions(namespace, ["jump", "next"]),
            ...mapActions(["validate"]),
            back() {
                this.jump(this.activeStep -1);
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
                return !this.loading && this.complete[num];
            }
        },
        created() {
            //redirect to Projects if logged in with no currentProject
            if ((!this.isGuest) && (this.currentProject== null) && (!this.projectLoading)) {
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
            VersionStatus
        },
        watch: {
            ready: function (newVal) {
                if (newVal) {
                    this.validate()
                }
            }
        }
    });

</script>
