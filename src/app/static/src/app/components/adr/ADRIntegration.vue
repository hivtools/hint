<template>
    <div v-if="loggedIn" class="mb-5">
        <adr-key></adr-key>
        <select-dataset v-if="key"></select-dataset>
    </div>
</template>
<script lang="ts">
    import Vue from "vue";
    import {mapActionByName, mapStateProp, mapGetterByName} from "../../utils";
    import {RootState} from "../../root";
    import adrKey from "./ADRKey.vue";
    import SelectDataset from "./SelectDataset.vue";

    interface Methods {
        getDatasets: () => void
        fetchADRKey: () => void
    }

    interface Computed {
        isGuest: boolean
        loggedIn: boolean
        key: string | null
    }

     export default Vue.extend<unknown, Methods, Computed, unknown>({
        components: {adrKey, SelectDataset},
        computed: {
            isGuest: mapGetterByName(null, "isGuest"),
            loggedIn() {
                return !this.isGuest
            },
            key: mapStateProp<RootState, string | null>(null,
                (state: RootState) => state.adrKey)
        },
        methods: {
            getDatasets: mapActionByName(null, 'getADRDatasets'),
            fetchADRKey: mapActionByName(null, "fetchADRKey")
        },
        created() {
            if (this.loggedIn) {
                this.fetchADRKey();
            }
        },
        watch: {
            key() {
                this.getDatasets();
            }
        }
    })
</script>
