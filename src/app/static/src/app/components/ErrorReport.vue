<template>
    <modal :open="open">
        <h4 v-translate="'troubleshootingRequest'"></h4>
        <form class="form">
            <div class="form-group" v-if="projectName">
                <label for="project" v-translate="'project'"></label>
                <input type="text"
                       disabled
                       id="project"
                       :value="projectName"
                       class="form-control"/>
            </div>
            <div class="form-group" v-if="isGuest">
                <label for="email" v-translate="'email'"></label>
                <input type="text"
                       id="email"
                       v-model="email"
                       class="form-control"/>
            </div>
            <div class="form-group">
                <label for="section" v-translate="'section'"></label>
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
                          v-model="stepsToReproduce"
                          class="form-control"></textarea>
            </div>
        </form>
        <template v-slot:footer>
            <div v-if="disabled" class="tooltip-wrapper"
                 style="cursor: not-allowed;"
                 v-tooltip="tooltipText">
                <!-- tooltips can't be rendered on disabled elements -->
                <button disabled
                        type="button"
                        class="btn btn-red"
                        v-translate="'send'"></button>
            </div>
            <button v-else
                    type="button"
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
    import {mapActionByName, mapGetterByName, mapStateProp} from "../utils";
    import {StepDescription, StepperState} from "../store/stepper/stepper";
    import {ProjectsState} from "../store/projects/projects"
    import Modal from "./Modal.vue";
    import {ErrorReportManualDetails} from "../store/root/actions";
    import {VTooltip} from 'v-tooltip';
    import i18next from "i18next";
    import {RootState} from "../root";
    import {Language} from "../store/translations/locales";

    interface Methods {
        generateErrorReport: (payload: ErrorReportManualDetails) => void
        sendErrorReport: () => void
        cancelErrorReport: () => void
        resetData: () => void
    }

    interface Computed {
        currentLanguage: Language,
        currentSectionKey: string
        currentSection: string
        isGuest: boolean
        steps: StepDescription[]
        projectName: string | undefined
        disabled: boolean,
        tooltipText: string
    }

    interface Props {
        open: boolean
    }

    export default Vue.extend<ErrorReportManualDetails, Methods, Computed, Props>({
        components: {Modal},
        directives: {tooltip: VTooltip},
        props: {
            open: Boolean
        },
        name: "ErrorReport",
        data: function () {
            return {
                description: "",
                stepsToReproduce: "",
                section: "",
                email: ""
            }
        },
        computed: {
            currentLanguage: mapStateProp<RootState, Language>(null, (state: RootState) => state.language),
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
            isGuest: mapGetterByName(null, "isGuest"),
            projectName: mapStateProp<ProjectsState, string | undefined>("projects", state => state.currentProject?.name),
            steps: mapStateProp<StepperState, StepDescription[]>("stepper", state => state.steps),
            disabled() {
                return !this.description || !this.stepsToReproduce || (this.isGuest && !this.email)
            },
            tooltipText() {
                return i18next.t("allFieldsRequired", {lng: this.currentLanguage});
            }
        },
        methods: {
            generateErrorReport: mapActionByName(null, "generateErrorReport"),
            cancelErrorReport() {
                this.resetData();
                this.$emit("close")
            },
            sendErrorReport() {
                this.generateErrorReport({
                    section: this.currentSection,
                    description: this.description,
                    stepsToReproduce: this.stepsToReproduce,
                    email: this.email
                })
                this.resetData();
                this.$emit("close")
            },
            resetData() {
                this.description = "";
                this.stepsToReproduce = "";
                this.section = "";
                this.email = "";
            }
        },
        watch: {
            open(newVal) {
                if (newVal === true) {
                    if (this.$route.path.indexOf("projects") > -1) {
                        this.section = "projects"
                    }
                }
            }
        }
    })
</script>
