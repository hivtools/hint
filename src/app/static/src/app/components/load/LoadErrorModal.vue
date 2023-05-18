<template>
    <div id="load-error-modal">
        <modal :open="hasError">
            <h4 v-translate="'loadError'"></h4>
            <p v-if="showInvalidSteps">
              There was a problem loading the following steps:
              <ul>
                <li v-for="step in invalidSteps" :key="step" v-translate="stepTextKey(step)"></li>
              </ul>
              <template v-if="lastValidStep >= 1">
                Retry load or rollback to the last valid step (<span v-translate="stepTextKey(lastValidStep)" />)?
                Rollback will result in a loss of all project data from subsequent steps.
              </template>
              <template v-else>
                Retry load or rollback?
                Rollback will result in a loss of all project data.
              </template>
            </p>
            <p v-else>{{ loadError }}</p>
            <template v-slot:footer>
              <template v-if="showInvalidSteps">
                <button id="retry-load"
                        type="button"
                        class="btn btn-red"
                        data-dismiss="modal"
                        aria-label="Retry"
                        @click="retryLoad"
                        v-translate="'retry'">
                </button>
                <button id="rollback-load"
                        type="button"
                        class="btn btn-red"
                        data-dismiss="modal"
                        aria-label="Rollback"
                        @click="rollbackInvalidState"
                        v-translate="'rollback'">
                </button>
              </template>
              <template v-else>
                  <button id="ok-load-error"
                          type="button"
                          class="btn btn-red"
                          data-dismiss="modal"
                          aria-label="Close"
                          @click="clearLoadError"
                          v-translate="'ok'">
                  </button>
              </template>
            </template>
        </modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue"
    import Modal from "../Modal.vue";
    import {mapActionByName, mapStateProp, mapStateProps} from "../../utils";
    import {LoadingState, LoadState} from "../../store/load/state";
    import {RootState} from "../../root";
    import {Project, Version, VersionIds} from "../../types";
    import {ProjectsState} from "../../store/projects/projects";
    import {StepDescription, StepperState} from "../../store/stepper/stepper";

    interface LoadComputed  {
        loadError: string
        hasError: boolean
    }

    interface ProjectComputed {
      currentProject: Project,
      currentVersion: Version
    }

    interface StepperComputed {
        steps: StepDescription[]
    }

    interface Computed extends LoadComputed, ProjectComputed, StepperComputed {
        invalidSteps: number[],
        showInvalidSteps: boolean,
        lastValidStep: number
    }

    interface Methods {
        clearLoadError: () => void,
        rollbackInvalidState: () => void,
        loadVersion: (versionIds: VersionIds) => void,
        retryLoad: () => void,
        stepTextKey: (stepNumber: number) => string
    }

    export default Vue.extend<unknown, Methods, Computed>({
        name: "LoadErrorModal",
        computed: {
            ...mapStateProps<LoadState, keyof LoadComputed>("load", {
              hasError: state => state.loadingState === LoadingState.LoadFailed,
              loadError: state => state.loadError && state.loadError.detail
            }),
            ...mapStateProps<ProjectsState, keyof ProjectComputed>("projects", {
              currentProject: state => state.currentProject,
              currentVersion: state => state.currentVersion
            }),
            ...mapStateProps<StepperState, keyof StepperComputed>("stepper", {
              steps: state => state.steps
            }),
            invalidSteps: mapStateProp<RootState, number[]>(null, (state) => state.invalidSteps),
            showInvalidSteps: function() { return this.invalidSteps?.length > 0; },
            lastValidStep: function() { return Math.min(...this.invalidSteps!) - 1; }
        },
        methods: {
            clearLoadError: mapActionByName("load", "clearLoadState"),
            rollbackInvalidState: mapActionByName(null, "rollbackInvalidState"),
            loadVersion: mapActionByName("projects", "loadVersion"),
            retryLoad() {
              const versionId = this.currentVersion!.id;
              const projectId = this.currentProject!.id;
              console.log(`Loading proj with version ${versionId} and project ${projectId}`);
              this.loadVersion({
                versionId,
                projectId
              })
            },
            stepTextKey(stepNumber: number) {
                return this.steps.find(step => step.number === stepNumber)?.textKey || stepNumber.toString();
            }
        },
        components: {
            Modal
        }
    })
</script>
