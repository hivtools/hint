<template>
    <div>
        <modal :open="showModal">
            <h4 v-translate="'haveYouSaved'"></h4>
            <p v-translate="'discardWarning'"></p>
            <ul>
                <li v-for="step in laterCompleteSteps">
                    Step {{step.number}}: <span v-translate="step.textKey"></span>
                </li>
            </ul>
            <p v-translate="'savePrompt'"></p>
            <template v-slot:footer>
                <button type="button"
                        class="btn btn-white"
                        @click="continueEditing"
                        v-translate="'discardSteps'">
                </button>
                <button type="button"
                        class="btn btn-red"
                        @click="cancelEditing"
                        v-translate="'cancelEdit'">
                </button>
            </template>
        </modal>
        <loading-spinner v-if="waitingForSnapshot" size="lg"></loading-spinner>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Modal from "./Modal.vue";
    import {mapActionByName, mapGetterByName, mapStateProp} from "../utils";
    import {StepDescription} from "../store/stepper/stepper";
    import LoadingSpinner from "./LoadingSpinner.vue";
    import {VersionsState} from "../store/versions/versions";

    declare const currentUser: string;

    interface Computed {
        laterCompleteSteps: StepDescription[],
        showModal: boolean,
        currentSnapshotId: string | null
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
            currentSnapshotId: mapStateProp<VersionsState, string | null>("versions", state => {
                return state.currentSnapshot && state.currentSnapshot.id;
            }),
            showModal: function() {
                return this.open && (currentUser === "guest");
            }
        },
        methods: {
            newSnapshot: mapActionByName("versions", "newSnapshot")
        },
        watch: {
            open: function (newVal: boolean) {
                if (newVal && !this.showModal) {
                    this.waitingForSnapshot = true;
                    this.newSnapshot();
                }
            },
            currentSnapshotId: function() {
                if (this.waitingForSnapshot) {
                    this.continueEditing();
                }
            },
            //TODO: error case???
        },
        components: {
            Modal,
            LoadingSpinner
        }
    });

</script>
