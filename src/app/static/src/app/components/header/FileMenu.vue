<template>
    <div style="flex:auto">
        <drop-down text="file">
            <a class="dropdown-item" href="#"
               @mousedown="handleLoadZip">
                <span v-translate="'loadZip'"></span>
                <upload-icon size="20" class="icon"></upload-icon>
            </a>
            <input id="upload-zip" v-translate:aria-label="'selectFile'"
                   type="file"
                   style="display: none;" ref="loadZip"
                   @change="loadZip" accept=".zip">

            <span v-if="loadJsonFeatureSwitch">
                <a class="dropdown-item" tabindex="0" v-on:mousedown="save">
                    <span><span class="pr-1" v-translate="'save'"></span>JSON</span>
                    <download-icon size="20" class="icon"></download-icon>
                </a>
                <a style="display:none" ref="save"></a>
                <a class="dropdown-item" ref="load" href="#" v-on:mousedown="handleLoadJson">
                    <span><span class="pr-1" v-translate="'load'"></span>JSON</span>
                    <upload-icon size="20" class="icon"></upload-icon>
                </a>
                <input id="upload-file" v-translate:aria-label="'selectFile'"
                       type="file"
                       style="display: none;" ref="loadJson" v-on:change="loadJson" accept=".json">
            </span>
        </drop-down>

        <div id="project-zip">
            <upload-new-project :open-modal="projectNameZip"
                                :submit-load="handleLoadZip"
                                :cancel-load="cancelLoadZip"/>
        </div>

        <div id="project-json">
            <upload-new-project :open-modal="projectNameJson"
                                :submit-load="handleLoadJson"
                                :cancel-load="cancelLoadJson"/>
        </div>

    </div>
</template>
<script lang="ts">
    import {defineComponentVue2WithProps} from "../../defineComponentVue2/defineComponentVue2"
    import {serialiseState} from "../../localStorageManager";
    import {BaselineState} from "../../store/baseline/baseline";
    import {SurveyAndProgramState} from "../../store/surveyAndProgram/surveyAndProgram";
    import {DownloadIcon, UploadIcon} from "vue-feather";
    import {LocalSessionFile} from "../../types";
    import {addCheckSum, getFormData, mapActionByName, mapStateProp} from "../../utils";
    import {ValidateInputResponse} from "../../generated";
    import DropDown from "./DropDown.vue";
    import {mapGetterByName} from "../../utils";
    import UploadNewProject from "../load/UploadNewProject.vue";
    import {switches} from "../../featureSwitches"

    interface Data {
        projectNameJson: boolean,
        projectNameZip: boolean,
        fileToLoad: File | null
        loadJsonFeatureSwitch: boolean
    }

    interface Methods {
        save: (e: Event) => void;
        loadJson: () => void;
        loadZip: () => void;
        loadAction: (file: File) => void;
        preparingRehydrate: (file: FormData) => void
        cancelLoadZip: () => void;
        cancelLoadJson: () => void;
        handleLoadJson: () => void
        handleLoadZip: () => void
        clearLoadJsonInput: () => void,
        clearLoadZipInput: () => void
    }

    interface Computed {
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

    interface Props {
        title: string
    }

    const localSessionFile = function (file: ValidateInputResponse | null) {
        return file ? {hash: file.hash, filename: file.filename} : null
    };

    export default defineComponentVue2WithProps<Data, Methods, Computed, Props>({
        props: {
            title: {
                type: String,
                required: true
            }
        },
        mounted() {
            const handleLoadJson = () => {
                (this.$refs.loadJson as any).click()
            };
            return {
                handleLoadJson
            }
        },
        data() {
            return {
                projectNameJson: false,
                projectNameZip: false,
                fileToLoad: null,
                loadJsonFeatureSwitch: switches.loadJson
            }
        },
        computed: {
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
            preparingRehydrate: mapActionByName("load","preparingRehydrate"),
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
            loadJson() {
                const input = this.$refs.loadJson as HTMLInputElement;
                if (input.files && input.files.length > 0) {
                    const file = input.files[0];
                    this.clearLoadJsonInput()
                    if (this.isGuest) {
                        this.loadAction(file);
                    } else {
                        this.fileToLoad = file;
                        this.projectNameJson = true;
                    }
                }
            },
            loadZip() {
                const input = this.$refs.loadZip as HTMLInputElement;
                if (input.files && input.files.length > 0) {
                    const file = input.files[0];
                    this.clearLoadZipInput();
                    if (this.isGuest) {
                        this.preparingRehydrate(getFormData(file));
                    } else {
                        this.fileToLoad = file;
                        this.projectNameZip = true;
                    }
                }
            },
            clearLoadZipInput() {
                // clearing value because browser does not
                // allow selection of the same file twice
                const input = this.$refs.loadZip as HTMLInputElement
                input.value = ""
            },
            clearLoadJsonInput() {
                const input = this.$refs.loadJson as HTMLInputElement
                input.value = ""
            },
            handleLoadJson() {
                this.projectNameJson = false;
                if (this.fileToLoad) {
                    this.loadAction(this.fileToLoad)
                }
            },
            handleLoadZip() {
                this.projectNameZip = false;
                if (this.fileToLoad) {
                    this.preparingRehydrate(getFormData(this.fileToLoad));
                }
            },
            cancelLoadJson() {
                this.projectNameJson = false;
                this.clearLoadJsonInput();
            },
            cancelLoadZip() {
                this.projectNameZip = false;
                this.clearLoadZipInput();
            }
        },
        components: {
            UploadIcon,
            DownloadIcon,
            DropDown,
            UploadNewProject
        }
    })
</script>
