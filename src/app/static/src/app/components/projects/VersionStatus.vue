<template>
    <div v-if="display" class="text-muted small pl-1">
        <span class="float-right">
            <span v-translate="'project'"></span>: {{projectName}} {{versionLabel}}
        </span><br/>
        <span class="float-right">
            <span v-translate="'lastSaved'"></span> {{formattedTime}}
            <check-icon size="14" class="mb-1"></check-icon>
        </span>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {ProjectsState} from "../../store/projects/projects";
    import {mapStateProp} from "../../utils";
    import {CheckIcon} from "vue-feather-icons";
    import moment from 'moment';
    import {versionLabel} from "../../utils";

    const namespace = "projects";

    interface Computed {
        time: Date | null,
        projectName: string | null,
        versionLabel: string | null,
        display: boolean,
        formattedTime: string
    }

    export default Vue.extend<{}, {}, Computed, {}>({
        computed: {
            display: function() {
                return !!this.projectName;
            },
            formattedTime: function() {
                return this.time ? moment(this.time).format('HH:mm') : '';
            },
            time: mapStateProp<ProjectsState, Date | null>(namespace, state => state.versionTime),
            projectName: mapStateProp<ProjectsState, string | null>(namespace, state =>
                state.currentProject ? state.currentProject.name : null),
            versionLabel:  mapStateProp<ProjectsState, string | null>(namespace, state =>
                state.currentVersion ? versionLabel(state.currentVersion) : null)
        },
        components: {
            CheckIcon
        }
    });
</script>
