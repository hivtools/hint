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
            <div :id="`p-${p.id}`" class="row py-2">
                <div class="col-md-1 project-cell">
                    <button v-b-toggle="`versions-${p.id}`" class="btn btn-xs bg-transparent shadow-none py-0">
                        <chevron-right-icon size="20" class="icon when-closed"></chevron-right-icon>
                        <chevron-down-icon size="20" class="icon when-open"></chevron-down-icon>
                    </button>
                </div>
                <div class="col-md-2 project-cell">
                    {{ p.name }}
                </div>
                <div class="col-md-1 project-cell"><small class="text-muted">{{ versionCountLabel(p) }}</small></div>
                <div class="col-md-3 project-cell">{{ format(p.versions[0].updated) }}</div>
                <div class="col-md-1 project-cell">
                    <a @click="loadVersion($event, p.id, p.versions[0].id)" href="" v-translate="'load'"></a>
                </div>
                <div class="col-md-1 project-cell">
                    <a @click="deleteProject($event, p.id)" href="" v-translate="'delete'"></a>
                </div>
                <div class="col-md-2 project-cell">
                    <a @click="copyProject($event, p.id)" href="" v-translate="'copyToNewProject'"></a>
                </div>
                <div class="col-md-1 project-cell">
                    <share-project :project="p"></share-project>
                </div>
            </div>
            <b-collapse :id="`versions-${p.id}`">
                <div v-for="v in p.versions" :id="`v-${v.id}`" class="row font-italic bg-light py-2">
                    <div class="col-md-3 version-cell"></div>
                    <div class="col-md-1 version-cell">{{versionLabel(v)}}</div>
                    <div class="col-md-3 version-cell">{{format(v.updated)}}</div>
                    <div class="col-md-1 version-cell">
                        <a @click="loadVersion($event, p.id, v.id)" href="" v-translate="'load'"></a>
                    </div>
                    <div class="col-md-1 version-cell">
                        <a @click="deleteVersion($event, p.id, v.id)" href="" v-translate="'delete'"></a>
                    </div>
                    <div class="col-md-2 version-cell">
                        <a @click="copyVersion($event, p.id, v.id)" href="" v-translate="'copyToNewProject'"></a>
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
        <modal :open="projectToCopy || versionToCopy">
            <h4 v-if="projectToCopy" v-translate="'copyProjectHeader'"></h4>
            <h4 v-if="versionToCopy" v-translate="'copyVersionHeader'"></h4>
            <h5 v-translate="'enterProjectName'"></h5>
            <input type="text" class="form-control" v-translate:placeholder="'projectName'"
                   v-model="copiedProjectName">
            <template v-slot:footer>
                <button type="button"
                        class="btn btn-red"
                        v-translate="'createProject'">
                </button>
                <button type="button"
                        class="btn btn-white"
                        @click="cancelCopy"
                        v-translate="'cancel'">
                </button>
            </template>
        </modal>
    </div>
</template>

<script lang="ts">
    import {Project, Version, VersionIds} from "../../types";
    import {BCollapse, VBToggle} from "bootstrap-vue";
    import {ChevronDownIcon, ChevronRightIcon} from "vue-feather-icons";
    import Modal from "../Modal.vue"
    import {formatDateTime, mapActionByName, versionLabel} from "../../utils";
    import ProjectsMixin from "./ProjectsMixin";
    import ShareProject from "./ShareProject.vue";

    interface Data {
        projectToDelete: number | null,
        versionToDelete: VersionIds | null,
        copiedProjectName: string,
        projectToCopy: number | null,
        versionToCopy: VersionIds | null
    }

    interface Methods {
        format: (date: string) => void,
        loadVersion: (event: Event, projectId: number, versionId: string) => void,
        loadAction: (version: VersionIds) => void,
        versionCountLabel: (project: Project) => string
        deleteProject: (event: Event, projectId: number) => void,
        deleteVersion: (event: Event, projectId: number, versionId: string) => void
        copyProject: (event: Event, projectId: number) => void,
        copyVersion: (event: Event, projectId: number, versionId: string) => void
        cancelCopy: () => void
        cancelDelete: () => void
        confirmDelete: () => void,
        deleteProjectAction: (projectId: number) => void,
        deleteVersionAction: (versionIds: VersionIds) => void
        versionLabel: (version: Version) => string
    }

    export default ProjectsMixin.extend<Data, Methods, {}, {}>({
        data() {
            return {
                projectToDelete: null,
                versionToDelete: null,
                copiedProjectName: '',
                projectToCopy: null,
                versionToCopy: null
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
            copyProject(event: Event, projectId: number) {
                event.preventDefault();
                this.projectToCopy = projectId;
            },
            copyVersion(event: Event, projectId: number, versionId: string) {
                event.preventDefault();
                this.versionToCopy = {projectId, versionId};
            },
            cancelCopy() {
                this.versionToCopy = null;
                this.projectToCopy = null;
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
            versionCountLabel(project: Project) {
                return project.versions.length == 1 ? "1 version" : `${project.versions.length} versions`
            },
            versionLabel(version: Version) {
                return versionLabel(version)
            },
            loadAction: mapActionByName<VersionIds>("projects", "loadVersion"),
            deleteProjectAction: mapActionByName<number>("projects", "deleteProject"),
            deleteVersionAction: mapActionByName<VersionIds>("projects", "deleteVersion")
        },
        components: {
            BCollapse,
            ChevronDownIcon,
            ChevronRightIcon,
            Modal,
            ShareProject
        },
        directives: {
            'b-toggle': VBToggle
        }
    });
</script>

