<template>
    <div>
        <div class="status" v-if="runId && interval">
            Running model...
        </div>
        <div class="alert alert-danger mt-3" v-if="error.length > 0">
            {{error}}
        </div>
    </div>
</template>

<script>
    import axios from "axios";
    import {start, stop} from './polling';

    export default {
        name: 'status',
        props: ['runId'],
        data() {
            return {
                interval: null,
                error: ""
            }
        },
        methods: {
            pollStatus: function () {
                this.error = "";
                axios.get(`/status/${this.runId}`)
                    .then((result) => {
                        if (result.data.done) {
                            stop(this.interval);
                            this.interval = null;
                            this.$emit('finished', result.data.success);

                            if (!result.data.success) {
                                this.error = "Model run failed"
                            }
                        }
                    })
                    .catch(() => {
                        this.error = "Error querying run status";
                    });
            }
        },
        mounted: function () {
            if (this.runId) {
                this.interval = start(this.pollStatus.bind(this));
            }
        },
        watch: {
            runId: function (newVal) {
                if (newVal) {
                    this.interval = start(this.pollStatus.bind(this));
                }
            }
        }
    }
</script>