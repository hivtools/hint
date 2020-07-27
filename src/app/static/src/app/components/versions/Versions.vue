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
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapMutationByName} from "../../utils";
    import ErrorAlert from "../ErrorAlert.vue";
    import LoadingSpinner from "../LoadingSpinner.vue";
    import {VersionsMutations} from "../../store/versions/mutations";

    const namespace = "versions";

    interface Data {
        newVersionName: string
    }

    export default Vue.extend<Data, {}, {}, {}>({
        data: function(){
            return {
                newVersionName: ""
            }
        },
        computed: {
        },
        methods: {
            createFakeVersion: mapMutationByName(namespace, VersionsMutations.SetFakeCurrentVersion)
        },
        components: {
            ErrorAlert,
            LoadingSpinner
        }
    });
</script>
