<template>
    <div>
        <div v-if="!loading" id="versions-content" class="row">
            <div id="versions-header" class="lead col-12">
                <span v-translate="'versionsHeaderCreate'"></span>
                <span v-if="currentVersion">
                    <span v-translate="'or'"></span>
                    <a v-translate="'versionsHeaderReturn'"
                       href="#" @click="handleCurrentVersionClick"></a> ({{currentVersion.name}})
                </span>
            </div>
            <div class="my-3 col-6 clearfix">
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
        <div v-if="loading" class="text-center">
            <loading-spinner size="lg"></loading-spinner>
            <h2 id="loading-message" v-translate="'loadingVersion'"></h2>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapActionByName, mapMutationByName, mapStateProp, mapStateProps} from "../../utils";
    import {VersionsState} from "../../store/versions/versions";
    import {Error} from "../../generated";
    import ErrorAlert from "../ErrorAlert.vue";
    import LoadingSpinner from "../LoadingSpinner.vue";
    import {PayloadWithType, Version} from "../../types";

    import {VersionsMutations} from "../../store/versions/mutations";

    const namespace = "versions";

    interface Data {
        newVersionName: string
    }

    interface Computed {
        currentVersion: Version | null,
        error: Error,
        hasError: boolean,
        disableCreate: boolean,
        loading: boolean
    }

    interface Methods {
        handleCurrentVersionClick: (e: Event) => void,
        createVersion: (name: string) => void,
        setManageVersions: (payload: PayloadWithType<boolean>) => void
    }

    export default Vue.extend<Data, Methods, Computed, {}>({
        data: function(){
            return {
                newVersionName: ""
            }
        },
        computed: {
            ...mapStateProps<VersionsState, keyof Computed>(namespace, {
                currentVersion: state => state.currentVersion,
                error: state => state.error,
                hasError: state => !!state.error,
                loading: state => state.loading
            }),
            disableCreate: function() {
                return !this.newVersionName;
            }
        },
        methods: {
            handleCurrentVersionClick: function(e: Event) {
                e.preventDefault();
                this.setManageVersions({type:  VersionsMutations.SetManageVersions, payload: false});
            },
            createVersion: mapActionByName(namespace, "createVersion"),
            setManageVersions: mapMutationByName(namespace, VersionsMutations.SetManageVersions)
        },
        components: {
            ErrorAlert,
            LoadingSpinner
        }
    });
</script>
