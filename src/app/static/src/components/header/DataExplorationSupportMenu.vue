<template>
    <div id="divclass">
        <drop-down text="support" :right="true" :delay="true" style="flex: none">
            <a class="dropdown-item"
               @click="toggleErrorReportModal"
               tabindex="0"
               v-translate="'troubleshootingRequest'">
            </a>
            <router-link id="privacy-link"
                         to="/privacy"
                         class="dropdown-item"
                         v-translate="'privacy'">
            </router-link>
            <router-link id="accessibility-link"
                         to="/accessibility"
                         class="dropdown-item"
                         v-translate="'axe'">
            </router-link>
        </drop-down>
        <error-report :open="errorReportOpen"
                      @send="sendErrorReport"
                      @close="toggleErrorReportModal">
        </error-report>
    </div>
</template>
<script lang="ts">
    import {defineComponent} from "vue";
    import DropDown from "./DropDown.vue";
    import i18next from "i18next";
    import {mapActionByName, mapStateProp} from "../../utils";
    import ErrorReport from "../ErrorReport.vue"
    import {Language} from "../../store/translations/locales";
    import {DataExplorationState} from "../../store/dataExploration/dataExploration";
    import {ErrorReportManualDetails} from "../../types";

    interface Computed {
        support: string
        currentLanguage: Language
    }

    interface Data {
        errorReportOpen: boolean
    }

    interface Methods {
        toggleErrorReportModal: () => void
        sendErrorReport: (errorReport: ErrorReportManualDetails) => void
        generateErrorReport: (payload: ErrorReportManualDetails) => void
    }

    export default defineComponent<Data, Methods, Computed, unknown>({
        data: function () {
            return {
                errorReportOpen: false
            }
        },
        computed: {
            currentLanguage: mapStateProp<DataExplorationState, Language>(null,
                (state: DataExplorationState) => state.language),
            support() {
                return i18next.t("support", this.currentLanguage)
            }
        },
        methods: {
            generateErrorReport: mapActionByName(null, "generateErrorReport"),
            toggleErrorReportModal() {
                this.errorReportOpen = !this.errorReportOpen
            },
            async sendErrorReport(errorReport) {
                await this.generateErrorReport({
                    section: "dataExploration",
                    ...errorReport
                })
            }
        },
        components: {
            DropDown,
            ErrorReport
        }
    })
</script>
