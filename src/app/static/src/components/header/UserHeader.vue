<template>
    <header class="mb-5">
        <nav class="navbar navbar-dark bg-secondary ps-3">
            <div class="container-fluid">
                <div class="navbar-header">
                    {{ title }}
                </div>
                <router-link id="projects-link" v-if="!isGuest" to="/projects" class="ps-2 pe-2"
                             v-translate="'projects'"
                             style="flex:auto"></router-link>
                <span v-if="!isGuest" class="pe-2 border-end text-white">
                    <span v-translate="'loggedInAs'"></span> {{ user }}
                </span>
                <div v-else style="flex:auto"></div>
                <hintr-version-menu class="pe-2 border-end"/>
                <online-support-menu class="pe-2 border-end"/>
                <a v-if="!isGuest" href="/logout" class="pe-2 ps-2 border-end" v-translate="'logout'">
                </a>
                <a v-if="isGuest" href="/login" class="pe-2 border-end" v-translate="'logIn'">
                </a>
                <language-menu></language-menu>
            </div>
        </nav>
    </header>
</template>
<script lang="ts">
    import {mapGetters} from 'vuex';
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
            LanguageMenu,
            HintrVersionMenu,
            OnlineSupportMenu
        }
    })
</script>
