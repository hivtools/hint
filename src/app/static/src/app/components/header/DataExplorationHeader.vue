<template>
    <header class="mb-5">
        <nav class="navbar navbar-dark bg-secondary">
            <div class="container-fluid">
                <div class="navbar-header">
                    {{ title }}
                </div>
                <div style="flex: 1 1 auto;"><a href="/">Naomi</a></div>
                <span v-if="!isGuest" class="pr-2 mr-2 border-right text-white">
                    <span v-translate="'loggedInAs'"></span> {{ user }}
                </span>
                <hintr-version-menu class="pr-2 mr-2 border-right"/>
                <a v-if="!isGuest" href="/logout" class="pr-2 mr-2 border-right" v-translate="'logout'">
                </a>
                <a v-if="isGuest" href="/login" class="pr-2 mr-2 border-right" v-translate="'logIn'">
                </a>
                <language-menu></language-menu>
            </div>
        </nav>

    </header>
</template>
<script lang="ts">

    import Vue from "vue";
    import {mapGetters} from 'vuex';
    import FileMenu from "./FileMenu.vue";
    import LanguageMenu from "./LanguageMenu.vue";
    import {Language} from "../../store/translations/locales";
    import {mapStateProp} from "../../utils";
    import HintrVersionMenu from "./HintrVersionMenu.vue";
    import OnlineSupportMenu from "./OnlineSupportMenu.vue";
    import {DataExplorationState} from "../../store/dataExploration/dataExploration";

    interface Props {
        title: string,
        user: string
    }

    interface Computed {
        helpFilename: string
    }

    export default Vue.extend<unknown, unknown, Computed, Props>({
        computed: {
            helpFilename: mapStateProp<DataExplorationState, string>(null,
                (state: DataExplorationState) => {
                    let filename = "Naomi-basic-instructions.pdf";
                    if (state.language == Language.fr) {
                        filename = "Naomi-instructions-de-base.pdf";
                    }
                    return filename;
                }),
            ...mapGetters(["isGuest"])
        },
        props: {
            title: String,
            user: String
        },
        components: {
            FileMenu,
            LanguageMenu,
            HintrVersionMenu,
            OnlineSupportMenu
        }
    })
</script>
