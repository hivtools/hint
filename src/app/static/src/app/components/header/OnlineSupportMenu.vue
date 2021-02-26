<template>
    <div id="divclass">
        <drop-down text="support" :right="true" :delay="true" style="flex: none">
            <a class="dropdown-item"
               :href="faqLocation"
               target="_blank"
               v-translate="'faq'">
            </a>
            <a class="dropdown-item"
               :href="bugReportLocation"
               target="_blank"
               v-translate="'contact'">
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
    import {RootState} from "../../root";
    import {Language} from "../../store/translations/locales";
    import {switches} from "../../featureSwitches";


    interface Computed {
        support: string
        bugReportLocation: string
        currentLanguage: Language
        troubleFilename: string
        faqLocation: string
    }

    export default Vue.extend<unknown, unknown, Computed, unknown>({
        computed: {
            currentLanguage: mapStateProp<RootState, Language>(null,
                (state: RootState) => state.language),
            support() {
                return i18next.t("support", this.currentLanguage)
            },
            bugReportLocation() {
                if (switches.modelBugReport) {
                    return "https://forms.office.com/Pages/ResponsePage.aspx?" +
                        "id=B3WJK4zudUWDC0-CZ8PTB1APqcgcYz5DmSeKo5rlcfxUN0dWR1VMUEtHU0xDRU9HWFRNOFA5VVc3WCQlQCN0PWcu"
                } else {
                    return "https://forms.gle/QxCT1b4ScLqKPg6a7"
                }
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
                return  "https://mrc-ide.github.io/naomi-troubleshooting/" + this.troubleFilename;
            }
        },
        components: {
            DropDown
        }
    })
</script>
