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
                          :clear-load-error="clearLoadError"/>

        <upload-progress :open-modal="preparing" :cancel="cancelRehydration"/>
    </div>
</template>

<script lang="ts">
    import Modal from "../Modal.vue";
    import {mapActionByName, mapGetterByName, mapMutationByName, mapStateProps} from "../../utils";
    import UploadProgress from "./UploadProgress.vue";
    import {LoadingState, LoadState} from "../../store/load/state";
    import LoadErrorModal from "./LoadErrorModal.vue";
    import ProjectsMixin from "../projects/ProjectsMixin";
    import { defineComponentVue2WithProps } from "../../defineComponentVue2/defineComponentVue2";
    import { PropType } from "vue";

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
    }

    interface LoadComputed {
        loadError: string
        hasError: boolean
        preparing: boolean
    }

    interface Computed extends  LoadComputed{
        disableCreate: boolean
        isGuest: boolean
    }

    export default defineComponentVue2WithProps<Data, Methods, Computed, Props>({
        extends: ProjectsMixin,
        name: "UploadNewProject",
        props: {
            openModal: {
                type: Boolean,
                required: true
            },
            submitLoad: {
                type: Function as PropType<Props["submitLoad"]>,
                required: true
            },
            cancelLoad: {
                type: Function as PropType<Props["cancelLoad"]>,
                required: true
            }
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
            getProjects: mapActionByName("projects", "getProjects")
        },
        computed: {
            ...mapStateProps<LoadState, keyof LoadComputed>("load", {
                hasError: state => state.loadingState === LoadingState.LoadFailed,
                loadError: state => state.loadError && state.loadError.detail,
                preparing: state => state.preparing
            }),
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
            uploadProjectName(newValue) {ProjectsMixin
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
