<template>
    <div>
        <button class="btn btn-red" @click="toggleModal">Select ADR dataset</button>
        <modal id="dataset" :open="open">
            <h4>Browse ADR</h4>
            <tree-select :multiple="false" :searchable="true" :options="datasetOptions">
                <label slot="option-label"
                       slot-scope="{ node }"
                       v-html="node.raw.customLabel">
                </label>
            </tree-select>
            <template v-slot:footer>
                <button type="button"
                        class="btn btn-white"
                        @click="importDataset">
                    Import
                </button>
                <button type="button"
                        class="btn btn-white"
                        @click="toggleModal">
                    Cancel
                </button>
            </template>
        </modal>
    </div>
</template>
<script lang="ts">
    import Vue from "vue"
    import TreeSelect from '@riophae/vue-treeselect'
    import {mapStateProp} from "../../utils";
    import {RootState} from "../../root";
    import Modal from "../Modal.vue";

    interface Methods {
        importDataset: () => void
        toggleModal: () => void
    }

    interface Computed {
        datasets: any[]
        datasetOptions: any[]
    }

    export default Vue.extend<{ open: boolean }, Methods, Computed, {}>({
        data() {
            return {
                open: false
            }
        },
        components: {Modal, TreeSelect},
        computed: {
            datasets: mapStateProp<RootState, any[]>(null,
                (state: RootState) => state.adrDatasets),
            datasetOptions() {
                return this.datasets.map(d => ({
                    id: d.id,
                    label: d.title,
                    customLabel: `${d.title}
                        <div class="text-muted small" style="margin-top:-5px; line-height: 0.8rem">
                            (${d.name})<br/>
                            <span class="font-weight-bold">${d.organization.title}</span>
                        </div>`
                }))
            }
        },
        methods: {
            importDataset() {
                // set loading spinner
                // set selected dataset in store
                // import each file
                // await all
                // stop loading spinner & close modal
            },
            toggleModal() {
                this.open = !this.open;
            }
        }
    })
</script>