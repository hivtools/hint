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
                <button id="create-project-button"
                        class="dropdown-item mb-0"
                        type="button"
                        @click="showCreateProjectModal">
                    <vue-feather type="plus-circle" size="20" class="icon ml-1 align-middle"></vue-feather>
                    <span class="align-middle ml-2" v-translate="'createProject'"></span>
                </button>
                <button id="load-zip-button"
                        class="dropdown-item mb-0"
                        type="button"
                        @click="() => loadZip?.click()">
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
import {getFormData} from "../../utils";
import UploadNewProject from "../load/UploadNewProject.vue";
import {defineComponent, ref} from "vue";
import {useStore} from "vuex";
import {CreateProjectPayload} from "../../store/projects/actions";
import {RootState} from "../../root";

export default defineComponent({
    setup() {
        const showNewProjectModal = ref(false);
        const showUploadZipModal = ref(false);
        const fileToLoad = ref<File | null>(null);
        const loadZip = ref<HTMLInputElement | null>(null);

        const store = useStore<RootState>();

        const createProject = (payload: CreateProjectPayload) => store.dispatch("projects/createProject", payload);

        const preparingRehydrate =  (payload: FormData) => store.dispatch("load/preparingRehydrate", payload);

        const showCreateProjectModal = () => showNewProjectModal.value = true

        const clearLoadZipInput = () => {
            // clearing value because browser does not
            // allow selection of the same file twice
            if (loadZip.value) {
                loadZip.value.value = ""
            }
        }

        const showLoadZipModal = () => {
            if (loadZip.value && loadZip.value.files && loadZip.value.files.length > 0) {
                const file = loadZip.value.files[0];
                clearLoadZipInput();
                fileToLoad.value = file;
                showUploadZipModal.value = true;
            }
        }

        const handleCreateProject = () => {
            showNewProjectModal.value = false;
            createProject({name: store.state.load.newProjectName});
        }

        const handleLoadZip = () => {
            showUploadZipModal.value = false;
            if (fileToLoad.value) {
                preparingRehydrate(getFormData(fileToLoad.value));
            }
        }

        const cancelLoadZip = () => {
            showUploadZipModal.value = false;
            clearLoadZipInput();
        }

        const cancelCreateProject = () => {
            showNewProjectModal.value = false;
        }

        return {
            showNewProjectModal,
            showUploadZipModal,
            showCreateProjectModal,
            showLoadZipModal,
            handleCreateProject,
            handleLoadZip,
            cancelLoadZip,
            cancelCreateProject,
            loadZip
        }
    },


    components: {
        VueFeather,
        UploadNewProject
    }
})
</script>
