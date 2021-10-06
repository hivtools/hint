<template>
    <modal :open="open">
        <h4 v-translate="'reportIssues'"></h4>
        <form class="form">
            <div class="form-row">
                <div class="col-4">
                    <label for="section" v-translate="'section'"></label>
                </div>
                <div class="col-8">
                    <select class="form-control"
                            v-model="currentSection"
                            id="section">
                        <option v-for="step in steps"
                                :key="step.number"
                                :value="step.textKey"
                                v-translate="step.textKey">
                        </option>
                        <option key="login"
                                v-translate="'login'"
                                value="login"></option>
                        <option key="projects" v-translate="'projects'"
                               value="projects"></option>
                        <option key="other"
                                value="other"
                                v-translate="'other'"></option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label for="description"
                       class="mb-0"
                       v-translate="'description'"></label>
                <div class="small text-muted" v-translate="'errorDescriptionHelp'"></div>
                <textarea id="description"
                          v-model="description"
                          class="form-control"></textarea>
            </div>
            <div class="form-group">
                <label for="reproduce"
                       class="mb-0"
                       v-translate="'reproduce'"></label>
                <div class="small text-muted" v-translate="'reproduceErrorHelp'"></div>
                <textarea id="reproduce"
                          v-model="reproduce"
                          class="form-control"></textarea>
            </div>
        </form>
        <template v-slot:footer>
            <button type="button"
                    class="btn btn-red"
                    @click="sendErrorReport"
                    v-translate="'send'">
            </button>
            <button type="button"
                    class="btn btn-white"
                    @click="cancelErrorReport"
                    v-translate="'cancel'">
            </button>
        </template>
    </modal>
</template>
<script lang="ts">
    import Vue from "vue"
    import {mapStateProp} from "../utils";
    import {StepDescription, StepperState} from "../store/stepper/stepper";
    import {RootState} from "../root";
    import {Language} from "../store/translations/locales";
    import i18next from "i18next";
    import Modal from "./Modal.vue";

    interface Data {
        description: string
        reproduce: string
        section: string
    }

    interface Methods {
        sendErrorReport: () => void
        cancelErrorReport: () => void
        resetData: () => void
    }

    interface Computed {
        currentSectionKey: string
        currentSection: string
        steps: StepDescription[]
    }

    interface Props {
        open: boolean
    }

    export default Vue.extend<Data, Methods, Computed, Props>({
        components: {Modal},
        props: {
            open: Boolean
        },
        name: "ErrorReport",
        data: function () {
            return {
                description: "",
                reproduce: "",
                section: ""
            }
        },
        computed: {
            currentSectionKey: mapStateProp<StepperState, string>("stepper", state => {
                return state.steps[state.activeStep - 1].textKey;
            }),
            currentSection: {
                get() {
                    return this.section || this.currentSectionKey
                },
                set(newVal: string) {
                    this.section = newVal
                }
            },
            steps: mapStateProp<StepperState, StepDescription[]>("stepper", state => state.steps)
        },
        methods: {
            cancelErrorReport() {
                this.resetData();
                this.$emit("close")
            },
            sendErrorReport() {
                // TODO call through to an action that will
                // combine this form data with data derived
                // from the state, and POST to the backend
                console.log(this.description, this.reproduce, this.currentSection)
                this.resetData();
                this.$emit("close")
            },
            resetData() {
                this.description = "";
                this.reproduce = "";
                this.section = "";
            }
        }
    })
</script>
