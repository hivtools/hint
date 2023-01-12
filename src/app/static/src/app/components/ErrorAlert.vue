<template>
    <div class="pt-1 text-danger">
        <div class="error-message">{{ message }}</div>
        <div class="error-job-id" v-if="error.job_id"><span v-translate="'jobId'"></span>: {{ error.job_id }}</div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {Error} from "../generated";

    interface Data {
        showTrace: boolean
    }

    interface Props {
        error: Error
    }

    interface Computed {
        message: string,
        cssClass: string
    }

    interface Methods {
        toggleTrace: () => void
    }

    export default Vue.extend<Data, Methods, Computed, Props>({
        props: {
            "error": Object
        },
        data(): Data {
            return {
                showTrace: false
            }
        },
        computed: {
            message: function () {
                return this.error.detail ? this.error.detail : this.error.error
            },
            cssClass: function () {
                return this.showTrace ? "up" : "down";
            }
        }
    });
</script>
