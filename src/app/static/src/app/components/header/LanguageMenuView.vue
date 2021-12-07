<template>
    <drop-down :text="currentLanguage" :right="true" style="flex: none">
        <a class="dropdown-item" href="#" v-on:mousedown="() => changeLanguage('en')">
            EN
        </a>
        <a class="dropdown-item" href="#" v-on:mousedown="() => changeLanguage('fr')">
            FR
        </a>
        <a class="dropdown-item" href="#" v-on:mousedown="() => changeLanguage('pt')">
            PT
        </a>
    </drop-down>
</template>

<script lang="ts">
    import DropDown from "./DropDown.vue";
    import Vue from "vue";

    interface Props {
        currentLanguage: string,
        changeLanguage: Function
    }

    export default Vue.extend<unknown, unknown, unknown, Props>({
        name: "LanguageMenuView",
        props: {
            currentLanguage:  String,
            changeLanguage: Function
        },
        components: {
            DropDown
        }
    })
</script>