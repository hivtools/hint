<template>
    <div v-if="projects.length > 0">
        <h5 v-translate="'projectHistory'"></h5>
        <div id="headers" class="row font-weight-bold pt-2">
            <div class="col-md-1 header-cell"></div>
            <div class="col-md-2 header-cell" v-translate="'projectName'"></div>
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
                <div class="col-md-2 project-cell">
                    {{p.name}}
                </div>
                <div class="col-md-3 project-cell">{{format(p.versions[0].updated)}}</div>
                <div class="col-md-2 project-cell">
                    <a @click="loadVersion($event, p.id, p.versions[0].id)" href="" v-translate="'loadLastUpdated'"></a>
                </div>
                <div class="col-md-2 project-cell">
                    <a @click="deleteProject($event, p.id)" href="" v-translate="'delete'"></a>
                </div>
                <div class="col-md-2 project-cell">
                    <a href="" >Copy to new project</a>
                </div>
            </div>
            <b-collapse :id="`versions-${p.id}`">
                <div v-for="v in p.versions" :id="`v-${v.id}`" class="row font-italic bg-light py-2">
                    <div class="col-md-3 version-cell"></div>
                    <div class="col-md-3 version-cell">{{format(v.updated)}}</div>
                    <div class="col-md-2 version-cell">
                        <a @click="loadVersion($event, p.id, v.id)" href="" v-translate="'load'"></a>
                    </div>
                    <div class="col-md-2 version-cell">
                        <a @click="deleteVersion($event, p.id, v.id)" href="" v-translate="'delete'"></a>
                    </div>
                    <div class="col-md-2 version-cell">
                        <a href="" >Copy to new project</a>
                    </div>
                </div>
            </b-collapse>
        </div>
        <modal :open="projectToDelete || versionToDelete">
            <h4 v-if="projectToDelete" v-translate="'deleteProject'"></h4>
            <h4 v-if="versionToDelete" v-translate="'deleteVersion'"></h4>
            <template v-slot:footer>
                <button type="button"
                        class="btn btn-white"
                        @click="confirmDelete"
                        v-translate="'ok'">
                </button>
                <button type="button"
                         class="btn btn-red"
                        @click="cancelDelete"
                        v-translate="'cancel'">
                </button>
            </template>
        </modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {VersionIds, Project} from "../../types";
    import {BCollapse} from "bootstrap-vue";
    import { VBToggle } from 'bootstrap-vue';
    import {ChevronDownIcon, ChevronRightIcon} from "vue-feather-icons";
    import Modal from "../Modal.vue"
    import {formatDateTime, mapActionByName} from "../../utils";

    interface Data {
        projectToDelete: number | null,
        versionToDelete: VersionIds | null
    }

    interface Props {
        projects: Project[];
    }

    interface Methods {
        format: (date: string) => void,
        loadVersion: (event: Event, projectId: number, versionId: string) => void,
        loadAction: (version: VersionIds) => void
        deleteProject: (event: Event, projectId: number) => void,
        deleteVersion: (event: Event, projectId: number, versionId: string) => void
        cancelDelete: () => void
        confirmDelete: () => void,
        deleteProjectAction: (projectId: number) => void,
        deleteVersionAction: (versionIds: VersionIds) => void
    }

    export default Vue.extend<Data, Methods, {}, Props>({
       props: {
            projects: {
                type: Array
            }
       },
       data() {
           return {
               projectToDelete: null,
               versionToDelete: null
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
           deleteProject(event: Event, projectId: number) {
               event.preventDefault();
               this.projectToDelete = projectId;
           },
           deleteVersion(event: Event, projectId: number, versionId: string) {
               event.preventDefault();
               this.versionToDelete = {projectId, versionId};
           },
           cancelDelete() {
               this.versionToDelete = null;
               this.projectToDelete = null;
           },
           confirmDelete() {
                if (this.projectToDelete) {
                    this.deleteProjectAction(this.projectToDelete);
                    this.projectToDelete = null;
                } else if (this.versionToDelete) {
                    this.deleteVersionAction(this.versionToDelete);
                    this.versionToDelete = null;
                }
           },
           loadAction: mapActionByName<VersionIds>("projects", "loadVersion"),
           deleteProjectAction: mapActionByName<number>("projects", "deleteProject"),
           deleteVersionAction: mapActionByName<VersionIds>("projects", "deleteVersion")
       },
       components: {
           BCollapse,
           ChevronDownIcon,
           ChevronRightIcon,
           Modal
       },
       directives: {
           'b-toggle': VBToggle
       }
    });
</script>

