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
                        <div v-if="hasError" class="alert alert-danger">
                            Something went wrong
                        </div>
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
    import {mapState} from "vuex";
    import {store} from "../main";
    import {BaselineState} from "../types";
    import Tick from "./Tick.vue";

    const namespace: string = 'baseline';

    interface Data {
        file: File | null
        fileName: string
    }

    export default Vue.extend({

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
            handleFileSelect() {
                const fileInput = this.$refs.pjnz as HTMLInputElement;
                this.file = fileInput && fileInput.files && fileInput.files[0];
                this.fileName = this.file && this.file.name.split("\\").pop() || "";
                store.dispatch('baseline/uploadPJNZ', this.file);
            }
        },
        components: {
            Tick
        }
    })
</script>