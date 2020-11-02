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
        <div v-for="p in projects" :key="p.id">
            <div :id="`p-${p.id}`" class="row py-2">
                <div class="col-md-1 project-cell">
                    <button
                        v-b-toggle="`versions-${p.id}`"
                        class="btn btn-xs bg-transparent shadow-none py-0">
                        <chevron-right-icon
                            size="20"
                            class="icon when-closed"
                        ></chevron-right-icon>
                        <chevron-down-icon
                            size="20"
                            class="icon when-open"
                        ></chevron-down-icon>
                    </button>
                </div>
                <div class="col-md-2 project-cell">
                    {{ p.name }}
                </div>
                <div class="col-md-1 project-cell">
                    <small class="text-muted">{{ versionCountLabel(p) }}</small>
                </div>
                <div class="col-md-3 project-cell">
                    {{ format(p.versions[0].updated) }}
                </div>
                <div class="col-md-1 project-cell"
                    v-if="renameProjectIsEnabled">
                    <a @click="renameProject($event, p.id)" 
                    href="" 
                    v-translate="'renameProject'"></a>
                </div>
                <div class="col-md-1 project-cell">
                    <a @click="loadVersion($event, p.id, p.versions[0].id)"
                       href=""
                       v-translate="'load'"></a>
                </div>
                <div class="col-md-1 project-cell">
                    <a @click="deleteProject($event, p.id)"
                       href=""
                       v-translate="'delete'"></a>
                </div>
                <div class="col-md-2 project-cell"
                     v-if="promoteProjectIsEnabled">
                    <a @click="promoteVersion(
                                $event,
                                p.id,
                                p.versions[0].id,
                                p.versions[0].versionNumber
                            )"
                       href=""
                       v-translate="'copyLatestToNewProject'"
                    ></a>
                </div>
                <div class="col-md-1 project-cell" v-if="shareProjectIsEnabled">
                    <share-project :project="p"></share-project>
                </div>
            </div>
            <b-collapse :id="`versions-${p.id}`">
                <div v-for="v in p.versions"
                     :id="`v-${v.id}`"
                     :key="v.id"
                     class="row font-italic bg-light py-2">
                    <div class="col-md-3 version-cell"></div>
                    <div class="col-md-1 version-cell">
                        {{ versionLabel(v) }}
                    </div>
                    <div class="col-md-3 version-cell">
                        {{ format(v.updated) }}
                    </div>
                    <div class="col-md-1 version-cell"
                    v-if="renameProjectIsEnabled">
                    </div>
                    <div class="col-md-1 version-cell">
                        <a @click="loadVersion($event, p.id, v.id)"
                           href=""
                           v-translate="'load'"></a>
                    </div>
                    <div class="col-md-1 version-cell">
                        <a @click="deleteVersion($event, p.id, v.id)"
                           href=""
                           v-translate="'delete'"></a>
                    </div>
                    <div class="col-md-2 version-cell"
                         v-if="promoteProjectIsEnabled">
                        <a @click="promoteVersion(
                                    $event,
                                    p.id,
                                    v.id,
                                    v.versionNumber)"
                           href=""
                           v-translate="'copyToNewProject'"></a>
                    </div>
                </div>
            </b-collapse>
        </div>
        <modal :open="projectToDelete || versionToDelete">
            <h4 v-if="projectToDelete" v-translate="'deleteProject'"></h4>
            <h4 v-if="versionToDelete" v-translate="'deleteVersion'"></h4>
            <template v-slot:footer>
                <button
                    type="button"
                    class="btn btn-red"
                    @click="confirmDelete"
                    v-translate="'ok'"></button>
                <button
                    type="button"
                    class="btn btn-white"
                    @click="cancelDelete"
                    v-translate="'cancel'"></button>
            </template>
        </modal>
        <modal :open="versionToPromote">
            <h4 v-html="promoteVersionHeader" id="promoteVersionHeader"></h4>
            <h5 v-translate="'enterProjectName'"></h5>
            <input type="text"
                   class="form-control"
                   v-translate:placeholder="'projectName'"
                   v-model="newProjectName"/>
            <template v-slot:footer>
                <button type="button"
                        class="btn btn-red"
                        :disabled="disableCreate"
                        @click="confirmPromotion(newProjectName)"
                        v-translate="'createProject'"></button>
                <button type="button"
                        class="btn btn-white"
                        @click="cancelPromotion"
                        v-translate="'cancel'"></button>
            </template>
        </modal>
        <modal :open="projectToRename">
            <h4 v-translate="'renameProjectHeader'"></h4>
            <input type="text" 
                   class="form-control"
                   v-translate:placeholder="'projectName'" 
                   v-model="renamedProjectName">
            <template v-slot:footer>
                <button type="button"
                    class="btn btn-red" 
                    :disabled="disableRename"
                    @click="confirmRename(renamedProjectName)"
                    v-translate="'renameProject'">
                </button>
                <button type="button"
                    class="btn btn-white"
                    @click="cancelRename"
                    v-translate="'cancel'">
                </button>
            </template>
        </modal>
    </div>
</template>

