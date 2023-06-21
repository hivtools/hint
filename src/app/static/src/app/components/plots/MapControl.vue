<template>
    <l-control position="topright">
        <div style="width: 265px;" class="p-3 map-control">
            <form>
                <div v-if="showIndicators" class="row form-group">
                    <label class="col-3 col-form-label" v-translate="'indicator'">
                    </label>
                    <!-- The indicator model-value was not updating when the
                    indicator options were changing so added indicator options
                    as key to force re-render -->
                    <div class="col" :key="JSON.stringify(indicatorOptions)">
                        <treeselect  :model-value="indicator"
                                     :multiple="false"
                                     :clearable="false"
                                     :searchable="false"
                                     :options="indicatorOptions"
                                     @update:model-value="indicatorChanged"></treeselect>
                    </div>
                </div>
                <div class="row form-group">
                    <label class="col-3 col-form-label" v-translate="'detail'">
                    </label>
                    <div class="col">
                        <treeselect  :model-value="detail"
                                     :multiple="false"
                                     :clearable="false"
                                     :searchable="false"
                                     :options="detailOptions"
                                     @update:model-value="detailChanged"></treeselect>
                    </div>
                </div>
            </form>
        </div>
    </l-control>
</template>

<script lang="ts">
    import {defineComponentVue2WithProps} from "../../defineComponentVue2/defineComponentVue2"
    import Treeselect from "vue3-treeselect"
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
            Treeselect,
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