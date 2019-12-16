<template>
    <div style="flex:auto">
        <drop-down text="File">
            <a class="dropdown-item" v-on:mousedown="save">
                <span v-translate="'save'"></span>
                <download-icon size="20" class="icon"></download-icon>
            </a>
            <a style="display:none" ref="save"></a>
            <a class="dropdown-item" ref="load" href="#" v-on:mousedown="$refs.loadFile.click()">
                <span v-translate="'load'"></span>
                <upload-icon size="20" class="icon"></upload-icon>
            </a>
            <input type="file" style="display: none;" ref="loadFile" v-on:change="load" accept=".json">
        </drop-down>
        <modal :open="hasError">
            <h4 v-translate="'loadError'"></h4>
            <p>{{loadError}}</p>
            <template v-slot:footer>
                <button type="button"
                        class="btn btn-red"
                        data-dismiss="modal"
                        aria-label="Close"
                        @click="clearLoadError" v-translate="'ok'">
                </button>
            </template>
        </modal>
    </div>
</template>
<script lang="ts">

    import Vue from "vue";
    import {serialiseState} from "../../localStorageManager";
    import {BaselineState} from "../../store/baseline/baseline";
    import {LoadingState, LoadState} from "../../store/load/load";
    import {SurveyAndProgramDataState} from "../../store/surveyAndProgram/surveyAndProgram";
    import {DownloadIcon, UploadIcon} from "vue-feather-icons";
    import {LocalSessionFile} from "../../types";
    import {addCheckSum, mapActionByName, mapStateProp, mapStateProps} from "../../utils";
    import {ValidateInputResponse} from "../../generated";
    import Modal from "../Modal.vue"
    import DropDown from "./DropDown.vue";

    interface Methods {
        save: (e: Event) => void;
        load: () => void;
        loadAction: (file: File) => void;
        clearLoadError: () => void
    }

    interface LoadComputed {
        loadError: string
        hasError: boolean
    }

    interface Computed extends LoadComputed {
        baselineFiles: BaselineFiles
        surveyAndProgramFiles: SurveyAndProgramFiles
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

    export default Vue.extend<{}, Methods, Computed, "title">({
        props: ["title"],
        computed: {
            ...mapStateProps<LoadState, keyof LoadComputed>("load", {
                hasError: state => state.loadingState == LoadingState.LoadFailed,
                loadError: state => state.loadError && state.loadError.detail
            }),
            baselineFiles: mapStateProp<BaselineState, BaselineFiles>("baseline", state => {
                return {
                    pjnz: localSessionFile(state.pjnz),
                    population: localSessionFile(state.population),
                    shape: localSessionFile(state.shape)
                }
            }),
            surveyAndProgramFiles: mapStateProp<SurveyAndProgramDataState, SurveyAndProgramFiles>("surveyAndProgram", state => {
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
                    this.loadAction(file);
                }
            }
        },
        components: {
            UploadIcon,
            DownloadIcon,
            Modal,
            DropDown
        }
    })
</script>