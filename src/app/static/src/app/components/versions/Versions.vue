<template>
    <div>
        <div class="col-6">
            <h2 v-translate="'versionsHeaderCreate'"></h2>
            <button type="button"
                    class="btn btn-red mt-2"
                    @click="createFakeVersion"
                    v-translate="'createVersion'">
            </button>
        </div>
        <div>
            {{JSON.stringify(previousVersions)}}
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapActionByName, mapMutationByName} from "../../utils";
    import ErrorAlert from "../ErrorAlert.vue";
    import LoadingSpinner from "../LoadingSpinner.vue";
    import {VersionsMutations} from "../../store/versions/mutations";

    const namespace = "versions";

    interface Data {
        newVersionName: string
    }

    interface Methods {
        createFakeVersion: (name: string) => void,
        getVersions: () => void
    }

    export default Vue.extend<Data, Methods, {}, {}>({
        data: function(){
            return {
                newVersionName: "",
                previousVersions: []
            }
        },
        computed: {
        },
        methods: {
            createFakeVersion: mapMutationByName(namespace, VersionsMutations.SetFakeCurrentVersion),
            getVersions: mapActionByName(namespace, "getVersions")
        },
        mounted() {
            this.getVersions();
        },
        components: {
            ErrorAlert,
            LoadingSpinner
        }
    });
</script>
