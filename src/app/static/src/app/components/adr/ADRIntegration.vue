<template>
    <div v-if="loggedIn" class="mb-5">
        <adr-key></adr-key>
        <div v-if="key">
            <select-dataset></select-dataset>
            <div>
            <span class="font-weight-bold align-self-stretch"
                  v-translate="'adrAccessLevel'">
           </span>
                <span v-tooltip="handleCapacityTooltip(capacity)">
                    <a href="#">{{ handleCapacity(capacity) }}</a>
                    </span>
            </div>
        </div>
    </div>
</template>
<script lang="ts">
    import Vue from "vue";
    import {mapActionByName, mapStateProp, mapGetterByName} from "../../utils";
    import adrKey from "./ADRKey.vue";
    import SelectDataset from "./SelectDataset.vue";
    import {ADRState} from "../../store/adr/adr";
    import {VTooltip} from "v-tooltip";

    interface Methods {
        getDatasets: () => void
        fetchADRKey: () => void
        getUserCanUpload: () => void
        handleCapacityTooltip: (access: string) => string | null
        handleCapacity: (access: string) => string | null
    }

    enum capacityEnum {
        admin = " You have the required permission to push output files to ADR",
        editor = "ADR access level: You do not have permission to push data to ADR",
        member = "ADR access level: You do not have the right permission to push data to ADR",
    }

    interface Computed {
        isGuest: boolean
        loggedIn: boolean
        key: string | null,
        capacity: string | null
    }

    const namespace = "adr";

    export default Vue.extend<unknown, Methods, Computed, unknown>({
        components: {adrKey, SelectDataset},
        computed: {
            isGuest: mapGetterByName(null, "isGuest"),
            loggedIn() {
                return !this.isGuest
            },
            key: mapStateProp<ADRState, string | null>(namespace,
                (state: ADRState) => state.key),

            capacity: mapStateProp<ADRState, string | null>(namespace,
                (state: ADRState) => state.capacity)
        },
        methods: {
            getDatasets: mapActionByName(namespace, 'getDatasets'),
            fetchADRKey: mapActionByName(namespace, "fetchKey"),
            getUserCanUpload: mapActionByName(namespace, 'getUserCanUpload'),
            handleCapacityTooltip: function (access: string) {
                let capacity = null;
                switch (access) {
                    case "admin":
                        capacity = capacityEnum.admin
                        break
                    case "member":
                        capacity = capacityEnum.member
                        break
                    case "editor":
                        capacity = capacityEnum.editor
                }
                return capacity
            },

            handleCapacity: function (access: string) {
                let capacity = null;
                switch (access) {
                    case "admin":
                        capacity = "Read & Write"
                        break
                    case "member":
                        capacity = "Read"
                        break
                    case "editor":
                        capacity = "Read & Write"
                }
                return capacity
            }
        },
        created() {
            if (this.loggedIn) {
                this.fetchADRKey();
            }
        },
        watch: {
            key() {
                this.getDatasets();
                this.getUserCanUpload()
            }
        },
        directives: {
            "tooltip": VTooltip
        }
    })
</script>
