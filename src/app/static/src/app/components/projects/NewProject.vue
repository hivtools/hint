<template>
    <div>
        <div class="dropdown">
        <button type="button"
                id="new-project-dropdown"
                class="btn btn-red btn-lg dropdown-toggle-no-caret"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false">
            <div class="mx-3">
                <vue-feather type="plus" size="30" class="icon align-middle"></vue-feather>
                <span class="ml-2 align-middle" v-translate="'newProjectDropdown'"></span>
            </div>
        </button>
        <div class="dropdown-menu dropdown-menu-right" aria-labelledby="new-project-dropdown">
            <button class="dropdown-item mb-0"
                    type="button"
                    @click="showCreateProjectModal">
                <vue-feather type="plus-circle" size="20" class="icon ml-1 align-middle"></vue-feather>
                <span class="align-middle ml-2" v-translate="'createProject'"></span>
            </button>
            <button class="dropdown-item mb-0"
                    type="button"
                    @click="$refs.loadZip.click()">
                <vue-feather type="upload" size="20" class="icon ml-1 align-middle"></vue-feather>
                <span class="align-middle ml-2" v-translate="'loadZip'"></span>
            </button>
            <input id="upload-zip"
                   v-translate:aria-label="'selectFile'"
                   type="file"
                   style="display: none;" ref="loadZip"
                   @change="showLoadZipModal" accept=".zip">
        </div>
        </div>

        <div id="create-project">
            <upload-new-project input-id="project-name-create-new"
                                :open-modal="showNewProjectModal"
                                :submit-load="handleCreateProject"
                                :cancel-load="cancelCreateProject"/>
        </div>

        <div id="project-zip">
            <upload-new-project input-id="project-name-input-zip"
                                :open-modal="showUploadZipModal"
                                :submit-load="handleLoadZip"
                                :cancel-load="cancelLoadZip"/>
        </div>
    </div>
</template>
<script lang="ts">
import VueFeather from "vue-feather";
import {getFormData, mapActionByName} from "../../utils";
import UploadNewProject from "../load/UploadNewProject.vue";
import {defineComponent} from "vue";

interface Data {
    showNewProjectModal: boolean,
    showUploadZipModal: boolean,
    fileToLoad: File | null
}

export default defineComponent({
    data(): Data {
        return {
            showNewProjectModal: false,
            showUploadZipModal: false,
            fileToLoad: null,
        }
    },
    methods: {
        createProject: mapActionByName("projects", "createProject"),
        preparingRehydrate: mapActionByName("load","preparingRehydrate"),
        showCreateProjectModal() {
            this.showNewProjectModal = true;
        },
        showLoadZipModal() {
            const input = this.$refs.loadZip as HTMLInputElement;
            if (input.files && input.files.length > 0) {
                const file = input.files[0];
                this.clearLoadZipInput();
                this.fileToLoad = file;
                this.showUploadZipModal = true;
            }
        },
        clearLoadZipInput() {
            // clearing value because browser does not
            // allow selection of the same file twice
            const input = this.$refs.loadZip as HTMLInputElement
            input.value = ""
        },
        handleCreateProject() {
            this.showNewProjectModal = false;
            this.createProject({name: this.$store.state.load.newProjectName});
        },
        handleLoadZip() {
            this.showUploadZipModal = false;
            if (this.fileToLoad) {
                this.preparingRehydrate(getFormData(this.fileToLoad));
            }
        },
        cancelLoadZip() {
            this.showUploadZipModal = false;
            this.clearLoadZipInput();
        },
        cancelCreateProject() {
            this.showNewProjectModal = false;
        }
    },
    components: {
        VueFeather,
        UploadNewProject
    }
})
</script>
