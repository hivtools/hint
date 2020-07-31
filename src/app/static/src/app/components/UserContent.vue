<template>
    <div>
        <div class="container mb-5">
            <versions v-if="showVersions"></versions>
            <stepper v-if="!showVersions"></stepper>
        </div>
        <snapshot-status></snapshot-status>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Stepper from "./Stepper";
    import Versions from "./versions/Versions";
    import {mapStateProps} from "../utils";
    import {VersionsState} from "../store/versions/versions";
    import {Snapshot} from "../types";
    import SnapshotStatus from "./versions/SnapshotStatus.vue";

    const namespace = "versions";

    interface Computed {
        manageVersions: boolean,
        isGuest: boolean,
        showVersions: boolean,
        currentSnapshot: Snapshot | null
    }

    interface Props {
        user: string
    }

    export default Vue.extend<{}, {}, Computed, Props>({
        props: {
            user: String
        },
        components: {
            Stepper,
            Versions,
            SnapshotStatus
        },
        computed: {
            ...mapStateProps<VersionsState, keyof Computed>(namespace, {
                manageVersions: state => state.manageVersions,
                currentSnapshot: state => state.currentSnapshot
            }),
            isGuest() {
                return this.user == "guest"
            },
            showVersions() {
                return !this.isGuest && (this.manageVersions || !this.currentSnapshot);
            }
        }
    });
</script>
