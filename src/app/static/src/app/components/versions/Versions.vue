<template>
    <div>
        <div class="my-3 col-6 clearfix">
            <button type="button"
                    class="btn btn-red mt-2 float-right"
                    :disabled="disableCreate"
                    @click="createVersion(newVersionName)"
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
