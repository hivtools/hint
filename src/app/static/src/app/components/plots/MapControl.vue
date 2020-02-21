<template>
    <l-control position="topright">
        <div style="width: 265px;" class="p-3 map-control">
            <form>
                <div v-if="showIndicators" class="row form-group">
                    <label class="col-3 col-form-label" v-translate="'indicator'">
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
                    <label class="col-3 col-form-label" v-translate="'detail'">
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
    import {BaselineState} from "../../store/baseline/baseline";
    import {ChoroplethIndicatorMetadata} from "../../generated";
    import {mapGetterByName, mapStateProp} from "../../utils";
    import {LevelLabel} from "../../types";

    interface Data {
        detail: any;
        optionsLoaded: boolean;
    }

    interface Props {
        indicator: string,
        initialDetail: number,
        showIndicators: boolean,
        indicatorsMetadata: ChoroplethIndicatorMetadata[]
    }

    interface Option {
        id: any;
        label: string;
    }

    interface Computed {
        detailOptions: Option[]
        indicatorOptions: Option[]
        indicators: string[]
    }

    interface Methods {
        indicatorChanged: (newVal: string) => void;
    }

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: 'MapControl',
        components: {
            TreeSelect,
            LControl
        },
        props: {
            indicator: String,
            initialDetail: Number,
            showIndicators: Boolean,
            indicatorsMetadata: Array
        },
        data(): Data {
            return {
                optionsLoaded: false,
                detail: this.initialDetail
            }
        },
        computed: {
            indicators: function() {
                return this.indicatorsMetadata.map((i: ChoroplethIndicatorMetadata) => i.indicator);
            },
            detailOptions: mapStateProp<BaselineState, Option[]>("baseline", state => {
                let levels: LevelLabel[] = [];
                if (state.shape && state.shape.filters && state.shape.filters.level_labels) {
                    levels = state.shape.filters.level_labels;
                }

                return levels.filter(l => l.display).map(l => {
                    return {id: l.id, label: l.area_level_label}
                });
            }),
            indicatorOptions: function() {
                return this.indicatorsMetadata.map((i: ChoroplethIndicatorMetadata) => { return {id: i.indicator, label: i.name}; });
            }
        },
        methods: {
            indicatorChanged: function (newVal: string) {
                this.$emit("indicator-changed", newVal);
            }
        }
    });
</script>