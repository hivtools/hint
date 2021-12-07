<template>
    <language-menu-view :change-language="changeLanguage"
                        :current-language="currentLanguage">
    </language-menu-view>
</template>
<script lang="ts">

    import Vue from "vue";
    import {mapActionByName, mapStateProp} from "../../utils";
    import {RootState} from "../../root";
    import DropDown from "./DropDown.vue";
    import LanguageMenuView from "./LanguageMenuView.vue";

    interface Methods {
        changeLanguage: (lang: string) => void
    }

    interface Computed {
        currentLanguage: string
    }

    export default Vue.extend<unknown, Methods, Computed, unknown>({
        computed: {
            currentLanguage: mapStateProp<RootState, string>(null,
                (state: RootState) => state.language.toUpperCase())
        },
        methods: {
            changeLanguage: mapActionByName<File>(null, "changeLanguage")
        },
        components: {
            DropDown,
            LanguageMenuView
        }
    })
</script>