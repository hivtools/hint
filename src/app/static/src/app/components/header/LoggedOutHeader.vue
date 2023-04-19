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
    import { defineComponentVue2WithProps } from "../../defineComponentVue2/defineComponentVue2";
    import LanguageMenu from "./LanguageMenu.vue";

    interface Props {
        title: string
    }

    export default defineComponentVue2WithProps<unknown, unknown, unknown, Props>({
        props: {
            title: {
                type: String,
                required: true
            }
        },
        components: {
            LanguageMenu
        }
    })
</script>
