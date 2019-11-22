<template>
    <div class="container">
        <div class="content">
            <div v-if="hasErrors" class="alert alert-danger alert-dismissible fade-show" role="alert">
                <p>The following errors occurred. Please contact {{title}} support if this problem persists.</p>
                <p v-for="error in errors">
                    {{error}}
                </p>
                <button type="button" class="close" @click="dismissAll">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {ErrorsState} from "../store/errors/errors";
    import {mapMutationByName, mapStateProps} from "../utils";
    import {ErrorsMutation} from "../store/errors/mutations";

    const namespace = "errors";

    interface Props {
        title: string,
        user: string
    }

    interface Methods {
        dismissAll: () => void
    }

    interface ComputedState {
        errors: string[]
    }

    interface Computed extends ComputedState{
        hasErrors: boolean

    }

    export default Vue.extend<{}, Methods, Computed, Props>({
        name: "Errors",
        computed: {
            ...mapStateProps<ErrorsState, keyof ComputedState>(namespace, {
                errors: state => state.errors
            }),
            hasErrors: function() { return this.errors.length > 0}
        },
        methods: {
            dismissAll: mapMutationByName(namespace, ErrorsMutation.DismissAll)
        }
    })
</script>



