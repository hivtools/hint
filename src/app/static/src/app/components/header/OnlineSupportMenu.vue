<template>
    <div id="divclass">
        <drop-down text="support" :right="true" style="flex: none">
            <a class="dropdown-item"
               href="#"
               v-on:mousedown="() => faqLink"
               target="_blank"
               v-translate="'faq'">
            </a>
            <a class="dropdown-item"
               href="#"
               v-on:mousedown="() => contactLink"
               target="_blank"
               v-translate="'contact'">
            </a>
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
        modelBugReport: string
        currentLanguage: Language
        troubleFilename: string
        faqLink: void
        contactLink: void
    }

    export default Vue.extend<unknown, unknown, Computed, unknown>({
        computed: {
            currentLanguage: mapStateProp<RootState, Language>(null,
                (state: RootState) => state.language),
            support() {
                return i18next.t("support", this.currentLanguage)
            },
            modelBugReport() {
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
            contactLink() {
                window.open(this.modelBugReport, "_blank")
            },
            faqLink() {
                const link = "https://mrc-ide.github.io/naomi-troubleshooting/" + this.troubleFilename
                window.open(link,"_blank")
            }
        },
        components: {
            DropDown
        }
    })
</script>