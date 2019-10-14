<template>
    <b-form :ref="id" class="custom-form">
        <div v-for="section in form.controlSections">
            <h3>{{section.label}}</h3>
            <p class="text-muted">{{section.description}}</p>
            <control-group v-for="group in section.controlGroups" :group="group"></control-group>
        </div>
        <button v-if="includeSubmitButton" class="btn btn-red" v-on:click="submit">{{submitText}}</button>
    </b-form>
</template>

<script lang="ts">

    import Vue from "vue";
    import {BForm} from "bootstrap-vue";
    import {formMeta} from "./fakeFormMeta";
    import ControlGroup from "./ControlGroup.vue";
    import {Dictionary} from "vuex";

    export default Vue.extend({
        name: "CustomForm",
        props: {
            id: {
                type: String,
                default: Math.random().toString(36).slice(-5)
            },
            submitText: {
                type: String,
                default: "Submit"
            },
            includeSubmitButton: {
                type: Boolean,
                default: true
            }
        },
        data() {
            return {
                form: formMeta
            }
        },
        components: {
            BForm,
            ControlGroup
        },
        methods: {
            submit(e: Event) {
                if (e) {
                    e.preventDefault();
                }
                const form = this.$refs[this.id] as HTMLFormElement;
                const formData = new FormData(form);
                const data: Dictionary<any> = {};
                formData.forEach(function (value, key) {
                    data[key] = value;
                });
                this.$emit("submit", data);
            }
        }
    })
</script>