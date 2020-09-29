<template>
    <div>
        <a @click="shareProject" href=""
           v-translate="'share'"></a>
        <modal :open="open">
            <h4 v-translate="'shareProject'"></h4>
            <div v-if="!loading">
                <div v-html="instructions" id="instructions"></div>
                <div class="row mb-2" v-for="(email, index) in emailsToShareWith">
                    <div class="col">
                        <input
                            @keyup.enter="$event.target.blur()"
                            @keyup.delete="removeEmail(email, index)"
                            class="form-control"
                            :class="{
                                        'is-invalid': email.valid === false,
                                        'is-valid': email.valid === true
                                    }"
                            @blur="() => addEmail(email, index)"
                            v-model="email.value"/>
                    </div>
                    <div class="col">
                        <div class="small text-danger" :class="{'d-none': email.valid !== false}">
                            This email address is not registered with Naomi
                        </div>
                    </div>
                </div>
            </div>
            <div class="text-center" v-if="loading">
                <loading-spinner size="sm"></loading-spinner>
            </div>
            <template v-slot:footer>
                <div class="text-muted help-text" v-show="disabled">
                    Please correct or remove invalid email addresses
                </div>
                <button type="button"
                        class="btn btn-red"
                        @click="confirmShareProject"
                        :disabled="disabled"
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
    }

    interface Props {
        project: Project
    }

    interface Computed {
        currentLanguage: Language,
        instructions: string
        disabled: boolean
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
                loading: false
            }
        },
        methods: {
            userExists: mapActionByName("projects", "userExists"),
            addEmail(e: EmailToShareWith, index: number) {
                if (e.value) {
                    if (index == this.emailsToShareWith.length -1) {
                        // if blur event fires on the last input
                        // add another input below it
                        this.emailsToShareWith.push({
                            value: "",
                            valid: null
                        });
                    }
                    this.userExists(e.value)
                        .then((result: boolean) => {
                            this.emailsToShareWith[index].valid = result
                        })
                }
                else {
                    e.valid = null
                }
            },
            removeEmail(email: EmailToShareWith, index: number) {
                // if email has been deleted and this is not the last input box
                // remove from UI
                if (!email.value && index < this.emailsToShareWith.length -1){
                    this.emailsToShareWith.splice(index, 1)
                }
            },
            shareProject(e: Event) {
                e.preventDefault();
                this.open = true;
            },
            confirmShareProject() {
                const emails = this.emailsToShareWith.filter(e => e.value)
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
            disabled() {
                return this.emailsToShareWith.filter(e => e.value && !e.valid).length > 0
            }
        },
        components: {
            Modal,
            LoadingSpinner
        }
    });

</script>
