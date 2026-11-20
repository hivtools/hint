<template>
    <div class="pt-1 text-danger">
        <div class="error-message">{{ message }}</div>
        <div class="error-job-id" v-if="error.job_id"><strong><span v-translate="'jobId'"></span>:</strong> {{ error.job_id }}</div>
    </div>
</template>

<script lang="ts">
    import { type PropType, defineComponent } from "vue";
    import type {Error} from "../generated";

    export default defineComponent({
        props: {
            error: {
                type: Object as PropType<Error>,
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
