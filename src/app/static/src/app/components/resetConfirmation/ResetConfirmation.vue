<template>
    <div>
        <modal :open="open" @close-modal="cancelEditing">
            <h4 v-if="isGuest" v-translate="'haveYouSaved'"></h4>
            <h4 v-if="!isGuest" v-translate="'saveVersion'"></h4>

            <div v-if="showWarning">
                <p v-translate="'discardWarning'"></p>
                <ul>
                    <li v-for="step in showRelevantSteps" :key="step.number">
                        <span v-translate="'step'"></span> {{ step.number }}: <span v-translate="step.textKey"></span>
                    </li>
                </ul>
            </div>

            <p v-if="isGuest" v-translate="'savePrompt'"></p>
            <p v-if="!isGuest" v-translate="'savePromptLoggedIn'"></p>

            <div id="noteHeader" class="form-group">
                <label :for="`resetVersionNoteControl${uuid}`" v-translate="'noteHeader'"></label>
                <textarea class="form-control"
                          :id="`resetVersionNoteControl${uuid}`"
                          v-model="versionNote"
                          rows="3">
                </textarea>
            </div>

            <template v-if="!waitingForVersion" v-slot:footer>
                <button type="button"
                        id="handle-confirm-id"
                        class="btn btn-red"
                        @click="handleConfirm"
                        v-translate="isGuest? 'discardSteps' : 'saveVersionConfirm'">
                </button>
                <button type="button"
                        class="btn btn-white"
                        @click="cancelEditing"
                        v-translate="isGuest? 'cancelEdit': 'cancelEditLoggedIn'">
                </button>
            </template>

            <div v-if="waitingForVersion" class="text-center">
                <loading-spinner size="sm"></loading-spinner>
                <h4 id="spinner-text">Saving version</h4>
            </div>
        </modal>
    </div>
</template>

<script lang="ts">
    import {PropType, defineComponent} from "vue";
    import Modal from "../Modal.vue";
    import {mapActionByName, mapGetterByName, mapStateProp} from "../../utils";
    import {StepDescription} from "../../store/stepper/stepper";
    import LoadingSpinner from "../LoadingSpinner.vue";
    import {ProjectsState} from "../../store/projects/projects";
    import {ErrorsState} from "../../store/errors/errors";

    let uuid = 0;

    export default defineComponent({
        props: {
            open: {
                type: Boolean,
                required: true
            },
            continueEditing: {
                type: Function as PropType<() => void>,
                required: true
            },
            cancelEditing: {
                type: Function as PropType<() => void>,
                required: true
            },
            discardStepWarning: {
                type: Number as PropType<number | null>,
                required: false
            }
        },
        data: function () {
            return {
                waitingForVersion: false,
                versionNote: "",
                uuid: ""
            }
        },
        computed: {
            changesToRelevantSteps: mapGetterByName<StepDescription[]>("stepper", "changesToRelevantSteps"),
            currentVersionId: mapStateProp<ProjectsState, string | null>("projects", state => {
                return state.currentVersion && state.currentVersion.id;
            }),
            currentVersionNote: mapStateProp<ProjectsState, string>("projects", state => {
                return state.currentVersion?.note || "";
            }),
            isGuest: mapGetterByName(null, "isGuest"),
            errorsCount: mapStateProp<ErrorsState, number>("errors", state => {
                return state.errors ? state.errors.length : 0;
            }),
            showRelevantSteps() {
                // In special cases when data for a downstream step can be retained, remove the warning for that step
                return this.changesToRelevantSteps.filter((step: StepDescription) => step.number !== this.discardStepWarning)
            },
            showWarning() {
                return this.showRelevantSteps.length > 0
            }
        },
        methods: {
            handleConfirm: function () {
                if (this.isGuest) {
                    this.continueEditing();
                } else {
                    this.waitingForVersion = true;
                    this.newVersion(encodeURIComponent(this.versionNote));
                }
            },
            newVersion: mapActionByName("projects", "newVersion")
        },
        watch: {
            currentVersionId: function () {
                if (this.waitingForVersion) {
                    this.waitingForVersion = false;
                    this.continueEditing();
                }
            },
            errorsCount: function (newVal, oldVal) {
                if (this.waitingForVersion && (newVal > oldVal)) {
                    this.waitingForVersion = false;
                    this.cancelEditing();
                }
            },
            open: function () {
                if (this.open) {
                    this.versionNote = this.currentVersionNote;
                }
            }
        },
        beforeMount() {
            // There are multiple instances of this component on the page
            // This is appended to the textarea id to avoid duplicate input ids
            this.uuid = uuid.toString()
            uuid += 1
        },
        components: {
            Modal,
            LoadingSpinner
        }
    });

</script>
