<template>
    <div v-if="hasErrors" class="container">
        <div class="content">
            <div class="alert alert-danger alert-dismissible fade-show" role="alert">
                <p v-for="(error, index) in errors" :key="index">
                    {{ error }}
                </p>
                <button type="button" class="close" @click="dismissAll">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        </div>
        {{ redirectPage }}
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {ErrorsState} from "../store/errors/errors";
    import {mapMutationByName, mapStateProps} from "../utils";
    import {ErrorsMutation} from "../store/errors/mutations";
    import {Error} from "../generated"

    const namespace = "errors";

    interface Props {
        title: string
    }

    interface Methods {
        dismissAll: () => void
    }

    interface ComputedState {
        errors: Error[]
        redirectPage: void
    }

    interface Computed extends ComputedState {
        hasErrors: boolean

    }

    export default Vue.extend<unknown, Methods, Computed, Props>({
        name: "Errors",
        props: {
            title: String
        },
        computed: {
            ...mapStateProps<ErrorsState, keyof ComputedState>(namespace, {
                errors: state => {
                    const messages = state.errors.map(e => e.detail ? e.detail : e.error);
                    return Array.from(new Set(messages))
                }
            }),
            hasErrors: function () {
                return this.errors.length > 0
            },
            redirectPage: function () {
                if (this.hasErrors) {
                    const location = this.errors.filter(e => e.error === "unauthorized")
                    if (location) {
                        window.location.assign("/login")
                    }
                }
            }
        },
        methods: {
            dismissAll: mapMutationByName(namespace, ErrorsMutation.DismissAll)
        }
    })
</script>



