<template>
    <div>
        <a @click="shareProject" href="" v-translate="'shareProject'"></a>
        <modal :open="open">
            <h4 v-translate="'shareProject'"></h4>
            <p>This will create a copy of {{ project.name }} for the given users.
                Please enter the email address or addresses you would like to share this project with.
                These email addresses must be already registered with Naomi.
                If sharing with multiple users, separate email addresses with commas:</p>
            <div class="help-text">E.g. someone@gmail.com, another@hotmail.com</div>
            <input class="form-control" v-model="emailsToShareWith"/>
            <div class="invalid-feedback d-block" v-if="invalidEmail">
                Please enter valid, comma separated email addresses
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

    interface Data {
        emailsToShareWith: string
        open: boolean
    }

    interface Props {
        project: Project;
    }

    interface Computed {
        invalidEmail: boolean;
    }

    const emailRegex = RegExp("^([\\w+-.%]+@[\\w.-]+\\.[A-Za-z]{2,4})(,[\\w+-.%]+@[\\w.-]+\\.[A-Za-z]{2,4})*$")
    export default Vue.extend<Data, Methods, Computed, Props>({
        props: {
            project: {
                type: Object
            }
        },
        data() {
            return {
                emailsToShareWith: "",
                open: false
            }
        },
        methods: {
            shareProject(e: Event) {
                e.preventDefault();
                this.open = true;
            },
            confirmShareProject() {
                // TODO trigger action to clone project
                this.open = false;
            },
            cancelShareProject() {
                this.open = false;
            }
        },
        computed: {
            invalidEmail() {
                return !this.emailsToShareWith || !emailRegex.test(this.emailsToShareWith)
            }
        },
        components: {
            Modal
        }
    });

</script>
