<template>
    <b-form :ref="id" class="custom-form">
        <div v-for="section in form.controlSections">
            <h3>{{section.label}}</h3>
            <p class="text-muted">{{section.description}}</p>
            <dynamic-form-control-group v-for="group in section.controlGroups"
                                        :group="group"></dynamic-form-control-group>
        </div>
        <button v-if="includeSubmitButton" class="btn btn-red" v-on:click="submit">{{submitText}}</button>
    </b-form>
</template>

<script lang="ts">

    import Vue from "vue";
    import {BForm} from "bootstrap-vue";
    import {formMeta} from "./fakeFormMeta";
    import {Dictionary} from "vuex";
    import DynamicFormControlGroup from "./DynamicFormControlGroup.vue";

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
            }
        },
        data() {
            return {
                form: formMeta
            }
        },
        components: {
            BForm,
            DynamicFormControlGroup
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