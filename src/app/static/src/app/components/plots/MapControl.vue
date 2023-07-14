<template>
    <l-control position="topright">
        <div style="width: 265px;" class="p-3 map-control">
            <form>
                <div v-if="showIndicators" class="row form-group">
                    <label class="col-3 col-form-label" v-translate="'indicator'">
                    </label>
                    <div class="col">
                        <hint-tree-select :model-value="indicator"
                                     :multiple="false"
                                     :clearable="false"
                                     :searchable="false"
                                     :options="indicatorOptions"
                                     @update:model-value="indicatorChanged"></hint-tree-select>
                    </div>
                </div>
                <div class="row form-group">
                    <label class="col-3 col-form-label" v-translate="'detail'">
                    </label>
                    <div class="col">
                        <hint-tree-select :model-value="detail"
                                     :multiple="false"
                                     :clearable="false"
                                     :searchable="false"
                                     :options="detailOptions"
                                     @update:model-value="detailChanged"></hint-tree-select>
                    </div>
                </div>
            </form>
        </div>
    </l-control>
</template>

<script lang="ts">
    import {defineComponentVue2WithProps} from "../../defineComponentVue2/defineComponentVue2"
    import HintTreeSelect from "../HintTreeSelect.vue";
    import {LControl} from "@vue-leaflet/vue-leaflet";
    import {ChoroplethIndicatorMetadata} from "../../generated";
    import {LevelLabel} from "../../types";

    interface Data {
        detail: any;
        optionsLoaded: boolean;
    }

    interface Props {
        indicator?: string,
        initialDetail?: number,
        showIndicators: boolean,
        indicatorsMetadata?: ChoroplethIndicatorMetadata[],
        levelLabels: LevelLabel[]
    }

    interface Option {
        id: any;
        label: string;
    }

    interface Computed {
        detailOptions: Option[]
        indicatorOptions: Option[]
    }

    interface Methods {
        indicatorChanged: (newVal: string) => void;
        detailChanged: (newVal: number) => void;
    }

    export default defineComponentVue2WithProps<Data, Methods, Computed, Props>({
        name: 'MapControl',
        components: {
            HintTreeSelect,
            LControl
        },
        props: {
            indicator: {
                type: String,
                required: false
            },
            initialDetail: {
                type: Number,
                required: false
            },
            showIndicators: {
                type: Boolean,
                required: true
            },
            indicatorsMetadata: {
                type: Array,
                required: false
            },
            levelLabels: {
                type: Array,
                required: true
            }
        },
        data(): Data {
            return {
                optionsLoaded: false,
                detail: this.initialDetail
            }
        },
        computed: {
            detailOptions: function () {
                return this.levelLabels.filter(l => l.display).map(l => {
                    return {id: l.id, label: l.area_level_label}
                });
            },
            indicatorOptions: function () {
                if (this.indicatorsMetadata) {
                    return this.indicatorsMetadata.map((i: ChoroplethIndicatorMetadata) => {
                        return {id: i.indicator, label: i.name};
                    });
                } else {
                    return []
                }
            }
        },
        methods: {
            indicatorChanged: function (newVal: string) {
                this.$emit("indicatorChanged", newVal);
            },
            detailChanged: function (newVal: number) {
                this.$emit("detailChanged", newVal);
            }
        }
    });
</script>