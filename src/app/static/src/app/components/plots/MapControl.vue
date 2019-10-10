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
                                     :searchable="false"
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
                                     :searchable="false"
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
    import {BaselineState} from "../../store/baseline/baseline";

    interface Data {
        detail: any;
        optionsLoaded: boolean;
    }

    const namespace = "metadata";

    export default Vue.extend<Data, any, any, any>({
        name: 'MapControl',
        components: {
            TreeSelect,
            LControl
        },
        props: {
            indicator: String,
            initialDetail: Number
        },
        data(): Data {
            return {
                optionsLoaded: false,
                detail: this.initialDetail
            }
        },
        computed: {
            ...mapState<FilteredDataState>("filteredData", {
                selectedDataType: state => state.selectedDataType
            }),
            ...mapState<BaselineState>("baseline", {
                detailOptions: state => {
                    const levels = state.shape && state.shape.filters && state.shape.filters.level_labels ?
                                    state.shape.filters.level_labels : [];

                    return levels.filter(l => l.display).map(l => {
                        return {id: l.id, label: l.area_level_label}
                    });
                }
            }),
            ...mapGetters(namespace, ["choroplethIndicatorsMetadata"]),
            indicatorOptions: function() {

                const result = [];

                if (this.choroplethIndicatorsMetadata) {
                    //TODO: Remove harcoded knowledge of which indicators should exist, and just accept all indicators
                    if (this.choroplethIndicatorsMetadata.prevalence) {
                        result.push({id: "prev", label: this.choroplethIndicatorsMetadata.prevalence.name});
                    }

                    if (this.selectedDataType != DataType.Output) { //TODO: only accepting prevalence for output for now
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