<template>
    <div id="load-project-name">
        <modal id="load" :open="openModal">
            <label class="h5" :for="inputId" v-translate="'enterProjectName'"></label>
            <input :id="inputId"
                   type="text"
                   class="form-control"
                   v-translate:placeholder="'projectName'"
                   v-model="newProjectName">
            <div class="invalid-feedback d-inline"
                 v-translate="'uniqueProjectName'"
                 v-if="invalidName(newProjectName)"></div>
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
        <load-error-modal />
        <upload-progress :open-modal="preparing" :cancel="cancelRehydration"/>
    </div>
</template>

<script lang="ts">
    import Modal from "../Modal.vue";
    import {mapMutationByName, mapStateProps} from "../../utils";
    import UploadProgress from "./UploadProgress.vue";
    import {LoadState} from "../../store/load/state";
    import LoadErrorModal from "./LoadErrorModal.vue";
    import ProjectsMixin from "../projects/ProjectsMixin";
    import { PropType, defineComponent } from "vue";

    export default defineComponent({
        extends: ProjectsMixin,
        name: "UploadNewProject",
        props: {
            inputId: {
                type: String,
                required: true
            },
            openModal: {
                type: Boolean,
                required: true
            },
            submitLoad: {
                type: Function as PropType<() => void>,
                required: true
            },
            cancelLoad: {
                type: Function as PropType<() => void>,
                required: true
            }
        },
        data() {
            return {
                newProjectName: ""
            }
        },
        methods: {
            cancelRehydration: mapMutationByName("load", "RehydrateCancel"),
            setNewProjectName: mapMutationByName("load", "SetNewProjectName"),
        },
        computed: {
            ...mapStateProps("load", {
                preparing: (state: LoadState) => state.preparing
            }),
            disableCreate() {
                return !this.newProjectName || this.invalidName(this.newProjectName)
            },
        },
        components: {
            Modal,
            UploadProgress,
            LoadErrorModal
        },
        watch: {
            newProjectName(newValue) {
                this.setNewProjectName(newValue)
            }
        }
    })
</script>
