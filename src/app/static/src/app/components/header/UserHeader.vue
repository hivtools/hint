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
                <file-menu :title="title || ''"></file-menu>
                <span v-if="!isGuest" class="pr-2 mr-2 border-right text-white">
                    <span v-translate="'loggedInAs'"></span> {{ user }}
                </span>
                <hintr-version-menu class="pr-2 mr-2 border-right"/>
                <online-support-menu class="pr-2 mr-2 border-right"/>
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
    import {mapGetters} from 'vuex';
    import FileMenu from "./FileMenu.vue";
    import LanguageMenu from "./LanguageMenu.vue";
    import HintrVersionMenu from "./HintrVersionMenu.vue";
    import OnlineSupportMenu from "./OnlineSupportMenu.vue";
    import { defineComponent } from "vue";

    export default defineComponent({
        computed: {
            ...mapGetters(["isGuest"])
        },
        props: {
            title: {
                type: String,
                required: false
            },
            user: {
                type: String,
                required: false
            }
        },
        components: {
            FileMenu,
            LanguageMenu,
            HintrVersionMenu,
            OnlineSupportMenu
        }
    })
</script>
