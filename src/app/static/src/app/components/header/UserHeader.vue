<template>
    <header class="mb-5">
        <nav class="navbar navbar-dark bg-secondary">
            <div class="container-fluid">
                <div class="navbar-header">
                    {{title}}
                </div>
                <router-link id="projects-link" v-if="!isGuest" to="/projects" class="ml-2 pr-2 border-right" v-translate="'projects'"
                             style="flex:none"></router-link>
                <file-menu :title="title"></file-menu>
                <span v-if="!isGuest" class="pr-2 mr-2 border-right text-light">
                    <span v-translate="'loggedInAs'"></span> {{user}}
                </span>
                <a href="https://forms.gle/QxCT1b4ScLqKPg6a7"
                   target="_blank"
                   class="pr-2 mr-2 border-right"
                   v-translate="'reportBug'">
                </a>
                <a :href="'https://mrc-ide.github.io/naomi-troubleshooting/' + troubleFilename"
                   target="_blank"
                   class="pr-2 mr-2 border-right"
                   v-translate="'troubleshooting'">
                </a>
                <a :href="'public/resources/' + helpFilename"
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

    import Vue from "vue";
    import FileMenu from "./FileMenu.vue";
    import LanguageMenu from "./LanguageMenu.vue";
    import {Language} from "../../store/translations/locales";
    import {mapMutationByName, mapStateProp} from "../../utils";
    import {RootState} from "../../root";
    import {ProjectsMutations} from "../../store/projects/mutations";
    import {PayloadWithType} from "../../types";

    interface Props {
        title: string,
        user: string
    }

    interface Computed {
        helpFilename: string,
        troubleFilename: string,
        isGuest: boolean
    }

    export default Vue.extend<{}, {}, Computed, Props>({
        computed: {
            helpFilename: mapStateProp<RootState, string>(null,
                (state: RootState) => {
                    let filename = "Naomi-basic-instructions.pdf";
                    if (state.language == Language.fr) {
                        filename = "Naomi-instructions-de-base.pdf";
                    }
                    return filename;
                }),
            troubleFilename: mapStateProp<RootState, string>(null,
                (state: RootState) => {
                    let filename = "index-en.html";
                    if (state.language == Language.fr) {
                        filename = "index-fr.html";
                    }
                    return filename;
                }),
            isGuest() {
                return this.$store.getters.isGuest
            }
        },
        props: {
            title: String,
            user: String
        },
        components: {
            FileMenu,
            LanguageMenu
        }
    })
</script>
