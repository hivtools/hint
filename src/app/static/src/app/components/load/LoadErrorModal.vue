<template>
    <div id="load-error-modal">
        <modal :open="hasError">
            <h4 v-translate="'loadError'"></h4>
            <p v-if="showInvalidSteps">
              There are invalid steps in the loaded state. Repair state or retry load? If you repair some data may be lost.
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

    interface LoadComputed  {
        loadError: string
        hasError: boolean
    }

    interface ProjectComputed {
      currentProject: Project,
      currentVersion: Version
    }

    interface Computed extends LoadComputed, ProjectComputed {
        invalidSteps: number[],
        showInvalidSteps: boolean
    }

    interface Methods {
        clearLoadError: () => void,
        rollbackInvalidState: () => void,
        loadVersion: (versionIds: VersionIds) => void,
        retryLoad: () => void
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
            invalidSteps: mapStateProp<RootState, number[]>(null, (state) => state.invalidSteps),
            showInvalidSteps: function() { return this.invalidSteps?.length > 0; }
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
            }
        },
        components: {
            Modal
        }
    })
</script>
