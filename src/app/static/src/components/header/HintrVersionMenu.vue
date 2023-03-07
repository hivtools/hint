<template>
    <drop-down :text="`v${hintrVersions.naomi}`" :right="true" :delay="true" style="flex: none">
        <a class="dropdown-item"
           href="https://naomi.unaids.org/news"
           target="_blank"
           v-translate="'newsSite'">
        </a>
        <hr class="dropdown-divider">
        <span class="dropdown-item disabled"> naomi    : v{{ hintrVersions.naomi }} </span>
        <span class="dropdown-item disabled"> hintr    : v{{ hintrVersions.hintr }} </span>
        <span class="dropdown-item disabled"> rrq      : v{{ hintrVersions.rrq }} </span>
        <span class="dropdown-item disabled"> traduire : v{{ hintrVersions.traduire }}</span>
        <span class="dropdown-item disabled"> hint : v{{ hintVersion }}</span>
    </drop-down>
</template>

<script lang="ts">
    import {defineComponent} from "vue";
    import {HintrVersionResponse} from "../../generated";
    import {RootState} from "../../root";
    import {mapActionByName, mapStateProp} from "../../utils";
    import DropDown from "./DropDown.vue";
    import {currentHintVersion} from "../../hintVersion";

    interface Computed {
        [key: string]: any
        hintrVersions: HintrVersionResponse;
        hintVersion: () => string
    }

    interface Methods {
        [key: string]: any
        showHintrVersion: () => void;
    }

    const namespace = "hintrVersion";
    export default defineComponent<{}, unknown, {}, Computed, Methods>({

        computed: {
            hintrVersions: mapStateProp<RootState, HintrVersionResponse>(
                null,
                (state: RootState) => state.hintrVersion.hintrVersion
            ),
            hintVersion: () => currentHintVersion
        },

        methods: {
            showHintrVersion: mapActionByName(namespace, "getHintrVersion"),
        },

        mounted() {
            this.showHintrVersion();
        },

        components: {
            DropDown,
        },
    });
</script>
