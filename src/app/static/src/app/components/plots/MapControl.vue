<template>
    <l-control position="topright">
        <div style="width: 250px;" class="p-3 map-control">
            <form>
                <div class="row form-group">
                    <label class="col-3 col-form-label">
                        Indicator:
                    </label>
                    <div class="col">
                        <tree-select :value="indicator"
                                     :multiple="false"
                                     :clearable="false"
                                     :options="indicatorOptions"
                                     @input="indicatorChanged"></tree-select>
                    </div>
                </div>
                <div class="row form-group">
                    <label class="col-3 col-form-label">
                        Detail:
                    </label>
                    <div class="col">
                        <tree-select v-model="detail"
                                     :multiple="false"
                                     :clearable="false"
                                     :options="detailOptions"
                                     @input="$emit('detail-changed', detail)"></tree-select>
                    </div>
                </div>
            </form>
        </div>
    </l-control>
</template>

<script lang="ts">
    import Vue from "vue";
    import TreeSelect from '@riophae/vue-treeselect'
    import {LControl} from 'vue2-leaflet';
    import {Indicator} from "../../types";
    import {mapGetters, mapState} from "vuex";
    import {DataType, FilteredDataState} from "../../store/filteredData/filteredData";

    interface Data {
        detail: any;
        detailOptions: any[],
        optionsLoaded: boolean
    }

    const namespace = "metadata";

    export default Vue.extend<Data, any, any, any>({
        name: 'MapControl',
        components: {
            TreeSelect,
            LControl
        },
        props: {
            indicator: String
        },
        data(): Data {
            return {
                detail: 5, // TODO this is the only level of data in the Malawi test set
                detailOptions: [
                    // TODO something cleverer with calculated admin levels and labels
                    {id: 1, label: "Country"},
                    {id: 2, label: "Admin level 2"},
                    {id: 3, label: "Admin level 3"},
                    {id: 4, label: "Admin level 4"},
                    {id: 5, label: "Admin level 5"},
                    {id: 6, label: "Admin level 6"}
                ],
                optionsLoaded: false
            }
        },
        computed: {
            ...mapState<FilteredDataState>("filteredData", {
                selectedDataType: state => state.selectedDataType
            }),
            ...mapGetters(namespace, ["choroplethIndicatorsMetadata"]),
            indicatorOptions: function() {

                const result = [];

                if (this.choroplethIndicatorsMetadata) {
                    if (this.choroplethIndicatorsMetadata.prevalence) {
                        result.push({id: "prev", label: this.choroplethIndicatorsMetadata.prevalence.name});
                    }

                    //TODO: For the moment we only support prevalence in ANC and output choro, until we revamp indicators
                    //to potentially get multiple values per row, depending on plotting metadata. Should be able to remove
                    //this data type check after this.
                    if (this.selectedDataType != DataType.Output && this.selectedDataType != DataType.ANC) {
                        if (this.choroplethIndicatorsMetadata.art_coverage) {
                            result.push({id: "art", label: this.choroplethIndicatorsMetadata.art_coverage.name});
                        } else if (this.choroplethIndicatorsMetadata.current_art) {
                            result.push({id: "art", label: this.choroplethIndicatorsMetadata.current_art.name});
                        }
                    }
                }

                return result;
            }
        },
        methods: {
            indicatorChanged: function (newVal: string) {
                this.$emit("indicator-changed", newVal);
            }
        }
    });
</script>