<template>
    <modal :open="open">
        <h4 v-translate="'troubleshootingRequest'"></h4>
        <form class="form was-validated" id="report-form" v-if="!showFeedback">
            <div class="form-group">
                <slot name="projectView"/>
            </div>
            <div class="form-group" v-if="isGuest">
                <label for="email" v-translate="'email'"></label>
                <input type="email"
                       id="email"
                       :pattern="pattern.source"
                       @input="checkValidEmail"
                       v-model="email"
                       class="form-control is-invalid" required/>
                <div v-if="email && !validEmail"
                     class="invalid-feedback"
                     id="enterValidEmail"
                     v-translate="'enterValidEmail'">
                </div>
            </div>
            <div class="form-group">
                <slot name="sectionView"></slot>
            </div>
            <div class="form-group">
                <label for="description"
                       class="mb-0"
                       v-translate="'description'"></label>
                <div class="small text-muted" v-translate="'errorDescriptionHelp'"></div>
                <textarea id="description"
                          v-model="description"
                          class="form-control is-invalid" required></textarea>
            </div>
            <div class="form-group">
                <label for="reproduce"
                       class="mb-0"
                       v-translate="'reproduce'"></label>
                <div class="small text-muted" v-translate="'reproduceErrorHelp'"></div>
                <textarea id="reproduce"
                          v-model="stepsToReproduce"
                          class="form-control is-invalid" required></textarea>
            </div>
        </form>
        <template v-else>
            <div id="report-success" v-if="!errorReportError" v-translate="'errorReportSuccess'"></div>
            <template v-else>
                <div id="report-error" v-translate="'errorReportError'"></div>
                <error-alert :error="errorReportError"></error-alert>
            </template>
        </template>
        <template v-slot:footer>
            <template v-if="!showFeedback">
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
                        id="send"
                        class="btn"
                        :class="sendingErrorReport? 'btn-secondary':'btn-red'"
                        :disabled="sendingErrorReport"
                        @click="sendErrorReport"
                        v-translate="'send'">
                </button>
                <button type="button"
                        class="btn btn-white"
                        @click="cancelErrorReport"
                        v-translate="'cancel'">
                </button>
            </template>
            <template v-else>
                <button type="button"
                        class="btn btn-red"
                        @click="close"
                        v-translate="'close'">
                </button>
            </template>
        </template>
        <template>
            <div v-if="sendingErrorReport" id="sending-error-report" class="mt-3">
                <loading-spinner size="xs"/>
                <span v-translate="'sending'"></span>
            </div>
        </template>
    </modal>
</template>

<script lang="ts">
    import Vue from "vue"
    import {mapActionByName, mapGetterByName, mapStateProp, validateEmail, emailRegex} from "../utils";
    import Modal from "./Modal.vue";
    import {ErrorReportManualDetails} from "../types";
    import ErrorAlert from "./ErrorAlert.vue";
    import {VTooltip} from 'v-tooltip';
    import i18next from "i18next";
    import {Language} from "../store/translations/locales";
    import {Error} from "../generated";
    import { ErrorsState } from "../store/errors/errors";
    import LoadingSpinner from "./LoadingSpinner.vue";
    import {DataExplorationState} from "../store/dataExploration/dataExploration";


    interface Methods {
        generateErrorReport: (payload: ErrorReportManualDetails) => void
        sendErrorReport: () => void
        cancelErrorReport: () => void
        resetData: () => void
        close: () => void
        checkValidEmail: () => void
    }

    interface Computed {
        currentLanguage: Language,
        isGuest: boolean
        disabled: boolean,
        tooltipText: string,
        errorReportError: Error | null
        sendingErrorReport: boolean
        pattern: RegExp
    }

    interface Props {
        open: boolean
    }

    interface Data extends ErrorReportManualDetails {
        showFeedback: boolean
        validEmail: boolean
    }

    export default Vue.extend<Data, Methods, Computed, Props>({
        components: {
            ErrorAlert,
            Modal,
            LoadingSpinner
        },
        directives: {tooltip: VTooltip},
        props: {
            open: Boolean
        },
        name: "ErrorReport",
        data: function () {
            return {
                description: "",
                stepsToReproduce: "",
                email: "",
                showFeedback: false,
                validEmail: false
            }
        },
        computed: {
            currentLanguage: mapStateProp<DataExplorationState, Language>(null,
                (state: DataExplorationState) => state.language),
            errorReportError: mapStateProp<ErrorsState, Error | null>(
                "errors",
                (state: ErrorsState) => state.errorReportError),
            sendingErrorReport: mapStateProp<ErrorsState, boolean>(
                "errors",
                (state: ErrorsState) => state.sendingErrorReport),
            isGuest: mapGetterByName(null, "isGuest"),
            disabled() {
                return !this.description || !this.stepsToReproduce || (this.isGuest && !this.validEmail);
            },
            tooltipText() {
                return i18next.t("allFieldsRequired", {lng: this.currentLanguage});
            },
            pattern() {
                return emailRegex;
            }
        },
        methods: {
            generateErrorReport: mapActionByName(null, "generateErrorReport"),
            cancelErrorReport() {
                this.resetData();
                this.$emit("close");
            },
            async sendErrorReport() {
                this.$emit("send", {
                    description: this.description,
                    stepsToReproduce: this.stepsToReproduce,
                    email: this.email
                });

                this.resetData();
                this.showFeedback = true;
            },
            resetData() {
                this.description = "";
                this.stepsToReproduce = "";
                this.email = "";
            },
            close() {
                this.$emit("close");
            },
            checkValidEmail() {
                this.email = this.email.replace(/\s*/g, "");
                this.validEmail = validateEmail(this.email);
            }
        },
        watch: {
            open(newVal) {
                if (newVal === true) {
                    this.showFeedback = false;
                }
            }
        }
    })
</script>
