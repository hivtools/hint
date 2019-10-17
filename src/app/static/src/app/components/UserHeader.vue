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
                        <a class="dropdown-item" ref="load" href="#">Load
                            <upload-icon size="20" class="icon"></upload-icon>
                        </a>
                    </div>
                </div>
                <a href="/logout">Logout</a>
            </div>
        </nav>
    </header>
</template>
<script lang="ts">

    import Vue from "vue";
    import {serialiseState} from "../localStorageManager";
    import {BaselineState} from "../store/baseline/baseline";
    import {surveyAndProgram, SurveyAndProgramDataState} from "../store/surveyAndProgram/surveyAndProgram";
    import {DownloadIcon, UploadIcon} from "vue-feather-icons";
    import {LocalSessionFile} from "../types";
    import {makeDownloadableContent, mapStateProp} from "../utils";
    import {ValidateInputResponse} from "../generated";

    interface Data {
        show: boolean
    }

    interface Methods {
        toggle: () => void;
        save: (e: Event) => void;
        close: () => void;
    }

    interface Computed {
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
        program: LocalSessionFile | null,
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
                    program: localSessionFile(state.program),
                    anc: localSessionFile(state.anc)
                }
            })
        },
        methods: {
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
                const content = makeDownloadableContent(data);

                const file = new Blob([content], {type: "text/json"});
                const a = (this.$refs.save as any);
                a.href = URL.createObjectURL(file);
                a.download = `${this.title}-${new Date().toISOString()}.json`.toLowerCase();
                a.click();
            }
        },
        components: {
            UploadIcon,
            DownloadIcon
        }
    })
</script>