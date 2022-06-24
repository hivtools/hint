<template>
    <div style="flex:auto">
        <drop-down text="file">
            <a class="dropdown-item" ref="loadModel" href="#" v-on:mousedown="$refs.loadModel.click()">
                <span v-translate="'loadModel'"></span>
                <upload-icon size="20" class="icon"></upload-icon>
            </a>
            <input v-translate:aria-label="'selectFile'"
                   type="file"
                   style="display: none;" ref="loadModel" v-on:change="loadModel" accept=".zip">

            <a class="dropdown-item" v-on:mousedown="save">
                <span><span class="pr-1" v-translate="'save'"></span>JSON</span>
                <download-icon size="20" class="icon"></download-icon>
            </a>
            <a style="display:none" ref="save"></a>
            <a class="dropdown-item" ref="load" href="#" v-on:mousedown="$refs.loadFile.click()">
                <span><span class="pr-1" v-translate="'load'"></span>JSON</span>
                <upload-icon size="20" class="icon"></upload-icon>
            </a>
            <input v-translate:aria-label="'selectFile'"
                   type="file"
                   style="display: none;" ref="loadFile" v-on:change="load" accept=".json">
        </drop-down>
        <load-error-modal :has-error="hasError"
                          :load-error="loadError"
                          :clear-load-error="clearLoadError"/>

        <new-project-modal :header-text="'loadFileToProjectHeader'"
                           :label-text="'enterProjectName'"
                           :open-modal="requestProjectName"
                           :input-value="newProjectName"
                           :submit-load="loadToNewProject"
                           :cancel-load="cancelLoad"/>
    </div>
</template>
<script lang="ts">

    import Vue from "vue";
    import {serialiseState} from "../../localStorageManager";
    import {BaselineState} from "../../store/baseline/baseline";
    import {FileSource, LoadingState, LoadState} from "../../store/load/load";
    import {SurveyAndProgramState} from "../../store/surveyAndProgram/surveyAndProgram";
    import {DownloadIcon, UploadIcon} from "vue-feather-icons";
    import {LocalSessionFile} from "../../types";
    import {addCheckSum, mapActionByName, mapStateProp, mapStateProps} from "../../utils";
    import {ValidateInputResponse} from "../../generated";
    import DropDown from "./DropDown.vue";
    import {mapGetterByName} from "../../utils";
    import {loadPayload} from "../../store/load/actions";
    import NewProjectModal from "../load/NewProjectModal.vue";
    import LoadErrorModal from "../load/LoadErrorModal.vue";

    interface Data {
        requestProjectName: boolean,
        newProjectName: string | null,
        fileToLoad: File | null
    }

    interface Methods {
        save: (e: Event) => void;
        load: () => void;
        loadModel: () => void;
        loadAction: (payload: loadPayload) => void;
        loadToNewProject: () => void,
        clearLoadError: () => void,
        cancelLoad: () => void
    }

    interface LoadComputed {
        loadError: string
        hasError: boolean
    }

    interface Computed extends LoadComputed {
        baselineFiles: BaselineFiles
        surveyAndProgramFiles: SurveyAndProgramFiles,
        isGuest: boolean
    }

    interface BaselineFiles {
        pjnz: LocalSessionFile | null,
        population: LocalSessionFile | null,
        shape: LocalSessionFile | null
    }

    interface SurveyAndProgramFiles {
        survey: LocalSessionFile | null,
        programme: LocalSessionFile | null,
        anc: LocalSessionFile | null
    }

    const localSessionFile = function (file: ValidateInputResponse | null) {
        return file ? {hash: file.hash, filename: file.filename} : null
    };

    export default Vue.extend<Data, Methods, Computed, "title">({
        props: ["title"],
        data(): Data {
            return {
                requestProjectName: false,
                newProjectName: null,
                fileToLoad: null
            }
        },
        computed: {
            ...mapStateProps<LoadState, keyof LoadComputed>("load", {
                hasError: state => state.loadingState == LoadingState.LoadFailed,
                loadError: state => state.loadError && state.loadError.detail
            }),
            isGuest: mapGetterByName(null, "isGuest"),
            baselineFiles: mapStateProp<BaselineState, BaselineFiles>("baseline", state => {
                return {
                    pjnz: localSessionFile(state.pjnz),
                    population: localSessionFile(state.population),
                    shape: localSessionFile(state.shape)
                }
            }),
            surveyAndProgramFiles: mapStateProp<SurveyAndProgramState, SurveyAndProgramFiles>("surveyAndProgram", state => {
                return {
                    survey: localSessionFile(state.survey),
                    programme: localSessionFile(state.program),
                    anc: localSessionFile(state.anc)
                }
            })
        },
        methods: {
            loadAction: mapActionByName<File>("load", "load"),
            clearLoadError: mapActionByName("load", "clearLoadState"),
            save(e: Event) {
                e.preventDefault();
                const state = serialiseState(this.$store.state);
                const files = {
                    ...this.baselineFiles,
                    ...this.surveyAndProgramFiles
                };
                const data = JSON.stringify({state, files});
                const content = addCheckSum(data);

                const file = new Blob([content], {type: "text/json"});
                const a = (this.$refs.save as any);
                a.href = URL.createObjectURL(file);
                a.download = `${this.title}-${new Date().toISOString()}.json`.toLowerCase();
                a.click();
            },
            load() {
                const input = this.$refs.loadFile as HTMLInputElement;
                if (input.files && input.files.length > 0) {
                    const file = input.files[0];
                    if (this.isGuest) {
                        this.loadAction({file, projectName: null});
                    } else {
                        this.fileToLoad = file;
                        this.requestProjectName = true;
                    }
                }
            },
            loadModel() {
                const input = this.$refs.loadModel as HTMLInputElement;
                if (input.files && input.files.length > 0) {
                    const file = input.files[0];
                    if (this.isGuest) {
                        this.loadAction({file, projectName: null});
                    } else {
                        this.fileToLoad = file;
                        this.requestProjectName = true;
                    }
                }
            },
            loadToNewProject() {
                this.requestProjectName = false;
                const ext = this.fileToLoad?.name.split(".")[1]
                if (ext === "zip") {
                    this.loadAction({
                        file: this.fileToLoad!,
                        projectName: this.newProjectName,
                        source: FileSource.ModelOutput
                    });
                }

                if (ext === "json") {
                    this.loadAction({
                        file: this.fileToLoad!,
                        projectName: this.newProjectName
                    });
                }
            },
            cancelLoad() {
                this.requestProjectName = false;
            }
        },
        components: {
            UploadIcon,
            DownloadIcon,
            DropDown,
            NewProjectModal,
            LoadErrorModal
        }
    })
</script>
