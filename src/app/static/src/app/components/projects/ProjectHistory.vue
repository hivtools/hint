<template>
    <div v-if="projects.length > 0">
        <h5 v-translate="'projectHistory'"></h5>
        <div id="headers" class="row font-weight-bold pt-2">
            <div class="col-md-1 header-cell"></div>
            <div class="col-md-3 header-cell" v-translate="'projectName'"></div>
            <div class="col-md-1 header-cell">Versions</div>
            <div class="col-md-3 header-cell" v-translate="'lastUpdated'"></div>
        </div>
        <hr/>
        <div v-for="p in projects">
            <div :id="`p-${p.id}`"  class="row py-2">
                <div class="col-md-1 project-cell">
                    <button v-b-toggle="`versions-${p.id}`" class="btn btn-xs bg-transparent shadow-none py-0">
                        <chevron-right-icon size="20" class="icon when-closed"></chevron-right-icon>
                        <chevron-down-icon size="20" class="icon when-open"></chevron-down-icon>
                    </button>
                </div>
                <div class="col-md-3 project-cell">
                    {{p.name}}
                </div>
                <div class="col-md-1 project-cell"><small class="text-muted">{{versionCountLabel(p)}}</small></div>
                <div class="col-md-3 project-cell">{{format(p.versions[0].updated)}}</div>
                <div class="col-md-4 project-cell">
                    <a @click="loadVersion($event, p.id, p.versions[0].id)" href="" v-translate="'loadLastUpdated'"></a>
                </div>
            </div>
            <b-collapse :id="`versions-${p.id}`">
                <div v-for="v in p.versions" :id="`v-${v.id}`" class="row font-italic bg-light py-2">
                    <div class="col-md-4 version-cell"></div>
                    <div class="col-md-1 project-cell">{{`v${v.versionNumber}`}}</div>
                    <div class="col-md-3 version-cell">{{format(v.updated)}}</div>
                    <div class="col-md-4 version-cell">
                        <a @click="loadVersion($event, p.id, v.id)" href="" v-translate="'load'"></a>
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
        loadAction: (version: VersionIds) => void,
        versionCountLabel: (project: Project) => string
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
           versionCountLabel(project: Project) {
               return project.versions.length == 1 ? "1 version" : `${project.versions.length} versions`
           }
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

