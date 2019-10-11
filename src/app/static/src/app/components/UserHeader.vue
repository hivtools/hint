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
                        <a class="dropdown-item" ref="save" v-on:click="save">Save
                            <download-icon size="20" class="icon"></download-icon>
                        </a>
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
    import {mapState} from "vuex";
    import {BaselineState} from "../store/baseline/baseline";
    import {surveyAndProgram, SurveyAndProgramDataState} from "../store/surveyAndProgram/surveyAndProgram";
    import {DownloadIcon, UploadIcon} from "vue-feather-icons";

    interface Data {
        show: boolean
    }

    interface Methods {
        toggle: () => void;
        save: () => void;
        close: () => void;
    }

    export default Vue.extend<Data, Methods, any, "title" | "user">({
        data() {
            return {
                show: false
            }
        },
        props: ["title", "user"],
        computed: {
            ...mapState<BaselineState>("baseline", {
                baselineHashes: state => ({
                    population: state.population && state.population.hash,
                    pjnz: state.pjnz && state.pjnz.hash,
                    shape: state.shape && state.shape.hash
                })
            }),
            ...mapState<SurveyAndProgramDataState>("surveyAndProgram", {
                surveyAndProgramHashes: state => ({
                    survey: state.survey && state.survey.hash,
                    program: state.program && state.program.hash,
                    anc: state.anc && state.anc.hash
                })
            })
        },
        methods: {
            toggle() {
                this.show = !this.show;
            },
            close() {
                this.show = false;
            },
            save() {
                const state = serialiseState(this.$store.state);
                const hashes = {
                    ...this.baselineHashes,
                    ...this.surveyAndProgramHashes
                };
                const file = new Blob([JSON.stringify({
                    state, hashes
                })], {type: "application/json"});
                const a = (this.$refs.save as any);
                a.href = URL.createObjectURL(file);
                a.download = `${this.title}-${new Date().toISOString()}.json`.toLowerCase();
            }
        },
        components: {
            UploadIcon,
            DownloadIcon
        }
    })
</script>