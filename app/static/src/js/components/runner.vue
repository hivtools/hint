<template>
    <div>
        <button class="btn btn-red" v-on:click="run" :disabled="running || !inputs">Run model</button>
        <div class="alert alert-danger mt-3" v-if="error.length > 0">
            {{error}}
        </div>
    </div>
</template>

<script>
    import axios from "axios";

    export default {
        name: 'runner',
        props: ['running', 'inputs'],
        data() {
            return {
                error: ""
            }
        },
        methods: {
            run: function () {
                axios.post(`/run`, this.inputs)
                    .then((result) => {
                        if (result.data.error){
                            this.error = result.data.error;
                        }
                        else {
                            this.$emit('queued', result.data);
                        }
                    })
                    .catch(() => {
                        this.error = "Error queuing model run";
                    });
            }
        }
    };
</script>