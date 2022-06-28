<template>
    <div>
        <modal id="load-project-name" :open="openModal">
            <h4 v-if="headerText" v-translate="headerText"></h4>
            <label class="h5" for="project-name-input" v-translate="labelText"></label>
            <input id="project-name-input"
                   type="text"
                   class="form-control"
                   @keyup.enter="submitLoad"
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
                          :clear-load-error="clearLoadError"/>

        <upload-progress :open-modal="preparing"
                         :header-text="'uploadFromZip'"
                         :progress-message="progressMessage"
                         :cancel="cancelRehydration"/>
    </div>
</template>

<script lang="ts">
    import Modal from "../Modal.vue";
    import {mapActionByName, mapMutationByName, mapStatePropByName, mapStateProps} from "../../utils";
    import UploadProgress from "./UploadProgress.vue";
    import {LoadingState, LoadState} from "../../store/load/load";
    import LoadErrorModal from "./LoadErrorModal.vue";
    import ProjectsMixin from "../projects/ProjectsMixin";

    interface Props {
        openModal: boolean
        headerText: string,
        labelText: string
        submitLoad: () => void
        cancelLoad: () => void
    }

    interface Data {
        progressMessage: string
    }

    interface Methods {
        cancelRehydration: () => void;
        clearLoadError: () => void;
        setProjectName: (name: string) => void;
    }

    interface LoadComputed {
        loadError: string
        hasError: boolean
        projectName: string
    }

    interface Computed extends  LoadComputed{
        preparing: boolean,
        uploadProjectName: string
        disableCreate: boolean
    }

    export default ProjectsMixin.extend<Data, Methods, Computed, Props>({
        name: "UploadNewProject",
        props: {
            openModal: Boolean,
            labelText: String,
            submitLoad: Function,
            cancelLoad: Function,
            headerText: {
                type: String,
                required: false
            }
        },
        data(): Data {
            return {
                progressMessage: "",
            }
        },
        methods: {
            cancelRehydration: mapMutationByName("load", "RehydrateCancel"),
            clearLoadError: mapActionByName("load", "clearLoadState"),
            setProjectName: mapMutationByName("load", "SetProjectName")
        },
        computed: {
            ...mapStateProps<LoadState, keyof LoadComputed>("load", {
                hasError: state => state.loadingState === LoadingState.LoadFailed,
                loadError: state => state.loadError && state.loadError.detail,
                projectName: state => state.projectName
            }),
            preparing: mapStatePropByName<boolean>("load", "preparing"),
            uploadProjectName: {
                get() {
                    return this.projectName
                },
                set(newValue) {
                    this.setProjectName(newValue)
                }
            },
            disableCreate() {
                return !this.uploadProjectName || this.invalidName(this.uploadProjectName)
            }
        },
        components: {
            Modal,
            UploadProgress,
            LoadErrorModal
        }
    })
</script>
