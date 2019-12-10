<template>
    <drop-down :text="currentLanguage" style="flex:none">
        <a class="dropdown-item" href="#" v-on:mousedown="() => changeLanguage('en')">
            EN
        </a>
        <a class="dropdown-item" href="#" v-on:mousedown="() => changeLanguage('fr')">
            FR
        </a>
    </drop-down>
</template>
<script lang="ts">

    import Vue from "vue";
    import {mapActionByName, mapStateProp} from "../../utils";
    import {RootState} from "../../root";
    import DropDown from "./DropDown.vue";

    interface Methods {
        changeLanguage: (lang: string) => void
    }

    interface Computed {
        currentLanguage: string
    }

    export default Vue.extend<{}, Methods, Computed, {}>({
        computed: {
            currentLanguage: mapStateProp<RootState, string>(null,
                (state: RootState) => state.language.toUpperCase())
        },
        methods: {
            changeLanguage: mapActionByName<File>(null, "changeLanguage")
        },
        components: {
            DropDown
        }
    })
</script>