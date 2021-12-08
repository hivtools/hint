<template>
    <div id="divclass">
        <drop-down text="support" :right="true" :delay="true" style="flex: none">
            <a class="dropdown-item"
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

    export default Vue.extend<unknown, unknown, Computed, unknown>({
        computed: {
            currentLanguage: mapStateProp<DataExplorationState, Language>(null,
                (state: DataExplorationState) => state.language),
            support() {
                return i18next.t("support", this.currentLanguage)
            }
        },
        components: {
            DropDown
        }
    })
</script>
