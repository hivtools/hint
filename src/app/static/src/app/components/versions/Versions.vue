<template>
    <div>
        <div class="my-2">
            <div v-if="userVersion">
                <span v-translate="'currentVersion'"></span>
                : {{userVersion}}
            </div>
            <button type="button"
                    class="btn btn-red"
                    @click="createVersion"
                    v-translate="'createVersion'">
            </button>
        </div>
        <error-alert v-if="hasError" :error="error"></error-alert>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapActionByName, mapStateProp, mapStateProps} from "../../utils";
    import {VersionsState} from "../../store/versions/versions";
    import {Error} from "../../generated";
    import ErrorAlert from "../ErrorAlert.vue";

    const namespace = "versions";

    interface Computed {
        userVersion: string,
        error: Error,
        hasError: boolean
    }

    export default Vue.extend({
        computed: {
            ...mapStateProps<VersionsState, keyof Computed>(namespace, {
                userVersion: state => state.userVersion,
                error: state => state.error,
                hasError: state => !!state.error
            }),
        },
        methods: {
            createVersion: mapActionByName(namespace, "createVersion")
        },
        components: {
            ErrorAlert
        }
    });
</script>
