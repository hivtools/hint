<template>
    <div id="selectRelease">
        <tree-select
            v-if="selectedDataset"
            :multiple="false"
            :searchable="true"
            :options="releaseOptions"
            :placeholder="select"
            v-model="newReleaseId"
        >
            <label
                slot="option-label"
                slot-scope="{ node }"
                v-html="node.raw.customLabel"
            >
            </label>
        </tree-select>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import { mapActionByName, mapStateProp } from "../../utils";
    import TreeSelect from "@riophae/vue-treeselect";
    import { ADRState } from "../../store/adr/adr";

    interface Data {
        newReleaseId: string | null;
    }

    interface Methods {
        getReleases: (id: string) => void;
    }

    interface Computed {
        releases: any[];
        releaseOptions: any[];
    }

    const namespace = "adr";

    export default Vue.extend<Data, Methods, Computed, unknown>({
        components: {
            TreeSelect,
        },
        props: ["selectedDataset"],
        data() {
            return {
                newReleaseId: null,
            };
        },
        computed: {
            releases: mapStateProp<ADRState, any[]>(
                namespace,
                (state: ADRState) => state.releases
            ),
            releaseOptions() {
                return this.releases.map((d) => ({
                    id: d.id,
                    label: d.name,
                    customLabel: `${d.name}
                                <div class="text-muted small" style="margin-top:-5px; line-height: 0.8rem">
                                    ${d.notes}<br/>
                                </div>`,
                }));
            },
        },
        methods: {
            getReleases: mapActionByName("adr", "getReleases"),
        },
        watch: {
            selectedDataset(id) {
                this.getReleases(id);
            },
        },
    });
</script>