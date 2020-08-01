<template>
    <div v-if="display" class="text-muted small pl-1">
        <span v-if="success">
            <span>Saved snapshot at</span> {{formattedTime}}
            <check-icon size="14" class="mb-1"></check-icon>
        </span>
        <span v-if="!success">
            <span>Could not save snapshot at</span> {{formattedTime}}
            <alert-triangle-icon size="14" class="mb-1"></alert-triangle-icon>
        </span>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {VersionsState} from "../../store/versions/versions";
    import {mapStateProp} from "../../utils";
    import {CheckIcon, AlertTriangleIcon} from "vue-feather-icons";
    import moment from 'moment';

    const namespace = "versions";

    interface Computed {
        success: boolean | null,
        time: Date | null,
        display: boolean,
        formattedTime: string
    }

    export default Vue.extend<{}, {}, Computed, {}>({
        computed: {
            display: function() {
                return !!this.time;
            },
            formattedTime: function() {
                return this.time ? moment(this.time).format('HH:mm') : '';
            },
            success: mapStateProp<VersionsState, boolean | null>(namespace, state => state.snapshotSuccess),
            time: mapStateProp<VersionsState, Date | null>(namespace, state => state.snapshotTime)
        },
        components: {
            CheckIcon,
            AlertTriangleIcon
        }
    });
</script>
