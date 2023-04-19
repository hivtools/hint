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
    import { defineComponentVue2 } from "../../defineComponentVue2/defineComponentVue2";
    import {mapActionByName, mapStateProp} from "../../utils";
    import DropDown from "./DropDown.vue";
    import {DataExplorationState} from "../../store/dataExploration/dataExploration";

    interface Methods {
        changeLanguage: (lang: string) => void
    }

    interface Computed {
        currentLanguage: string
    }

    export default defineComponentVue2<unknown, Methods, Computed>({
        computed: {
            currentLanguage: mapStateProp<DataExplorationState, string>(null,
                (state: DataExplorationState) => state.language.toUpperCase())
        },
        methods: {
            changeLanguage: mapActionByName<File>(null, "changeLanguage")
        },
        components: {
            DropDown
        }
    })
</script>