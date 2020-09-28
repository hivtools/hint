<template>
    <div>
        <a @click="shareProject" href=""
           v-translate="'share'"></a>
        <modal :open="open">
            <h4 v-translate="'shareProject'"></h4>
            <div v-if="!loading">
                <div v-html="instructions" id="instructions"></div>
                <div class="help-text text-muted small">E.g. someone@gmail.com, another@hotmail.com</div>
                <input class="form-control"
                       :class="{'is-invalid': showValidationFeedback}"
                       v-model="emailsToShareWith"/>
                <div class="invalid-feedback"
                     v-translate="'emailMultiValidation'">
                </div>
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
    import {mapStatePropByName, validateEmail} from "../../utils";
    import i18next from "i18next";
    import {Language} from "../../store/translations/locales";

    interface Data {
        emailsToShareWith: string
        open: boolean
        loading: boolean,
        showValidationFeedback: boolean
    }

    interface Props {
        project: Project
    }

    interface Computed {
        currentLanguage: Language,
        invalidEmail: boolean
        instructions: string
    }

    interface Methods {
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
                emailsToShareWith: "",
                open: false,
                loading: false,
                showValidationFeedback: false
            }
        },
        methods: {
            shareProject(e: Event) {
                e.preventDefault();
                this.open = true;
            },
            confirmShareProject() {
                if (this.invalidEmail) {
                    this.showValidationFeedback = true;
                } else {
                    this.showValidationFeedback = false;
                    this.loading = true;
                    const emails = this.emailsToShareWith.replace(/\s*/g, "").split(",")
                    setTimeout(() => {
                        // TODO trigger action to clone project
                        this.loading = false;
                        this.open = false;
                    }, 200);
                }
            },
            cancelShareProject() {
                this.showValidationFeedback = false;
                this.emailsToShareWith = "";
                this.open = false;
            }
        },
        computed: {
            currentLanguage: mapStatePropByName<Language>(null, "language"),
            invalidEmail() {
                return !this.emailsToShareWith || !validateEmail(this.emailsToShareWith)
            },
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
