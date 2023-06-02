<template>
  <div id="load-invalid-modal">
    <modal :open="hasInvalidSteps">
      <h4 v-translate="'loadError'"></h4>
      <p>
        <span id="load-invalid-steps" v-translate="'loadInvalidSteps'" />
        <ul id="load-invalid-steps-list">
          <li v-for="step in invalidSteps" :key="step" v-translate="stepTextKey(step)"></li>
        </ul>
        <template v-if="lastValidStep >= 1">
          <span id="load-invalid-steps-from-valid-action" v-translate="'loadInvalidStepsFromValidAction'" />
          <span id="load-invalid-last-valid" v-translate="stepTextKey(lastValidStep)" />.
        </template>
        <span v-else id="load-invalid-steps-all-action" v-translate="'loadInvalidStepsAllAction'" />
        <span v-if="!isGuest" id="load-invalid-steps-rollback-info" v-translate="'loadInvalidStepsRollbackInfo'" />
        <span v-else id="load-invalid-steps-rollback-info-guest" v-translate="'loadInvalidStepsRollbackInfoGuest'" />
      </p>
      <p v-if="!isGuest" id="load-invalid-projects">
          <span id="load-invalid-projects-prefix" v-translate="'loadInvalidStepsProjectLinkPrefix'"></span>
          <router-link id="load-invalid-projects-link" to="/projects" v-translate="'projects'" v-translate:aria-label="'projects'" />
          <span id="load-invalid-projects-suffix" v-translate="'loadInvalidStepsProjectLinkSuffix'"></span>
      </p>
      <template v-slot:footer>
        <button id="retry-load"
                type="button"
                class="btn btn-red"
                v-translate:aria-label="'retry'"
                @click="retryLoad"
                v-translate="'retry'">
        </button>
        <button id="rollback-load"
                type="button"
                class="btn btn-red"
                v-translate:aria-label="'rollback'"
                @click="rollbackInvalidState"
                v-translate="'rollback'">
        </button>
      </template>
    </modal>
  </div>
</template>

<script lang="ts">
    import Vue from "vue"
    import Modal from "../Modal.vue";
    import {mapActionByName, mapGetterByName, mapStateProp, mapStateProps} from "../../utils";
    import {RootState} from "../../root";
    import {Project, Version, VersionIds} from "../../types";
    import {ProjectsState} from "../../store/projects/projects";
    import {StepDescription, StepperState} from "../../store/stepper/stepper";

    interface ProjectComputed {
      currentProject: Project,
      currentVersion: Version
    }

    interface StepperComputed {
      steps: StepDescription[]
    }

    interface Computed extends ProjectComputed, StepperComputed {
      invalidSteps: number[],
      hasInvalidSteps: boolean,
      lastValidStep: number,
      isGuest: boolean
    }

    interface Methods {
      rollbackInvalidState: () => void,
      loadVersion: (versionIds: VersionIds) => void,
      retryLoad: () => void,
      stepTextKey: (stepNumber: number) => string
    }

    export default Vue.extend<unknown, Methods, Computed>({
        name: "LoadInvalidModal",
        computed: {
          ...mapStateProps<ProjectsState, keyof ProjectComputed>("projects", {
            currentProject: state => state.currentProject,
            currentVersion: state => state.currentVersion
          }),
          ...mapStateProps<StepperState, keyof StepperComputed>("stepper", {
            steps: state => state.steps
          }),
          invalidSteps: mapStateProp<RootState, number[]>(null, (state) => state.invalidSteps),
          isGuest: mapGetterByName(null, "isGuest"),
          hasInvalidSteps: function() { return this.invalidSteps?.length > 0; },
          lastValidStep: function() { return Math.min(...this.invalidSteps!) - 1; }
        },
        methods: {
          rollbackInvalidState: mapActionByName(null, "rollbackInvalidState"),
          loadVersion: mapActionByName("projects", "loadVersion"),
          retryLoad() {
            const versionId = this.currentVersion!.id;
            const projectId = this.currentProject!.id;
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