<script lang="ts">
    import i18next from "i18next";
    import {Project, Version, VersionIds} from "../../types";
    import {BCollapse, VBToggle} from "bootstrap-vue";
    import {ChevronDownIcon, ChevronRightIcon} from "vue-feather-icons";
    import Modal from "../Modal.vue";
    import {formatDateTime, mapActionByName, mapStateProp, versionLabel,} from "../../utils";
    import {versionPayload, projectPayload} from "../../store/projects/actions";
    import {Language} from "../../store/translations/locales";
    import {RootState} from "../../root";
    import ProjectsMixin from "./ProjectsMixin";
    import ShareProject from "./ShareProject.vue";
    import {switches} from "../../featureSwitches";

    const namespace = "projects";

    interface Data {
        projectToDelete: number | null;
        versionToDelete: VersionIds | null;
        renamedProjectName: string;
        projectToRename: number | null;
        versionToPromote: VersionIds | null;
        newProjectName: string;
        selectedVersionNumber: string;
        shareProjectIsEnabled: boolean;
        promoteProjectIsEnabled: boolean;
        renameProjectIsEnabled: boolean;
    }

    interface Computed {
        disableCreate: boolean;
        disableRename: boolean;
        currentLanguage: Language;
        promoteVersionHeader: string;
    }

    interface Methods {
        format: (date: string) => void;
        loadVersion: (event: Event, projectId: number, versionId: string) => void;
        loadAction: (version: VersionIds) => void;
        versionCountLabel: (project: Project) => string;
        deleteProject: (event: Event, projectId: number) => void;
        deleteVersion: (event: Event, projectId: number, versionId: string) => void;
        promoteVersion: (
            event: Event,
            projectId: number,
            versionId: string,
            versionNumber: number
        ) => void;
        cancelPromotion: () => void;
        cancelDelete: () => void;
        confirmDelete: () => void;
        confirmPromotion: (name: string) => void;
        deleteProjectAction: (projectId: number) => void;
        deleteVersionAction: (versionIds: VersionIds) => void;
        promoteVersionAction: (versionPayload: versionPayload) => void;
        renameProjectAction: (projectPayload: projectPayload) => void;
        createProject: (name: string) => void;
        getProjects: () => void;
        versionLabel: (version: Version) => string;
        renameProject: (event: Event, projectId: number) => void;
        cancelRename: () => void;
        confirmRename: (name: string) => void;
    }

    export default ProjectsMixin.extend<Data, Methods, Computed, unknown>({
        data() {
            return {
                projectToDelete: null,
                versionToDelete: null,
                versionToPromote: null,
                newProjectName: "",
                selectedVersionNumber: "",
                shareProjectIsEnabled: switches.shareProject,
                promoteProjectIsEnabled: switches.promoteProject,
                renameProjectIsEnabled: switches.renameProject,
                projectToRename: null,
                renamedProjectName: ''
            };
        },
        computed: {
            disableCreate: function () {
                return !this.newProjectName;
            },
            disableRename: function () {
                return !this.renamedProjectName;
            },
            promoteVersionHeader: function () {
                return i18next.t("promoteVersionHeader", {
                    version: this.selectedVersionNumber,
                    lng: this.currentLanguage,
                });
            },
            currentLanguage: mapStateProp<RootState, Language>(
                null,
                (state: RootState) => state.language
            ),
        },
        methods: {
            format(date: string) {
                return formatDateTime(date);
            },
            loadVersion(event: Event, projectId: number, versionId: string) {
                event.preventDefault();
                this.loadAction({projectId, versionId});
            },
            renameProject(event: Event, projectId: number) {
               event.preventDefault();
               this.projectToRename = projectId;
            },
            cancelRename() {
               this.projectToRename = null;
               this.renamedProjectName = '';
            },
            async confirmRename(name) {
                if (this.projectToRename) {
                    const projectPayload: projectPayload = {
                        projectId: this.projectToRename!,
                        name: this.renamedProjectName
                    };
                    this.renameProjectAction(projectPayload);
                    this.versionToPromote = null;
                    this.newProjectName = "";
                }
            },
            deleteProject(event: Event, projectId: number) {
                event.preventDefault();
                this.projectToDelete = projectId;
            },
            deleteVersion(event: Event, projectId: number, versionId: string) {
                event.preventDefault();
                this.versionToDelete = {projectId, versionId};
            },
            promoteVersion(
                event: Event,
                projectId: number,
                versionId: string,
                versionNumber: number
            ) {
                event.preventDefault();
                this.versionToPromote = {projectId, versionId};
                this.selectedVersionNumber = `v${versionNumber}`;
            },
            cancelPromotion() {
                this.versionToPromote = null;
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
            async confirmPromotion(name) {
                if (this.versionToPromote) {
                    const versionPayload: versionPayload = {
                        version: this.versionToPromote!,
                        name: this.newProjectName,
                    };
                    this.promoteVersionAction(versionPayload);
                    this.versionToPromote = null;
                    this.newProjectName = "";
                }
            },
            renameProjectAction: mapActionByName<projectPayload>(
                namespace,
                "renameProject"
            ),
            promoteVersionAction: mapActionByName<versionPayload>(
                namespace,
                "promoteVersion"
            ),
            createProject: mapActionByName(namespace, "createProject"),
            getProjects: mapActionByName(namespace, "getProjects"),
            versionCountLabel(project: Project) {
                return project.versions.length == 1
                    ? "1 version"
                    : `${project.versions.length} versions`;
            },
            versionLabel(version: Version) {
                return versionLabel(version);
            },
            loadAction: mapActionByName<VersionIds>(namespace, "loadVersion"),
            deleteProjectAction: mapActionByName<number>(
                namespace,
                "deleteProject"
            ),
            deleteVersionAction: mapActionByName<VersionIds>(
                namespace,
                "deleteVersion"
            ),
        },
        components: {
            BCollapse,
            ChevronDownIcon,
            ChevronRightIcon,
            Modal,
            ShareProject,
        },
        directives: {
            "b-toggle": VBToggle,
        },
    });
</script>

