<template>
    <header class="mb-5">
        <nav class="navbar navbar-dark bg-secondary">
            <div class="container-fluid">
                <div class="navbar-header">
                    {{ title }}
                </div>
                <language-menu></language-menu>
            </div>
        </nav>

    </header>
</template>
<script lang="ts">
    import {defineComponent} from "vue";
    import LanguageMenu from "./LanguageMenu.vue";

    interface Props {
        title: string
    }

    export default defineComponent<Props>({
        components: {
            LanguageMenu
        }
    })
</script>
