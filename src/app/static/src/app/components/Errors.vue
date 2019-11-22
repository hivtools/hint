<template>
    <div class="container">
        <div class="content">
            <div v-if="hasErrors" class="alert alert-danger alert-dismissible fade-show" role="alert">
                <p>The following errors occurred. Please contact support if this problem persists.</p>
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
    import {mapState} from "vuex";
    import {ErrorsState} from "../store/errors/errors";
    import {mapMutationByName} from "../utils";
    import {ErrorsMutation} from "../store/errors/mutations";

    const namespace = "errors";

    export default Vue.extend({
        name: "Errors",
        computed: {
            ...mapState<ErrorsState>(namespace, {
                hasErrors: state => state.errors.length > 0,
                errors: state => state.errors
            })
        },
        methods: {
            dismissAll: mapMutationByName(namespace, ErrorsMutation.DismissAll)
        }
    })
</script>



