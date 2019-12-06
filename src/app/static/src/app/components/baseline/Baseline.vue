<template>
    <div>
        <div class="row">
            <div class="col-sm-6 col-md-8">
                <form>
                    <file-upload label="PJNZ"
                                 :valid="pjnz.valid"
                                 :error="pjnz.error || plottingMetadataError"
                                 :upload="uploadPJNZ"
                                 :delete-file="deletePJNZ"
                                 :existingFileName="pjnz.existingFileName"
                                 accept="PJNZ,pjnz,.pjnz,.PJNZ,.zip,zip,ZIP,.ZIP"
                                 name="pjnz">
                        <label v-if="country">
                            <strong>
                                <translated value="country"></translated>
                            </strong>: {{country}}
                        </label>
                    </file-upload>
                    <file-upload label="Shape file"
                                 :valid="shape.valid"
                                 :error="shape.error"
                                 :upload="uploadShape"
                                 :delete-file="deleteShape"
                                 :existingFileName="shape.existingFileName"
                                 accept="geojson,.geojson,GEOJSON,.GEOJSON"
                                 name="shape">
                    </file-upload>
                    <file-upload label="Population"
                                 :valid="population.valid"
                                 :error="population.error"
                                 :upload="uploadPopulation"
                                 :delete-file="deletePopulation"
                                 :existingFileName="population.existingFileName"
                                 accept="csv,.csv"
                                 name="population">
                    </file-upload>
                </form>
                <div v-if="validating" id="baseline-validating">
                    <loading-spinner size="xs"></loading-spinner>
                    Validating...
                </div>
                <error-alert v-if="hasBaselineError" :error="baselineError"></error-alert>
            </div>
        </div>
    </div>
</template>

<script lang="ts">

    import Vue from "vue";
    import {mapActions, mapState} from "vuex";

    import {BaselineState} from "../../store/baseline/baseline";
    import FileUpload from "../FileUpload.vue";
    import {PartialFileUploadProps} from "../../types";
    import {MetadataState} from "../../store/metadata/metadata";
    import ErrorAlert from "../ErrorAlert.vue";
    import LoadingSpinner from "../LoadingSpinner.vue";
    import Translated from "../Translated.vue";

    const namespace: string = 'baseline';

    export default Vue.extend({
        name: "Baseline",
        computed: {
            ...mapState<BaselineState>(namespace, {
                country: state => state.country,
                pjnz: state => ({
                    valid: !!state.country,
                    error: state.pjnzError,
                    existingFileName: state.pjnz && state.pjnz.filename
                } as PartialFileUploadProps),
                shape: state => ({
                    valid: state.shape != null,
                    error: state.shapeError,
                    existingFileName: state.shape && state.shape.filename
                } as PartialFileUploadProps),
                population: state => ({
                    valid: state.population != null,
                    error: state.populationError,
                    existingFileName: state.population && state.population.filename
                } as PartialFileUploadProps),
                hasBaselineError: state => !!state.baselineError,
                baselineError: state => state.baselineError,
                validating: state => state.validating
            }),
            ...mapState<MetadataState>("metadata", {
                plottingMetadataError: state => state.plottingMetadataError
            })
        },
        methods: {
            ...mapActions({
                uploadPJNZ: 'baseline/uploadPJNZ',
                uploadShape: 'baseline/uploadShape',
                uploadPopulation: 'baseline/uploadPopulation',
                deletePJNZ: 'baseline/deletePJNZ',
                deleteShape: 'baseline/deleteShape',
                deletePopulation: 'baseline/deletePopulation'
            })
        },
        components: {
            FileUpload,
            ErrorAlert,
            LoadingSpinner,
            Translated
        }
    })
</script>