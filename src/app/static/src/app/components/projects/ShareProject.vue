<template>
    <div>
        <button class="btn btn-sm btn-red-icons"
                v-tooltip="tooltipShare"
                @click="shareProject">
            <share-2-icon size="20"></share-2-icon>
        </button>
        <modal :open="open">
            <h4 v-translate="'shareProject'"></h4>
            <div v-if="!cloningProject">
                <div v-html="instructions" id="instructions"></div>
                <div class="row mb-2" v-for="(email, index) in emailsToShareWith" :key="index">
                    <div class="col">
                        <input autocomplete="no"
                               @keyup.enter="$event.target.blur()"
                               @keyup.delete="removeEmail(email, index)"
                               class="form-control"
                               :class="{'is-invalid': email.valid === false}"
                               @blur="() => addEmail()"
                               @mouseout="$event.target.blur()"
                               v-model="email.value"/>
                    </div>
                    <div class="col">
                        <div class="small text-danger"
                             :class="{'d-none': email.valid !== false}"
                             v-translate="email.validationMessage">
                        </div>
                    </div>
                </div>
            </div>
            <div class="text-center" v-if="cloningProject">
                <loading-spinner size="sm"></loading-spinner>
            </div>
            <template v-slot:footer>
                <div class="text-muted help-text"
                     v-show="showValidationMessage"
                     v-translate="'emailMultiValidation'">
                </div>
                <error-alert v-if="cloneProjectError" :error="cloneProjectError"></error-alert>
                <button type="button"
                        class="btn btn-red"
                        @click="confirmShareProject"
                        :disabled="invalidEmails || cloningProject"
                        v-translate="'ok'">
                </button>
                <button type="button"
                        class="btn btn-white"
                        @mousedown="cancelShareProject"
                        :disabled="cloningProject"
                        v-translate="'cancel'">
                </button>
            </template>
        </modal>
    </div>
</template>

<script lang="ts">
    import {Project} from "../../types";
    import Vue from "vue";
    import {mapState} from "vuex";
    import Modal from "../Modal.vue";
    import LoadingSpinner from "../LoadingSpinner.vue";
    import {mapActionByName, mapStatePropByName} from "../../utils";
    import i18next from "i18next";
    import {Language} from "../../store/translations/locales";
    import ErrorAlert from "../ErrorAlert.vue";
    import {CloneProjectPayload} from "../../store/projects/actions";
    import {Share2Icon} from "vue-feather-icons";
    import {VTooltip} from 'v-tooltip';
    import {RootState} from "../../root";

    interface EmailToShareWith {
        value: string
        valid: boolean | null
        validationMessage: string
    }

    interface Data {
        emailsToShareWith: EmailToShareWith[]
        open: boolean
        showValidationMessage: boolean
    }

    interface Props {
        project: Project
    }

    interface Computed {
        currentLanguage: Language,
        instructions: string
        invalidEmails: boolean
        cloneProjectError: Error | null
        cloningProject: boolean
        tooltipShare: string
    }

    interface Methods {
        addEmail: () => void
        removeEmail: (email: EmailToShareWith, index: number) => void
        shareProject: (e: Event) => void
        confirmShareProject: () => void
        cancelShareProject: () => void
        userExists: (email: string) => Promise<boolean>
        cloneProject: (payload: CloneProjectPayload) => void
    }

    declare const currentUser: string; 

    export default Vue.extend<Data, Methods, Computed, Props>({
        props: {
            project: {
                type: Object
            }
        },
        data() {
            return {
                emailsToShareWith: [{value: "", valid: null, validationMessage: "blank"}],
                open: false,
                showValidationMessage: false
            }
        },
        methods: {
            cloneProject: mapActionByName("projects", "cloneProject"),
            userExists: mapActionByName("projects", "userExists"),
            addEmail() {
                // Because the validation of duplicate emails is dependent on changes to other emails,
                // validation must be run over the entire list every time a change is made to any
                this.emailsToShareWith.map((email: EmailToShareWith, index: number) => {
                    if (email.value) {
                        if (index == this.emailsToShareWith.length - 1) {
                            // if blur event fires on the last input
                            // add another input below it
                            this.emailsToShareWith.push({
                                value: "",
                                valid: null,
                                validationMessage: "blank"
                            });
                        }
                        const duplicateEmails = this.emailsToShareWith.filter(val => val.value === email.value).length > 1
                        // console.log('duplicateEmails', duplicateEmails)
                        if (email.value !== currentUser && !duplicateEmails){
                        this.userExists(email.value)
                            .then((result: boolean) => {
                                this.emailsToShareWith[index].valid = result;
                                this.emailsToShareWith[index].validationMessage = "emailNotRegistered";
                                // this.showValidationMessage = this.invalidEmails;
                            })
                        } else if (email.value === currentUser) {
                            this.emailsToShareWith[index].valid = false;
                            this.emailsToShareWith[index].validationMessage = "projectsNoSelfShare";
                            // this.showValidationMessage = this.invalidEmails;
                        } else {
                            // console.log('this code is reached')
                            this.emailsToShareWith[index].valid = false;
                            this.emailsToShareWith[index].validationMessage = "duplicateEmails";
                            // this.showValidationMessage = this.invalidEmails;
                        }
                    } else {
                        email.valid = null;
                        // this.showValidationMessage = this.invalidEmails;
                    }
                })
                this.showValidationMessage = this.invalidEmails;
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
                const emails = this.emailsToShareWith
                    .filter(e => e.value)
                    .map(e => e.value);
                if (emails.length > 0) {
                    this.cloneProject({emails, projectId: this.project.id})
                }
            },
            cancelShareProject() {
                this.emailsToShareWith = [{value: "", valid: null, validationMessage: "blank"}];
                this.open = false;
            }
        },
        computed: {
            cloningProject: mapStatePropByName<boolean>("projects", "cloningProject"),
            cloneProjectError: mapStatePropByName<Error | null>("projects", "cloneProjectError"),
            currentLanguage: mapStatePropByName<Language>(null, "language"),
            instructions() {
                return i18next.t('shareProjectInstructions', {project: this.project.name, lng: this.currentLanguage});
            },
            invalidEmails() {
                return this.emailsToShareWith.filter(e => e.value && !e.valid).length > 0
            },
            tooltipShare() {
                return i18next.t("share", {
                    lng: this.currentLanguage,
                });
            },
        },
        components: {
            Modal,
            LoadingSpinner,
            ErrorAlert,
            Share2Icon
        },
        directives: {
            tooltip: VTooltip
        },
        watch: {
            cloningProject(newVal: boolean) {
                if (!newVal && !this.cloneProjectError) {
                    this.emailsToShareWith = [{value: "", valid: null, validationMessage: "blank"}];
                    this.open = false;
                }
            }
        }
    });

</script>
