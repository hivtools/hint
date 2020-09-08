<template>
    <div>
        <modal :open="open">
            <h4 v-if="guestUser" v-translate="'haveYouSaved'"></h4>
            <h4 v-if="!guestUser">Save version?</h4>

            <p v-translate="'discardWarning'"></p>
            <ul>
                <li v-for="step in laterCompleteSteps">
                    Step {{step.number}}: <span v-translate="step.textKey"></span>
                </li>
            </ul>

            <p v-if="guestUser"  v-translate="'savePrompt'"></p>
            <p v-if="!guestUser">
                These steps will automatically be saved in a version. You will be able to reload this version from the Projects page.
            </p>

            <template v-if="!waitingForVersion" v-slot:footer>
                <button type="button"
                        class="btn btn-white"
                        @click="handleConfirm"
                        v-translate="guestUser? 'discardSteps' : 'saveVersionConfirm'">
                </button>
                <button type="button"
                        class="btn btn-red"
                        @click="cancelEditing"
                        v-translate="guestUser? 'cancelEdit': 'cancelEditLoggedIn'">
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
    import Vue from "vue";
    import {mapState} from "vuex";
    import Modal from "./Modal.vue";
    import {mapActionByName, mapGetterByName, mapStateProp} from "../utils";
    import {StepDescription} from "../store/stepper/stepper";
    import LoadingSpinner from "./LoadingSpinner.vue";
    import {ProjectsState} from "../store/projects/projects";
    import {ErrorsState} from "../store/errors/errors";
    // import {RootState} from "../root"

    // declare const currentUser: string;

    interface Computed {
        laterCompleteSteps: StepDescription[],
        guestUser: boolean,
        currentVersionId: string | null,
        errorsCount: number,
        // currentUser: string
    }

    interface Props {
        open: boolean
        continueEditing: boolean
        cancelEditing: boolean
    }

    interface Data {
        waitingForVersion:  boolean
    }

    export default Vue.extend<Data, {}, Computed, any>({
        props: ["open", "continueEditing", "cancelEditing"],
        data: function() {
            return {
                waitingForVersion: false
            }
        },
        computed: {
            laterCompleteSteps: mapGetterByName("stepper", "laterCompleteSteps"),
            currentVersionId: mapStateProp<ProjectsState, string | null>("projects", state => {
                return state.currentVersion && state.currentVersion.id;
            }),
            guestUser: function() {
                console.log('reset confirmation current user', this.$store.state.currentUser, this.$store.getters.isGuest)
                return (this.$store.getters.isGuest);
            },
            errorsCount: mapStateProp<ErrorsState, number>("errors", state => {
                return state.errors ? state.errors.length : 0;
            }),
            // currentUser() {
            //     return this.$store.state.currentUser
            // }
        },
        methods: {
            handleConfirm: function() {
                if (this.guestUser) {
                    this.continueEditing();
                } else {
                    this.waitingForVersion = true;
                    this.newVersion();
                }
            },
            newVersion: mapActionByName("projects", "newVersion")
        },
        watch: {
            currentVersionId: function() {
                if (this.waitingForVersion) {
                    this.waitingForVersion = false;
                    this.continueEditing();
                }
            },
            errorsCount: function(newVal, oldVal) {
                if (this.waitingForVersion && (newVal > oldVal)) {
                    this.waitingForVersion = false;
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
