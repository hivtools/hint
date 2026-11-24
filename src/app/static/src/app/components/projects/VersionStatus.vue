<template>
    <div v-if="display" class="text-muted small pl-1">
        <span class="small float-right">
            <span v-translate="'project'"></span>: {{ projectName }} {{ versionLabel }}
        </span><br/>
        <span v-if="time" class="small float-right">
            <span v-translate="'lastSaved'"></span> {{ formattedTime }}
            <vue-feather type="check" size="14" class="align-middle mb-1"></vue-feather>
        </span>
    </div>
</template>

<script lang="ts">
import type {ProjectsState} from "../../store/projects/projects";
import {mapStateProp} from "../../utils";
import VueFeather from "vue-feather";
import {localDateTimeParts, versionLabel} from "../../utils";
import { defineComponent } from "vue";

const namespace = "projects";

export default defineComponent({
    computed: {
        display(): boolean {
            return !!this.projectName;
        },
        formattedTime(): string {
            if (!this.time) {
                return '';
            }
            const {hour, minute} = localDateTimeParts(this.time);
            return `${hour}:${minute}`;
        },
        time: mapStateProp<ProjectsState, Date | null>(namespace, state => state.versionTime),
        projectName: mapStateProp<ProjectsState, string | null>(namespace, state =>
            state.currentProject ? state.currentProject.name : null),
        versionLabel: mapStateProp<ProjectsState, string | null>(namespace, state =>
            state.currentVersion ? versionLabel(state.currentVersion) : null)
    },
    components: {
        VueFeather
    }
});
</script>
