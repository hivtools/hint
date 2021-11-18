<template>
    <div id="divclass">
        <drop-down text="support" :right="true" :delay="true" style="flex: none">
            <a class="dropdown-item"
               :href="faqLocation"
               target="_blank"
               v-translate="'faq'">
            </a>
            <a class="dropdown-item"
               @click="toggleErrorReportModal"
               v-translate="'troubleshootingRequest'">
            </a>
            <router-link id="accessibility-link"
                         to="/accessibility"
                         class="dropdown-item"
                         v-translate="'axe'">
            </router-link>
        </drop-down>
        <error-report :open="errorReportOpen" @close="toggleErrorReportModal"></error-report>
    </div>
</template>
<script lang="ts">
    import Vue from "vue";
    import DropDown from "./DropDown.vue";
    import i18next from "i18next";
    import {mapStateProp} from "../../utils";
    import {RootState} from "../../root";
    import {Language} from "../../store/translations/locales";
    import ErrorReport from "../ErrorReport.vue";

    interface Computed {
        support: string
        currentLanguage: Language
        troubleFilename: string
        faqLocation: string
    }

    interface Data {
        errorReportOpen: boolean
    }

    interface Methods {
        toggleErrorReportModal: () => void
    }

    export default Vue.extend<Data, Methods, Computed, unknown>({
        data: function () {
            return {
                errorReportOpen: false
            }
        },
        computed: {
            currentLanguage: mapStateProp<RootState, Language>(null,
                (state: RootState) => state.language),
            support() {
                return i18next.t("support", this.currentLanguage)
            },
            troubleFilename: mapStateProp<RootState, string>(null,
                (state: RootState) => {
                    let filename = "index-en.html";
                    if (state.language == Language.fr) {
                        filename = "index-fr.html";
                    }
                    return filename;
                }),
            faqLocation() {
                return "https://mrc-ide.github.io/naomi-troubleshooting/" + this.troubleFilename;
            }
        },
        methods: {
           toggleErrorReportModal() {
                this.errorReportOpen = !this.errorReportOpen
            }
        },
        components: {
            DropDown,
            ErrorReport
        }
    })
</script>
