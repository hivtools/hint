<template>
    <div class="container">
        <label for="pjnz"></label>
        <input type="file" ref="pjnz" id="pjnz" class="form-control" v-on:change="handleFileUpload"/>
        <button class="btn btn-success" v-on:click="submitFile">Submit</button>
        <div v-if="hasError" class="alert alert-danger">
            Something went wrong
        </div>
        <div v-if="country">
            {{country}}
        </div>
    </div>
</template>

<script lang="ts">

    import Vue from "vue";
    import {BaselineState} from "../store/baseline/baseline";
    import {mapState} from "vuex";
    import {store} from "../main";

    const namespace: string = 'baseline';

    interface Data {
        file: File | null
    }

    export default Vue.extend({

        computed: mapState<BaselineState>(namespace, {
            country: state => state.country,
            hasError: state => state.hasError
        }),
        data(): Data {
            return {
                file: null
            }
        },
        methods: {
            handleFileUpload() {
                const fileInput = this.$refs.pjnz as HTMLInputElement;
                this.file = fileInput && fileInput.files && fileInput.files[0];
            },
            submitFile() {
                store.dispatch('baseline/uploadPJNZ', this.file)
            }
        }
    })
</script>