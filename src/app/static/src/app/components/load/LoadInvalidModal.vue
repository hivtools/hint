<template>
  <div id="load-error-modal">
    <modal :open="hasInvalidSteps">
      <h4 v-translate="'loadError'"></h4>
      <p>
        <span id="load-error-steps" v-translate="'loadInvalidSteps'" />
        <ul id="load-error-steps-list">
          <li v-for="step in invalidSteps" :key="step" v-translate="stepTextKey(step)"></li>
        </ul>
        <template v-if="lastValidStep >= 1">
          <span id="load-error-steps-from-valid-action" v-translate="'loadInvalidStepsFromValidAction'" />
          <span id="load-error-last-valid" v-translate="stepTextKey(lastValidStep)" />.
        </template>
        <span v-else id="load-error-steps-all-action" v-translate="'loadInvalidStepsAllAction'" />
        <span id="load-error-steps-rollback-info" v-translate="'loadInvalidStepsRollbackInfo'" />
      </p>
      <p>
          <!-- If ! guest user!!! -->
          You can also go back to  <router-link to="/projects" class="btn-red-icons">Projects</router-link> page.
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
    import {mapActionByName, mapStateProp, mapStateProps} from "../../utils";
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
      lastValidStep: number
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
