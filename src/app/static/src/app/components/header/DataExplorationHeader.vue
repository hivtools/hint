<template>
    <header class="mb-5">
        <nav class="navbar navbar-dark bg-secondary">
            <div class="container-fluid">
                <div class="navbar-header-secondary">
                    {{ title }}
                </div>
                <div style="flex: 1 1 auto;" class="ml-2"><a href="/" v-translate="'runModel'"></a></div>
                <span v-if="!isGuest" class="pr-2 mr-2 border-right text-white">
                    <span v-translate="'loggedInAs'"></span> {{ user }}
                </span>
                <hintr-version-menu class="pr-2 mr-2 border-right"/>
                <data-exploration-support-menu class="pr-2 mr-2 border-right"/>
                <a :href="helpFilename"
                   id="helpFile"
                   target="_blank"
                   class="pr-2 mr-2 border-right"
                   v-translate="'dataExplorationHelp'">
                </a>
                <a v-if="!isGuest" :href="'/logout'" class="pr-2 mr-2 border-right" v-translate="'logout'">
                </a>
                <a v-if="isGuest" :href="'/login?redirectTo=explore'" class="pr-2 mr-2 border-right" v-translate="'logIn'">
                </a>
                <language-menu></language-menu>
            </div>
        </nav>
    </header>
</template>
<script lang="ts">

    import {mapGetters} from 'vuex';
    import LanguageMenu from "./LanguageMenu.vue";
    import {Language} from "../../store/translations/locales";
    import {HelpFile, mapStateProp} from "../../utils";
    import HintrVersionMenu from "./HintrVersionMenu.vue";
    import {DataExplorationState} from "../../store/dataExploration/dataExploration";
    import DataExplorationSupportMenu from "./DataExplorationSupportMenu.vue";
    import { defineComponentVue2WithProps } from '../../defineComponentVue2/defineComponentVue2';

    interface Props {
        title: string,
        user: string
    }

    interface Computed {
        helpFilename: string
    }

    export default defineComponentVue2WithProps<unknown, unknown, Computed, Props>({
        computed: {
            helpFilename: mapStateProp<DataExplorationState, string>(null,
                (state: DataExplorationState) => {
                    if (state.language == Language.fr) {
                        return HelpFile.french;
                    }
                    return HelpFile.english;
                }),
            ...mapGetters(["isGuest"])
        },
        props: {
            title: {
                type: String,
                required: true
            },
            user: {
                type: String,
                required: true
            }
        },
        components: {
            LanguageMenu,
            HintrVersionMenu,
            DataExplorationSupportMenu
        }
    })
</script>
