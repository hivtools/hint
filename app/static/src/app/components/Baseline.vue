<template>
    <div>
        <div class="row">
            <div class="col">
                <h1 class="h2 mb-4">Upload baseline data</h1>
            </div>
        </div>
        <div class="row">
            <div class="col-sm-10 col-md-8">
                <form>
                    <div class="form-group">
                        <label class="font-weight-bold">PJNZ</label>
                        <tick color="#e31837" v-if="country" width="20px"></tick>
                        <div class="custom-file">
                            <input type="file"
                                   class="custom-file-input"
                                   ref="pjnz"
                                   id="pjnz"
                                   accept="PJNZ,pjnz,.pjnz,.PJNZ"
                                   v-on:change="handleFileSelect"/>
                            <label for="pjnz" :class="['custom-file-label', {'selected': newFileName || pjnzFileName}]">
                                {{newFileName || pjnzFileName || "Choose PJNZ file" }}
                            </label>
                        </div>
                        <error-alert v-if="hasError" :message="error"></error-alert>
                    </div>
                </form>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <span v-if="country"><strong>Country</strong>: {{country}}</span>
            </div>
        </div>
    </div>
</template>

<script lang="ts">

    import Vue from "vue";
    import {mapActions, mapState} from "vuex";
    import Tick from "./Tick.vue";
    import ErrorAlert from "./ErrorAlert.vue";
    import {BaselineState} from "../store/baseline/baseline";

    const namespace: string = 'baseline';

    interface Data {
        newFile: File | null
        newFileName: string
    }

    export default Vue.extend({
        name: "Baseline",
        computed: mapState<BaselineState>(namespace, {
            country: state => state.country,
            hasError: state => state.pjnzError.length > 0,
            error: state => state.pjnzError,
            pjnzFileName: state => state.pjnzFilename
        }),
        data(): Data {
            return {
                newFile: null,
                newFileName: ""
            }
        },
        methods: {
            ...mapActions({upload: 'baseline/uploadPJNZ'}),
            handleFileSelect(_: Event, files: FileList | null) {
                if (!files) {
                    const fileInput = this.$refs.pjnz as HTMLInputElement;
                    files = fileInput.files
                }
                this.newFile = files && files[0];
                this.newFileName = this.newFile && this.newFile.name.split("\\").pop() || "";

                if (this.newFile) {
                    this.upload(this.newFile);
                }
            }
        },
        components: {
            Tick,
            ErrorAlert
        }
    })
</script>