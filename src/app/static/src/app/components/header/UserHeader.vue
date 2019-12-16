<template>
    <header class="mb-5">
        <nav class="navbar navbar-dark bg-secondary">
            <div class="container-fluid">
                <div class="navbar-header">
                    {{title}}
                </div>
                <file-menu :title="title"></file-menu>
                <a href="https://forms.gle/QxCT1b4ScLqKPg6a7"
                   target="_blank"
                   class="pr-2 mr-2 border-right"
                   v-translate="'reportBug'">
                </a>
                <a href="/logout" class="pr-2 mr-2 border-right" v-translate="'logout'">
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

    interface Props {
        title: string,
        user: string
    }

    export default Vue.extend<{}, {}, {}, Props>({
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