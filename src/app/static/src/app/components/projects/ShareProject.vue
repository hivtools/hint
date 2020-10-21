<template>
    <div>
        <a @click="shareProject" href=""
           v-translate="'share'"></a>
        <modal :open="open">
            <h4 v-translate="'shareProject'"></h4>
            <div v-if="!loading">
                <div v-html="instructions" id="instructions"></div>
                <div class="row mb-2" v-for="(email, index) in emailsToShareWith" :key="index">
                    <div class="col">
                        <input autocomplete="no"
                            @keyup.enter="$event.target.blur()"
                            @keyup.delete="removeEmail(email, index)"
                            class="form-control"
                            :class="{'is-invalid': email.valid === false}"
                            @blur="() => addEmail(email, index)"
                            v-model="email.value"/>
                    </div>
                    <div class="col">
                        <div class="small text-danger"
                             :class="{'d-none': email.valid !== false}"
                             v-translate="'emailNotRegistered'">
                        </div>
                    </div>
                </div>
            </div>
            <div class="text-center" v-if="loading">
                <loading-spinner size="sm"></loading-spinner>
            </div>
            <template v-slot:footer>
                <div class="text-muted help-text"
                     v-show="showValidationMessage"
                     v-translate="'emailMultiValidation'">
                </div>
                <button type="button"
                        class="btn btn-red"
                        @click="confirmShareProject"
                        :disabled="invalidEmails || loading"
                        v-translate="'ok'">
                </button>
                <button type="button"
                        class="btn btn-white"
                        @click="cancelShareProject"
                        :disabled="loading"
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
    import {mapActionByName, mapStatePropByName} from "../../utils";
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
        showValidationMessage: boolean
    }

    interface Props {
        project: Project
    }

    interface Computed {
        currentLanguage: Language,
        instructions: string
        invalidEmails: boolean
    }

    interface Methods {
        addEmail: (email: EmailToShareWith, index: number) => void
        removeEmail: (email: EmailToShareWith, index: number) => void
        shareProject: (e: Event) => void
        confirmShareProject: () => void
        cancelShareProject: () => void
        userExists: (email: string) => Promise<boolean>
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
                loading: false,
                showValidationMessage: false
            }
        },
        methods: {
            userExists: mapActionByName("projects", "userExists"),
            addEmail(e: EmailToShareWith, index: number) {
                if (e.value) {
                    if (index == this.emailsToShareWith.length - 1) {
                        // if blur event fires on the last input
                        // add another input below it
                        this.emailsToShareWith.push({
                            value: "",
                            valid: null
                        });
                    }
                    this.userExists(e.value)
                        .then((result: boolean) => {
                            this.emailsToShareWith[index].valid = result;
                            this.showValidationMessage = this.invalidEmails;
                        })
                } else {
                    e.valid = null;
                    this.showValidationMessage = this.invalidEmails;
                }
            },
            removeEmail(email: EmailToShareWith, index: number) {
                // if email has been deleted and this is not the last input
                // remove from UI
                if (!email.value && index < this.emailsToShareWith.length - 1) {
                    this.emailsToShareWith.splice(index, 1);
                    this.showValidationMessage = this.invalidEmails;
                }
            },
            shareProject(e: Event) {
                e.preventDefault();
                this.open = true;
            },
            confirmShareProject() {
                this.loading = true;
                setTimeout(() => {
                    // TODO trigger action to clone project
                    this.loading = false;
                    this.open = false;
                }, 200);
            },
            cancelShareProject() {
                this.open = false;
            }
        },
        computed: {
            currentLanguage: mapStatePropByName<Language>(null, "language"),
            instructions() {
                return i18next.t('shareProjectInstructions', {project: this.project.name, lng: this.currentLanguage});
            },
            invalidEmails() {
                return this.emailsToShareWith.filter(e => e.value && !e.valid).length > 0
            }
        },
        components: {
            Modal,
            LoadingSpinner
        }
    });

</script>
