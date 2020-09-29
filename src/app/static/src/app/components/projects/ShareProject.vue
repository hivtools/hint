<template>
    <div>
        <a @click="shareProject" href=""
           v-translate="'share'"></a>
        <modal :open="open">
            <h4 v-translate="'shareProject'"></h4>
            <div v-if="!loading">
                <div v-html="instructions" id="instructions"></div>
                <input v-for="email in emailsToShareWith"
                       class="form-control"
                       :class="{
                        'is-invalid': email.valid === false,
                        'is-valid': email.valid === true
                        }"
                       @blur="() => addEmail(email)"
                       v-model="email.value"/>
            </div>
            <div class="text-center" v-if="loading">
                <loading-spinner size="sm"></loading-spinner>
            </div>
            <template v-slot:footer>
                <button type="button"
                        class="btn btn-red"
                        @click="confirmShareProject"
                        v-translate="'ok'">
                </button>
                <button type="button"
                        class="btn btn-white"
                        @click="cancelShareProject"
                        v-translate="'cancel'">
                </button>
            </template>
        </modal>
    </div>
</template>

<script lang="ts">
    import {Project} from "../../types";
    import Vue from "vue";
    import Modal from "../Modal.vue";
    import LoadingSpinner from "../LoadingSpinner.vue";
    import {mapStatePropByName} from "../../utils";
    import i18next from "i18next";
    import {Language} from "../../store/translations/locales";

    interface EmailToShareWith {
        value: string
        valid: boolean | null
    }

    interface Data {
        emailsToShareWith: EmailToShareWith[]
        open: boolean
        loading: boolean
    }

    interface Props {
        project: Project
    }

    interface Computed {
        currentLanguage: Language,
        instructions: string
    }

    interface Methods {
        addEmail: (email: EmailToShareWith) => void
        shareProject: (e: Event) => void
        confirmShareProject: () => void
        cancelShareProject: () => void
    }

    export default Vue.extend<Data, Methods, Computed, Props>({
        props: {
            project: {
                type: Object
            }
        },
        data() {
            return {
                emailsToShareWith: [{value: "", valid: null}],
                open: false,
                loading: false
            }
        },
        methods: {
            addEmail(e: EmailToShareWith) {
                this.emailsToShareWith.push({
                    value: "",
                    valid: null
                });
                // TODO also validate email
            },
            shareProject(e: Event) {
                e.preventDefault();
                this.open = true;
            },
            confirmShareProject() {

            },
            cancelShareProject() {
                this.open = false;
            }
        },
        computed: {
            currentLanguage: mapStatePropByName<Language>(null, "language"),
            instructions() {
                return i18next.t('shareProjectInstructions', {project: this.project.name, lng: this.currentLanguage});
            }
        },
        components: {
            Modal,
            LoadingSpinner
        }
    });

</script>
