<template>
    <header class="mb-5">
        <nav class="navbar navbar-dark bg-secondary">
            <div class="container-fluid">
                <div class="navbar-header">
                    {{ title }}
                </div>
                <router-link id="projects-link" v-if="!isGuest" to="/projects" class="ml-2 pr-2 border-right"
                             v-translate="'projects'"
                             style="flex:none"></router-link>
                <file-menu :title="title"></file-menu>
                <span v-if="!isGuest" class="pr-2 mr-2 border-right text-white">
                    <span v-translate="'loggedInAs'"></span> {{ user }}
                </span>
                <hintr-version-menu class="pr-2 mr-2 border-right"/>
                <online-support-menu class="pr-2 mr-2 border-right"/>
                <a :href="helpFilename"
                   target="_blank"
                   class="pr-2 mr-2 border-right"
                   v-translate="'help'">
                </a>
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

    import {defineComponent} from "vue";
    import {mapGetters} from 'vuex';
    import FileMenu from "./FileMenu.vue";
    import LanguageMenu from "./LanguageMenu.vue";
    import {Language} from "../../store/translations/locales";
    import {HelpFile, mapStateProp} from "../../utils";
    import {RootState} from "../../root";
    import HintrVersionMenu from "./HintrVersionMenu.vue";
    import OnlineSupportMenu from "./OnlineSupportMenu.vue";

    interface Props {
        title: string,
        user: string
    }

    interface Computed {
        helpFilename: string
    }
    export default defineComponent<unknown, unknown, Computed, Props>({
        computed: {
            helpFilename: mapStateProp<RootState, string>(null,
                (state: RootState) => {
                    if (state.language == Language.fr) {
                        return HelpFile.french;
                    }
                    return HelpFile.english;
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
