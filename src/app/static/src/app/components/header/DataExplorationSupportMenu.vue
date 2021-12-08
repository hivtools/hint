<template>
    <div id="divclass">
        <drop-down text="support" :right="true" :delay="true" style="flex: none">
            <a class="dropdown-item"
               @click="toggleErrorReportModal"
               v-translate="'reportIssues'">
            </a>
            <router-link id="accessibility-link"
                         to="/accessibility"
                         class="dropdown-item"
                         v-translate="'axe'">
            </router-link>
        </drop-down>
    </div>
</template>
<script lang="ts">
    import Vue from "vue";
    import DropDown from "./DropDown.vue";
    import i18next from "i18next";
    import {mapStateProp} from "../../utils";
    import {Language} from "../../store/translations/locales";
    import {DataExplorationState} from "../../store/dataExploration/dataExploration";

    interface Computed {
        support: string
        currentLanguage: Language
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
            currentLanguage: mapStateProp<DataExplorationState, Language>(null,
                (state: DataExplorationState) => state.language),
            support() {
                return i18next.t("support", this.currentLanguage)
            }
        },
        methods: {
            toggleErrorReportModal() {
                this.errorReportOpen = !this.errorReportOpen
                console.log("Ignore, to be used by error report modal")
            }
        },
        components: {
            DropDown
        }
    })
</script>
