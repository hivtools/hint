<template>
    <div>
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
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapActionByName, mapStateProp} from "../../utils";
    import {VersionsState} from "../../store/versions/versions";

    const namespace = "versions";

    export default Vue.extend({
        computed: {
            userVersion: mapStateProp<VersionsState, string | null>(namespace, state => state.userVersion),
        },
        methods: {
            createVersion: mapActionByName(namespace, "createVersion")
        }
    });
</script>
