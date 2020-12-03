<template>
    <drop-down :text="'support'" :right="true" style="flex: none">
        <a class="dropdown-item"
           :href="'https://mrc-ide.github.io/naomi-troubleshooting/' + troubleFilename"
           target="_blank"> FAQ
        </a>
        <a class="dropdown-item"
           href="https://forms.office.com/Pages/ResponsePage.aspx?id=B3WJK4zudUWDC0-CZ8PTB1APqcgcYz5DmSeKo5rlcfxUN0dWR1VMUEtHU0xDRU9HWFRNOFA5VVc3WCQlQCN0PWcu"
           target="_blank"> Contact
        </a>
    </drop-down>
</template>

<script lang="ts">
    import Vue from "vue";
    import DropDown from "./DropDown.vue";
    import i18next from "i18next";
    import {mapStateProp} from "../../utils";
    import {RootState} from "../../root";
    import {Language} from "../../store/translations/locales";

    interface Props {
        troubleFilename: string
    }

    interface Computed {
        support: string
        currentLanguage: Language
    }

    export default Vue.extend<unknown, unknown, Computed, Props>({
        props: {
            troubleFilename: String
        },
        computed: {
            currentLanguage: mapStateProp<RootState, Language>(null,
                (state: RootState) => state.language),
            support() {
                return i18next.t("support", this.currentLanguage)
            }
        },
        components: {
            DropDown
        }
    })
</script>