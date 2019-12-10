<template>
    <header class="mb-5">
        <nav class="navbar navbar-dark bg-secondary">
            <div class="container-fluid">
                <div class="navbar-header">
                    {{title}}
                </div>
                <div class="dropdown">
                    <a href="#"
                       class="dropdown-toggle"
                       v-on:click="toggle"
                       v-on:blur="close">
                        File
                    </a>
                    <div class="dropdown-menu" :class="show && 'show'">
                        <a class="dropdown-item" v-on:mousedown="save">Save
                            <download-icon size="20" class="icon"></download-icon>
                        </a>
                        <a style="display:none" ref="save"></a>
                        <a class="dropdown-item" ref="load" href="#" v-on:mousedown="$refs.loadFile.click()">Load
                            <upload-icon size="20" class="icon"></upload-icon>
                        </a>
                        <input type="file" style="display: none;" ref="loadFile" v-on:change="load" accept=".json">
                    </div>
                </div>
                <a href="https://forms.gle/QxCT1b4ScLqKPg6a7" target="_blank" class="pr-2 mr-2 border-right">Report a bug</a>
                <a href="/logout">Logout</a>
            </div>
        </nav>
        <modal :open="hasError">
            <h4>Load Error</h4>
            <p>Failed to load state.</p>
            <p>{{loadError}}</p>
            <template v-slot:footer>
                <button type="button"
                        class="btn btn-red"
                        data-dismiss="modal"
                        aria-label="Close"
                        @click="clearLoadError">
                    OK
                </button>
            </template>
        </modal>
    </header>
</template>
<script lang="ts">

    import Vue from "vue";
    import {serialiseState} from "../localStorageManager";
    import {BaselineState} from "../store/baseline/baseline";
    import {LoadState, LoadingState} from "../store/load/load";
    import {surveyAndProgram, SurveyAndProgramDataState} from "../store/surveyAndProgram/surveyAndProgram";
    import {DownloadIcon, UploadIcon} from "vue-feather-icons";
    import {LocalSessionFile} from "../types";
    import {mapActionByName, mapStateProp, mapStateProps, addCheckSum} from "../utils";
    import {ValidateInputResponse} from "../generated";
    import Modal from "./Modal.vue"

    interface Data {
        show: boolean
    }

    interface Methods {
        toggle: () => void;
        save: (e: Event) => void;
        load: () => void;
        loadAction: (file: File) => void;
        close: () => void;
        clearLoadError: () => void
    }

    interface LoadComputed {
        loadError: string
        hasError: boolean
    }

    interface Computed extends LoadComputed{
        baselineFiles: BaselineFiles
        surveyAndProgramFiles: SurveyAndProgramFiles
    }

    interface Props {
        title: string,
        user: string
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

    export default Vue.extend<Data, Methods, Computed, Props>({
        data(): Data {
            return {
                show: false
            }
        },
        props: {
            title: String,
            user: String
        },
        computed: {
            ...mapStateProps<LoadState, keyof LoadComputed>("load", {
                hasError: state => state.loadingState==LoadingState.LoadFailed,
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
            loadAction:
                    mapActionByName<File>("load", "load"),
            clearLoadError:
                    mapActionByName("load", "clearLoadState"),
            toggle() {
                this.show = !this.show;
            },
            close() {
                this.show = false;
            },
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
            load(){
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
            Modal
        }
    })
</script>