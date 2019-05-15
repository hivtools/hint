require("bootstrap/js/dist/tab");

import Vue from 'vue';

import runner from "./components/runner.vue"
import modelInputs from "./components/inputs.vue"
import status from "./components/status.vue"
import results from "./components/results.vue"

const data = {
    runId: null,
    inputs: null,
    finished: false,
    success: false
};

const app = new Vue({
    el: '#app',
    data: data,
    components: {
        modelInputs: modelInputs,
        runner: runner,
        status: status,
        results: results
    },
    methods: {
        handleRun: function (id) {
            this.runId = id
        },
        handleValidated: function (validatedInput) {
            this.inputs = validatedInput
        },
        handleFinished: function(success) {
            this.finished = true;
            this.success = success
        }
    }
});

