<template>
    <div>
        <h2 v-translate="versionsHeader"></h2>
        <div class="my-2">
            <div v-if="currentVersion">
                <a v-translate="'currentVersion'" href="#" @click></a>
                 ({{currentVersion.name}})
            </div>
            <input type="text" class="form-control" v-translate:placeholder="'versionName'" v-model="newVersionName">
            <button type="button"
                    class="btn btn-red"
                    :disabled="disableCreate"
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
    import {Version} from "../../types";

    const namespace = "versions";

    interface Data {
        newVersionName: string
    }

    interface Computed {
        currentVersion: Version | null,
        error: Error,
        hasError: boolean,
        disableCreate: boolean
    }

    export default Vue.extend<Data, {}, Computed, {}>({
        data: function(){
            return {
                newVersionName: ""
            }
        },
        computed: {
            ...mapStateProps<VersionsState, keyof Computed>(namespace, {
                currentVersion: state => state.currentVersion,
                error: state => state.error,
                hasError: state => !!state.error
            }),
            disableCreate: function() {
                return !this.newVersionName;
            }
        },
        methods: {
            createVersion: mapActionByName(namespace, "createVersion")
        },
        components: {
            ErrorAlert
        }
    });
</script>
