<template>
    <form>
        <div class="form-group">
            <label for="a">a</label>
            <input type="number" v-model="a" class="form-control" id="a">
        </div>
        <div class="form-group">
            <label for="b">b</label>
            <input type="number" class="form-control" v-model="b" id="b">
        </div>
        <div class="form-group">
            <label for="time">time</label>
            <input type="number" class="form-control" v-model="time" id="time">
        </div>
        <div class="form-group">
            <label for="poll">poll</label>
            <input type="number" class="form-control" v-model="poll" id="poll">
        </div>
        <button type="submit" class="btn btn-red" v-on:click="validate">Validate</button>
        <div class="alert alert-danger mt-3" v-if="error.length > 0">
            {{error}}
        </div>
        <div class="alert alert-success mt-3" v-if="valid">
            These inputs are valid
        </div>
    </form>
</template>

<script>
    import axios from "axios";

    export default {
        name: 'model-inputs',
        data() {
            return {
                error: "",
                a: 20,
                b: 3,
                time: 1,
                poll:100,
                valid: false
            }
        },
        methods: {
            validate: function (e) {
                e.preventDefault();
                const inputs = {
                    "parameters": this.$data,
                    "csv_data": ["a,b", "1,2", "2,3", "3,4"]
                };
                const jsonString = "modelJson=" + JSON.stringify(inputs);
                axios.post(`/validate`, jsonString)
                    .then((result) => {
                        if (result.data.success) {
                            this.$emit('validated', jsonString);
                            this.error = "";
                            this.valid = true;
                        }
                        else {
                            this.error = result.data.error;
                            this.valid = false;
                        }
                    })
                    .catch(() => {
                        this.error = "Error validating inputs";
                        this.valid = false;
                    });
            }
        }
    };
</script>
