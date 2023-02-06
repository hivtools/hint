<template>
    <div class="pt-1 text-danger">
        <div class="error-message">{{ message }}</div>
        <div class="error-job-id" v-if="error.job_id"><strong><span v-translate="'jobId'"></span>:</strong> {{ error.job_id }}</div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {Error} from "../generated";

    interface Props {
        error: Error
    }

    interface Computed {
        message: string
    }

    export default Vue.extend<unknown, unknown, Computed, Props>({
        props: {
            "error": Object
        },
        computed: {
            message: function () {
                return this.error.detail ? this.error.detail : this.error.error
            }
        }
    });
</script>
