<template>
    <drop-down :text="currentLanguage" :right="true" style="flex: none">
        <p class="dropdown-item" tabindex="0" v-on:mousedown="() => changeLanguage('en')" style="margin: 0;">
            EN
        </p>
        <p class="dropdown-item" tabindex="0" v-on:mousedown="() => changeLanguage('fr')" style="margin: 0;">
            FR
        </p>
        <p class="dropdown-item" tabindex="0" v-on:mousedown="() => changeLanguage('pt')" style="margin: 0;">
            PT
        </p>
    </drop-down>
</template>
<script lang="ts">
    import {mapActionByName, mapStateProp} from "../../utils";
    import DropDown from "./DropDown.vue";
    import {DataExplorationState} from "../../store/dataExploration/dataExploration";
    import { defineComponent } from "vue";

    interface Methods {
        changeLanguage: (lang: string) => void
    }

    interface Computed {
        currentLanguage: string
    }

    export default defineComponent({
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