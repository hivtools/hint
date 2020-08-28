<template>
    <div v-if="projects.length > 0">
        <h5 v-translate="'projectHistory'"></h5>
        <div id="headers" class="row font-weight-bold pt-2">
            <div class="col-md-1 header-cell"></div>
            <div class="col-md-3 header-cell" v-translate="'projectName'"></div>
            <div class="col-md-3 header-cell" v-translate="'lastUpdated'"></div>
        </div>
        <hr/>
        <div v-for="v in projects">
            <div :id="`v-${v.id}`"  class="row py-2">
                <div class="col-md-1 project-cell">
                    <button v-b-toggle="`versions-${v.id}`" class="btn btn-xs bg-transparent shadow-none py-0">
                        <chevron-right-icon size="20" class="icon when-closed"></chevron-right-icon>
                        <chevron-down-icon size="20" class="icon when-open"></chevron-down-icon>
                    </button>
                </div>
                <div class="col-md-3 project-cell">
                    {{v.name}}
                </div>
                <div class="col-md-3 project-cell">{{format(v.versions[0].updated)}}</div>
            </div>
            <b-collapse :id="`versions-${v.id}`">
                <div v-for="s in v.versions" :id="`s-${s.id}`" class="row font-italic bg-light py-2">
                    <div class="col-md-4 version-cell"></div>
                    <div class="col-md-3 version-cell">{{format(s.updated)}}</div>
                    <div class="col-md-4 version-cell">
                        <a @click="loadVersion($event, v.id, s.id)" href="" v-translate="'load'"></a>
                    </div>
                </div>
            </b-collapse>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {VersionIds, Project} from "../../types";
    import {BCollapse} from "bootstrap-vue";
    import { VBToggle } from 'bootstrap-vue';
    import {ChevronDownIcon, ChevronRightIcon} from "vue-feather-icons";
    import {formatDateTime, mapActionByName, mapStateProp} from "../../utils";

    interface Props {
        projects: Project[];
    }

    interface Methods {
        format: (date: string) => void,
        loadVersion: (event: Event, projectId: number, versionId: string) => void,
        loadAction: (version: VersionIds) => void
    }

    export default Vue.extend<{}, Methods, {}, Props>({
       props: {
            projects: {
                type: Array
            }
       },
       methods: {
           format(date: string) {
               return formatDateTime(date);
           },
           loadVersion(event: Event, projectId: number, versionId: string) {
                event.preventDefault();
               this.loadAction({projectId, versionId});
           },
           loadAction: mapActionByName<VersionIds>("projects", "loadVersion"),
       },
       components: {
           BCollapse,
           ChevronDownIcon,
           ChevronRightIcon
       },
       directives: {
           'b-toggle': VBToggle
       }
    });
</script>

