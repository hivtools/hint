<template>
    <div>
        <h2 v-translate="versionsHeader"></h2>
        <div class="my-2">
            <div v-if="userVersion">
                <a v-translate="'currentVersion'" href="#" @click></a>
                 ({{userVersion}})
            </div>
            <input type="text" class="form-control" v-translate:placeholder="'versionName'" v-model="newVersionName">
            <button type="button"
                    class="btn btn-red"
                    @click="createVersion(newVersionName)"
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
        data: function(){
            return {
                newVersionName: ""
            }
        },
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
