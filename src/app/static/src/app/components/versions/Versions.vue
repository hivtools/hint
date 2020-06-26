<template>
    <div>
        <div class="versions-header">
            <span v-translate="'versionsHeaderCreate'"></span>
            <span v-if="currentVersion">
                <span v-translate="'or'"></span>
                <a v-translate="'versionsHeaderReturn'" href="#" @click="setManageVersions(false)"></a>
                ({{currentVersion.name}})
            </span>
        </div>
        <div class="my-3 col-6">
            <input type="text" class="form-control" v-translate:placeholder="'versionName'" v-model="newVersionName">
            <button type="button"
                    class="btn btn-red mt-2 float-right"
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
    import {mapActionByName, mapMutationByName, mapStateProp, mapStateProps} from "../../utils";
    import {VersionsState} from "../../store/versions/versions";
    import {Error} from "../../generated";
    import ErrorAlert from "../ErrorAlert.vue";
    import {Version} from "../../types";
    import {VersionsMutations} from "../../store/versions/mutations";

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
            createVersion: mapActionByName(namespace, "createVersion"),
            setManageVersions: mapMutationByName(namespace, VersionsMutations.SetManageVersions)
        },
        components: {
            ErrorAlert
        }
    });
</script>
