<template>
    <div id="load-project-name">
        <modal id="load" :open="openModal">
            <label class="h5" for="project-name-input" v-translate="'enterProjectName'"></label>
            <input id="project-name-input"
                   type="text"
                   class="form-control"
                   v-translate:placeholder="'projectName'"
                   v-model="uploadProjectName">
            <div class="invalid-feedback d-inline"
                 v-translate="'uniqueProjectName'"
                 v-if="invalidName(uploadProjectName)"></div>
            <template v-slot:footer>
                <button id="confirm-load-project"
                        type="button"
                        class="btn btn-red"
                        @click="submitLoad"
                        v-translate="'createProject'"
                        :disabled="disableCreate">
                </button>
                <button id="cancel-load-project"
                        type="button"
                        class="btn btn-white"
                        @click="cancelLoad"
                        v-translate="'cancel'">
                </button>
            </template>
        </modal>
        <load-error-modal :has-error="hasError"
                          :load-error="loadError"
                          :invalid-steps="invalidSteps"
                          :clear-load-error="clearLoadError"
                          :rollback-invalid-state="rollbackInvalidState"
                          :retry-load="retryLoad"/>

        <upload-progress :open-modal="preparing" :cancel="cancelRehydration"/>
    </div>
</template>

<script lang="ts">
    import Modal from "../Modal.vue";
    import {mapActionByName, mapGetterByName, mapMutationByName, mapStateProps, mapStateProp} from "../../utils";
    import UploadProgress from "./UploadProgress.vue";
    import {LoadingState, LoadState} from "../../store/load/state";
    import LoadErrorModal from "./LoadErrorModal.vue";
    import ProjectsMixin from "../projects/ProjectsMixin";
    import {RootState} from "../../root";
    import {ProjectsState} from "../../store/projects/projects";
    import {Project, Version, VersionIds} from "../../types";

    interface Props {
        openModal: boolean
        submitLoad: () => void
        cancelLoad: () => void
    }

    interface Data {
        uploadProjectName: string
    }

    interface Methods {
        cancelRehydration: () => void;
        clearLoadError: () => void;
        setProjectName: (name: string) => void;
        getProjects: () => void;
        rollbackInvalidState: () => void;
        loadVersion: (ids: VersionIds) => void,
        retryLoad: () => void
    }

    interface LoadComputed {
        loadError: string
        hasError: boolean
        preparing: boolean
    }

    interface ProjectComputed {
        currentProject: Project,
        currentVersion: Version
    }

    interface Computed extends  LoadComputed, ProjectComputed {
        disableCreate: boolean
        isGuest: boolean
        invalidSteps: number[]
    }

    export default ProjectsMixin.extend<Data, Methods, Computed, Props>({
        name: "UploadNewProject",
        props: {
            openModal: Boolean,
            submitLoad: Function,
            cancelLoad: Function
        },
        data(): Data {
            return {
                uploadProjectName: ""
            }
        },
        methods: {
            cancelRehydration: mapMutationByName("load", "RehydrateCancel"),
            clearLoadError: mapActionByName("load", "clearLoadState"),
            setProjectName: mapMutationByName("load", "SetProjectName"),
            getProjects: mapActionByName("projects", "getProjects"),
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
        computed: {
            ...mapStateProps<LoadState, keyof LoadComputed>("load", {
                hasError: state => state.loadingState === LoadingState.LoadFailed,
                loadError: state => state.loadError && state.loadError.detail,
                preparing: state => state.preparing
            }),
            ...mapStateProps<ProjectsState, keyof ProjectComputed>("projects", {
                currentProject: state => state.currentProject,
                currentVersion: state => state.currentVersion
            }),
            invalidSteps: mapStateProp<RootState, number[]>(null, (state) => state.invalidSteps),
            disableCreate() {
                return !this.uploadProjectName || this.invalidName(this.uploadProjectName)
            },
            isGuest: mapGetterByName(null,"isGuest")
        },
        components: {
            Modal,
            UploadProgress,
            LoadErrorModal
        },
        watch: {
            uploadProjectName(newValue) {
                this.setProjectName(newValue)
            }
        },
        mounted() {
            if (!this.isGuest) {
                this.getProjects();
            }
        }
    })
</script>
