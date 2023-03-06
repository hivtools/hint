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

    import {defineComponent} from "vue";
    import {mapActionByName, mapStateProp} from "../../utils";
    import DropDown from "./DropDown.vue";
    import {DataExplorationState} from "../../store/dataExploration/dataExploration";

    interface Methods {
        changeLanguage: (lang: string) => void
    }

    interface Computed {
        currentLanguage: string
    }

    export default defineComponent<unknown, Methods, Computed, unknown>({
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