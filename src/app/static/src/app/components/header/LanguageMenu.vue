<template>
    <drop-down :text="currentLanguage" :right="true" style="flex: none">
        <a class="dropdown-item" href="#" v-on:mousedown="() => handleChangeLanguage('en')">
            EN
        </a>
        <a class="dropdown-item" href="#" v-on:mousedown="() => handleChangeLanguage('fr')">
            FR
        </a>
        <a class="dropdown-item" href="#" v-on:mousedown="() => handleChangeLanguage('pt')">
            PT
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
        handleChangeLanguage: (lang: string) => void
        plottingMetadata: () => void
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
            changeLanguage: mapActionByName<File>(null, "changeLanguage"),
            plottingMetadata: mapActionByName("metadata", "getPlottingMetadata"),
            async handleChangeLanguage(lang) {
                await this.changeLanguage(lang)
                await this.plottingMetadata()
            }
        },
        components: {
            DropDown
        }
    })
</script>