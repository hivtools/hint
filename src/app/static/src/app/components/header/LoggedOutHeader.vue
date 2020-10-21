<template>
    <header class="mb-5">
        <nav class="navbar navbar-dark bg-secondary">
            <div class="container-fluid">
                <div class="navbar-header">
                    {{title}}
                </div>
                <language-menu></language-menu>
            </div>
        </nav>

    </header>
</template>
<script lang="ts">
    import Vue from "vue";
    import LanguageMenu from "./LanguageMenu.vue";
    interface Props {
        title: string
    }
    export default Vue.extend<unknown, unknown, unknown, Props>({
        props: {
            title: String
        },
        components: {
            LanguageMenu
        }
    })
</script>
