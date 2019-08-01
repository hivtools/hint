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
                    <file-upload label="PJNZ"
                                 :valid="!!country"
                                 :error="error"
                                 :upload="upload"
                                 :existingFileName="pjnzFileName"
                                 accept="PJNZ,pjnz,.pjnz,.PJNZ"
                                 name="pjnz">
                    </file-upload>
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

    import {BaselineState} from "../../store/baseline/baseline";
    import FileUpload from "../FileUpload.vue";

    const namespace: string = 'baseline';

    export default Vue.extend({
        name: "Baseline",
        computed: mapState<BaselineState>(namespace, {
            country: state => state.country,
            error: state => state.pjnzError,
            pjnzFileName: state => state.pjnzFilename
        }),
        methods: {
            ...mapActions({upload: 'baseline/uploadPJNZ'})
        },
        components: {
            FileUpload
        }
    })
</script>