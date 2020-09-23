<template>
    <div v-if="projects.length > 0">
        <h5 v-translate="'projectHistory'"></h5>
        <div id="headers" class="row font-weight-bold pt-2">
            <div class="col-md-1 header-cell"></div>
            <div class="col-md-2 header-cell" v-translate="'projectName'"></div>
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
                <div class="col-md-2 project-cell">
                    {{p.name}}
                </div>
                <div class="col-md-1 project-cell"><small class="text-muted">{{versionCountLabel(p)}}</small></div>
                <div class="col-md-3 project-cell">{{format(p.versions[0].updated)}}</div>
                <div class="col-md-2 project-cell">
                    <a @click="loadVersion($event, p.id, p.versions[0].id)" href="" v-translate="'loadLastUpdated'"></a>
                </div>
                <div class="col-md-1 project-cell">
                    <a @click="deleteProject($event, p.id)" href="" v-translate="'delete'"></a>
                </div>
                <div class="col-md-2 project-cell">
                    <a @click="copyVersion($event, p.id, p.versions[0].id, p.versions[0].versionNumber)" href="" v-translate="'copyLatestToNewProject'"></a>
                </div>
            </div>
            <b-collapse :id="`versions-${p.id}`">
                <div v-for="v in p.versions" :id="`v-${v.id}`" class="row font-italic bg-light py-2">
                    <div class="col-md-3 version-cell"></div>
                    <div class="col-md-1 version-cell">{{`v${v.versionNumber}`}}</div>
                    <div class="col-md-3 version-cell">{{format(v.updated)}}</div>
                    <div class="col-md-2 version-cell">
                        <a @click="loadVersion($event, p.id, v.id)" href="" v-translate="'load'"></a>
                    </div>
                    <div class="col-md-1 version-cell">
                        <a @click="deleteVersion($event, p.id, v.id)" href="" v-translate="'delete'"></a>
                    </div>
                    <div class="col-md-2 version-cell">
                        <a @click="copyVersion($event, p.id, v.id, v.versionNumber)" href="" v-translate="'copyToNewProject'"></a>
                    </div>
                </div>
            </b-collapse>
        </div>
        <modal :open="projectToDelete || versionToDelete">
            <h4 v-if="projectToDelete" v-translate="'deleteProject'"></h4>
            <h4 v-if="versionToDelete" v-translate="'deleteVersion'"></h4>
            <template v-slot:footer>
                <button type="button"
                        class="btn btn-red"
                        @click="confirmDelete"
                        v-translate="'ok'">
                </button>
                <button type="button"
                         class="btn btn-white"
                        @click="cancelDelete"
                        v-translate="'cancel'">
                </button>
            </template>
        </modal>
        <modal :open="versionToCopy">
            <h4 >{{copyVersionHeader}}</h4>
            <h5 v-translate="'enterProjectName'"></h5>
            <template v-slot:footer>
                <div class="container">
                    <div class="row">
                        <input type="text" class="form-control" v-translate:placeholder="'projectName'" v-model="newProjectName">
                    </div>
                    <div class="row">
                        <button type="button"
                            class="btn btn-red mt-2 mr-1 col"
                            :disabled="disableCreate"
                            @click="confirmCopy(newProjectName)"
                            v-translate="'createProject'">
                        </button>
                        <button type="button"
                            class="btn btn-white mt-2 ml-1 col"
                            @click="cancelCopy"
                            v-translate="'cancel'">
                        </button>
                    </div>
                </div>
                
            </template>
        </modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import i18next from "i18next";
    import {VersionIds, Project} from "../../types";
    import {BCollapse} from "bootstrap-vue";
    import { VBToggle } from 'bootstrap-vue';
    import {ChevronDownIcon, ChevronRightIcon} from "vue-feather-icons";
    import Modal from "../Modal.vue"
    import {formatDateTime, mapActionByName, mapStateProps, mapStateProp} from "../../utils";
    import {ProjectsState} from "../../store/projects/projects";
    import { versionBundle } from "../../store/projects/actions";
    import {Language} from "../../store/translations/locales";
    import {RootState} from "../../root";

    const namespace = "projects";

    interface Data {
        projectToDelete: number | null,
        versionToDelete: VersionIds | null,
        versionToCopy: VersionIds | null,
        newProjectName: string,
        selectedVersionNumber: number
    }

    interface Props {
        projects: Project[];
    }

    interface Computed {
        currentProject: Project | null,
        previousProjects: Project[],
        error: Error,
        hasError: boolean,
        disableCreate: boolean,
        loading: boolean,
        currentLanguage: Language,
        copyVersionHeader: string
    }

    interface Methods {
        format: (date: string) => void,
        loadVersion: (event: Event, projectId: number, versionId: string) => void,
        loadAction: (version: VersionIds) => void,
        versionCountLabel: (project: Project) => string
        deleteProject: (event: Event, projectId: number) => void,
        deleteVersion: (event: Event, projectId: number, versionId: string) => void
        copyVersion: (event: Event, projectId: number, versionId: string, versionNumber: number) => void
        cancelCopy: () => void
        cancelDelete: () => void
        confirmDelete: () => void,
        confirmCopy: (name: string) => void,
        deleteProjectAction: (projectId: number) => void,
        deleteVersionAction: (versionIds: VersionIds) => void
        copyVersionAction: (versionBundle: versionBundle) => void
        createProject: (name: string) => void,
        getProjects: () => void
    }

    export default Vue.extend<Data, Methods, Computed, Props>({
       props: {
            projects: {
                type: Array
            }
       },
       data() {
           return {
               projectToDelete: null,
               versionToDelete: null,
               versionToCopy: null,
               newProjectName: "",
               selectedVersionNumber: 0
           }
       },
        computed: {
            ...mapStateProps<ProjectsState, keyof Computed>(namespace, {
                currentProject: state => state.currentProject,
                previousProjects: state => state.previousProjects,
                error: state => state.error,
                hasError: state => !!state.error,
                loading: state => state.loading
            }),
            disableCreate: function() {
                return !this.newProjectName;
            },
            copyVersionHeader: function() {
                return i18next.t('copyVersionHeader', {lng: this.currentLanguage}).replace('version', `version v${this.selectedVersionNumber}`)
            },
            currentLanguage: mapStateProp<RootState, Language>(null,
                (state: RootState) => state.language)
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
           copyVersion(event: Event, projectId: number, versionId: string, versionNumber: number) {
               event.preventDefault();
               this.versionToCopy = {projectId, versionId};
               this.selectedVersionNumber = versionNumber
           },
           cancelCopy() {
               this.versionToCopy = null;
               this.newProjectName = "";
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
           async confirmCopy(name) {
               
                if (this.versionToCopy) {
                    const versionBundle: versionBundle = {
                        version: this.versionToCopy!,
                        name: this.newProjectName
                    }
                    this.copyVersionAction(versionBundle);
                    this.versionToCopy = null;
                    this.newProjectName = "";
                }
           },
           copyVersionAction: mapActionByName<versionBundle>(namespace, "copyVersion"),
           createProject: mapActionByName(namespace, "createProject"),
           getProjects: mapActionByName(namespace, "getProjects"),
           versionCountLabel(project: Project) {
               return project.versions.length == 1 ? "1 version" : `${project.versions.length} versions`
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

