<template>
    <div class="pt-1 text-danger">
        <div class="error-message">{{ message }}</div>
        <div class="error-job-id" v-if="error.job_id"><strong><span v-translate="'jobId'"></span>:</strong> {{ error.job_id }}</div>
    </div>
</template>

<script lang="ts">
    import { defineComponentVue2WithProps } from "../defineComponentVue2/defineComponentVue2";
    import {Error} from "../generated";

    interface Props {
        error: Error
    }

    interface Computed {
        message: string
    }

    export default defineComponentVue2WithProps<unknown, unknown, Computed, Props>({
        props: {
            error: {
                type: Object,
                required: true
            }
        },
        computed: {
            message: function () {
                return this.error.detail ? this.error.detail : this.error.error
            }
        }
    });
</script>
