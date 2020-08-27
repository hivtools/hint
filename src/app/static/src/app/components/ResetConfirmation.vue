<template>
    <div>
        <modal :open="open">
            <h4 v-if="guestUser" v-translate="'haveYouSaved'"></h4>
            <h4 v-if="!guestUser">Save snapshot?</h4>

            <p v-translate="'discardWarning'"></p>
            <ul>
                <li v-for="step in laterCompleteSteps">
                    Step {{step.number}}: <span v-translate="step.textKey"></span>
                </li>
            </ul>

            <p v-if="guestUser"  v-translate="'savePrompt'"></p>
            <p v-if="!guestUser">
                These steps will automatically be saved in a snapshot. You will be able to reload this snapshot from the Projects page.
            </p>

            <template v-if="!waitingForSnapshot" v-slot:footer>
                <button type="button"
                        class="btn btn-white"
                        @click="handleConfirm"
                        v-translate="guestUser? 'discardSteps' : 'saveSnapshotConfirm'">
                </button>
                <button type="button"
                        class="btn btn-red"
                        @click="cancelEditing"
                        v-translate="guestUser? 'cancelEdit': 'cancelEditLoggedIn'">
                </button>
            </template>

            <div v-if="waitingForSnapshot" class="text-center">
                <loading-spinner size="sm"></loading-spinner>
                <h4 id="spinner-text">Saving snapshot</h4>
            </div>
        </modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Modal from "./Modal.vue";
    import {mapActionByName, mapGetterByName, mapStateProp} from "../utils";
    import {StepDescription} from "../store/stepper/stepper";
    import LoadingSpinner from "./LoadingSpinner.vue";
    import {ProjectsState} from "../store/projects/projects";
    import {ErrorsState} from "../store/errors/errors";

    declare const currentUser: string;

    interface Computed {
        laterCompleteSteps: StepDescription[],
        guestUser: boolean,
        currentSnapshotId: string | null,
        errorsCount: number
    }

    interface Props {
        open: boolean
        continueEditing: boolean
        cancelEditing: boolean
    }

    interface Data {
        waitingForSnapshot:  boolean
    }

    export default Vue.extend<Data, {}, Computed, any>({
        props: ["open", "continueEditing", "cancelEditing"],
        data: function() {
            return {
                waitingForSnapshot: false
            }
        },
        computed: {
            laterCompleteSteps: mapGetterByName("stepper", "laterCompleteSteps"),
            currentSnapshotId: mapStateProp<ProjectsState, string | null>("versions", state => {
                return state.currentSnapshot && state.currentSnapshot.id;
            }),
            guestUser: function() {
                return (currentUser === "guest");
            },
            errorsCount: mapStateProp<ErrorsState, number>("errors", state => {
                return state.errors ? state.errors.length : 0;
            }),
        },
        methods: {
            handleConfirm: function() {
                if (this.guestUser) {
                    this.continueEditing();
                } else {
                    this.waitingForSnapshot = true;
                    this.newSnapshot();
                }
            },
            newSnapshot: mapActionByName("projects", "newSnapshot")
        },
        watch: {
            currentSnapshotId: function() {
                if (this.waitingForSnapshot) {
                    this.waitingForSnapshot = false;
                    this.continueEditing();
                }
            },
            errorsCount: function(newVal, oldVal) {
                if (this.waitingForSnapshot && (newVal > oldVal)) {
                    this.waitingForSnapshot = false;
                    this.cancelEditing();
                }
            }
        },
        components: {
            Modal,
            LoadingSpinner
        }
    });

</script>
