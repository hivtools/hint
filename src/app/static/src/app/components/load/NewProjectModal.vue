<template>
    <div>
        <modal id="load-project-name" :open="openModal">
            <h4 v-translate="headerText"></h4>
            <label class="h5" for="project-name-input" v-translate="labelText"></label>
            <input id="project-name-input" type="text" class="form-control"
                   v-translate:placeholder="'projectName'" v-model="newProjectName">
            <template v-slot:footer>
                <button id="confirm-load-project"
                        type="button"
                        class="btn btn-red"
                        @click="submitLoad"
                        v-translate="'createProject'"
                        :disabled="!newProjectName">
                </button>
                <button id="cancel-load-project"
                        type="button"
                        class="btn btn-white"
                        @click="cancelLoad"
                        v-translate="'cancel'">
                </button>
            </template>
        </modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue"
    import Modal from "../Modal.vue";

    interface Props {
        openModal: boolean
        headerText: string,
        labelText: string
        submitLoad: () => void
        cancelLoad: () => void
        inputValue: string
    }

    interface Data {
        newProjectName: string
    }

    export default Vue.extend<Data, unknown, unknown, Props>({
        name: "NewProjectModal",
        props: {
            openModal: Boolean,
            headerText: {
                type: String,
                required: false
            },
            labelText: String,
            inputValue: String,
            submitLoad: Function,
            cancelLoad: Function
        },
        data(): Data {
            return {
                newProjectName: this.inputValue
            }
        },
        components: {
            Modal
        }
    })
</script>
