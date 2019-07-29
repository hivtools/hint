<template>
    <div>
        <div class="row">
            <div class="col">
                <h1 class="h2 mb-4">Upload baseline data</h1>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <form>
                    <div class="form-group">
                        <label class="font-weight-bold">PJNZ</label>
                        <tick color="#e31837" v-if="country" width="20px"></tick>
                        <div class="custom-file">
                            <input type="file"
                                   class="custom-file-input"
                                   ref="pjnz"
                                   id="pjnz"
                                   v-on:change="handleFileSelect"/>
                            <label for="pjnz" :class="['custom-file-label', {'selected': fileName}]">
                                {{fileName || "Choose PJNZ file" }}
                            </label>
                        </div>
                        <error-alert v-if="hasError" message="Something went wrong"></error-alert>
                    </div>
                </form>
            </div>
            <div class="col">
                <form>
                    <div v-if="country">
                        <div class="form-group row">
                            <label class="col-sm-2 col-form-label">Country:</label>
                            <div class="col-sm-10 col-form-label">
                                {{country}}
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script lang="ts">

    import Vue from "vue";
    import {mapActions, mapState} from "vuex";
    import Tick from "./Tick.vue";
    import ErrorAlert from "./ErrorAlert.vue";
    import { BaselineState } from "../store/baseline/baseline";

    const namespace: string = 'baseline';

    interface Data {
        file: File | null
        fileName: string
    }

    export default Vue.extend({
        name: "Baseline",
        computed: mapState<BaselineState>(namespace, {
            country: state => state.country,
            hasError: state => state.hasError
        }),
        data(): Data {
            return {
                file: null,
                fileName: ""
            }
        },
        methods: {
            ...mapActions({upload: 'baseline/uploadPJNZ'}),
            handleFileSelect(files: FileList | null) {
                if (!files) {
                    const fileInput = this.$refs.pjnz as HTMLInputElement;
                    files = fileInput.files
                }
                this.file = files && files[0];
                this.fileName = this.file && this.file.name.split("\\").pop() || "";
                this.upload(this.file);
            }
        },
        components: {
            Tick,
            ErrorAlert
        }
    })
</script>