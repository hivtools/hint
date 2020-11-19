<template>
    <drop-down :text="`v${hintrVersions.naomi}`" :right="true" style="flex: none">
        <span class="dropdown-item" style="cursor: default;"> naomi    : v{{ hintrVersions.naomi }} </span>
        <span class="dropdown-item" style="cursor: default;"> hintr    : v{{ hintrVersions.hintr }} </span>
        <span class="dropdown-item" style="cursor: default;"> rrq      : v{{ hintrVersions.rrq }} </span>
        <span class="dropdown-item" style="cursor: default;"> traduire : v{{ hintrVersions.traduire }}</span>
        <span class="dropdown-item" style="cursor: default;"> hint : v{{ hintVersion }}</span>
    </drop-down>
</template>

<script lang="ts">
    import Vue from "vue";
    import {HintrVersionResponse} from "../../generated";
    import {RootState} from "../../root";
    import {mapActionByName, mapStateProp} from "../../utils";
    import DropDown from "./DropDown.vue";
    import {currentHintVersion} from "../../hintVersion";

    interface Computed {
        hintrVersions: HintrVersionResponse;
        hintVersion: string
    }

    interface Methods {
        showHintrVersion: () => void;
    }

    const namespace = "hintrVersion";
    export default Vue.extend<unknown, Methods, Computed, unknown>({

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
