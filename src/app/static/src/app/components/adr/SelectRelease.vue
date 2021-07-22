<template>
    <div id="selectRelease">
        <tree-select
            :multiple="false"
            :searchable="true"
            :options="datasetOptions"
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

    const namespace = "adr";

    export default Vue.extend({
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
                return this.datasets.map((d) => ({
                    id: d.id,
                    label: d.title,
                    customLabel: `${d.title}
                            <div class="text-muted small" style="margin-top:-5px; line-height: 0.8rem">
                                (${d.name})<br/>
                                <span class="font-weight-bold">${d.organization.title}</span>
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