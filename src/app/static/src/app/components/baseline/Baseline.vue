<template>
    <div>
        <div class="row">
            <div class="col">
                <h1 class="h2 mb-4">Upload baseline data</h1>
            </div>
        </div>
        <div class="row">
            <div class="col-sm-3">
                <form>
                    <file-upload label="PJNZ"
                                 :valid="!!country"
                                 :error="pjnzError"
                                 :upload="uploadPJNZ"
                                 :existingFileName="pjnzFileName"
                                 accept="PJNZ,pjnz,.pjnz,.PJNZ"
                                 name="pjnz">
                    </file-upload>
                    <file-upload label="Shape file"
                                 :valid="validShape"
                                 :error="shapeError"
                                 :upload="uploadShape"
                                 :existingFileName="shapeFileName"
                                 accept="zip, .zip"
                                 name="shape">
                    </file-upload>
                </form>
            </div>
            <div class="col">
                <span v-if="country"><strong>Country</strong>: {{country}}</span>
            </div>
        </div>
    </div>
</template>

<script lang="ts">

    import Vue from "vue";
    import {mapActions, mapState} from "vuex";

    import {BaselineState} from "../../store/baseline/baseline";
    import FileUpload from "../FileUpload.vue";

    const namespace: string = 'baseline';

    export default Vue.extend({
        name: "Baseline",
        computed: mapState<BaselineState>(namespace, {
            country: state => state.country,
            pjnzError: state => state.pjnzError,
            pjnzFileName: state => state.pjnzFilename,
            validShape: state => state.shape != null,
            shapeFileName: state => state.shape && state.shape.filename,
            shapeError: state => state.shapeError
        }),
        methods: {
            ...mapActions({
                uploadPJNZ: 'baseline/uploadPJNZ',
                uploadShape: 'baseline/uploadPJNZ'
            })
        },
        components: {
            FileUpload
        }
    })
</script>