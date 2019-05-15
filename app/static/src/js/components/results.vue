<template>
    <div class="mt-3">
        <ul class="list-unstyled">
            <li v-for="(value, name) in fitted">
                {{ name }}: {{ value }}
            </li>
        </ul>
        <div v-if="simulation.length > 0">
            <vue-plotly :data="simulation"/>
        </div>
    </div>
</template>

<script>
    import axios from "axios";
    import VuePlotly from './plotly.vue'

    export default {
        name: 'results',
        props: ['runId', 'finished', 'success'],
        components: {
            VuePlotly
        },
        data() {
            return {
                fitted: {},
                simulation: []
            }
        },
        methods: {
            getResult: function () {
                axios.get(`/result/${this.runId}`)
                    .then((result) => {
                        this.fitted = result.data.fitted;
                        this.simulation = result.data.simulation;
                    })
                    .catch(() => {
                        this.error = "Error querying result";
                    });
            }
        },
        watch: {
            finished: function (newVal) {
                if (newVal && this.success) {
                    this.getResult();
                }
            },
            success: function (newVal) {
                if (newVal && this.finished) {
                    this.getResult();
                }
            }
        }
    }
</script>>