<template>
    <div v-if="display" class="text-muted small pl-1">
        <span v-translate="'lastSaved'"></span> {{formattedTime}}
        <check-icon size="14" class="mb-1"></check-icon>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {VersionsState} from "../../store/versions/versions";
    import {mapStateProp} from "../../utils";
    import {CheckIcon} from "vue-feather-icons";
    import moment from 'moment';

    const namespace = "versions";

    interface Computed {
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
            time: mapStateProp<VersionsState, Date | null>(namespace, state => state.snapshotTime)
        },
        components: {
            CheckIcon
        }
    });
</script>
