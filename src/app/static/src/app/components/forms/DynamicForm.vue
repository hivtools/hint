<template>
    <b-form :ref="id" class="dynamic-form">
        <dynamic-form-control-section v-for="section in formMeta.controlSections"
                                      :control-section="section">
        </dynamic-form-control-section>
        <button v-if="includeSubmitButton" class="btn btn-red" v-on:click="submit">{{submitText}}</button>
    </b-form>
</template>

<script lang="ts">

    import Vue from "vue";
    import {BForm} from "bootstrap-vue";
    import {Dictionary} from "vuex";
    import DynamicFormControlGroup from "./DynamicFormControlGroup.vue";
    import DynamicFormControlSection from "./DynamicFormControlSection.vue";

    export default Vue.extend({
        name: "DynamicForm",
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
            },
            formMeta: {
                type: Object
            }
        },
        components: {
            BForm,
            DynamicFormControlGroup,
            DynamicFormControlSection
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
                return data;
            }
        }
    })
</script>