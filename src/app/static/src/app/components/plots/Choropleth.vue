<template>
    <l-map ref="map" style="height: 800px; width: 100%">
        <template v-for="feature in currentFeatures">
            <l-geo-json ref=""
                        :geojson="feature"
                        :options="options"
                        :optionsStyle="{...style, fillColor: getColorForRegion(feature.properties['area_id'])}">
            </l-geo-json>
        </template>
        <map-control :initialDetail=detail
                     @indicator-changed="onIndicatorChange"
                     @detail-changed="onDetailChange"
                     :indicator="indicator"></map-control>
        <map-legend :colorFunction="selectedColorFunction" :max="range.max" :min="range.min"></map-legend>
    </l-map>
</template>
<script lang="ts">
    import Vue from "vue";
    import {LGeoJson, LMap} from 'vue2-leaflet';
    import {Feature} from "geojson";
    import {GeoJSON, Layer} from "leaflet";
    import MapControl from "./MapControl.vue";
    import MapLegend from "./MapLegend.vue";
    import {Dict, Indicator, IndicatorRange, Indicators, LevelLabel} from "../../types";
    import {DataType, FilteredDataState} from "../../store/filteredData/filteredData";
    import {NestedFilterOption} from "../../generated";
    import {mapGettersByNames, mapStateProps} from "../../utils";
    import {BaselineState} from "../../store/baseline/baseline";

    interface Data {
        style: any,
        indicator: Indicator;
        detail: number
    }

    interface BaselineComputed {
        features: Feature[]
        countryRegion: unknown
        featureLevels: LevelLabel[]
    }

    interface FilteredDataComputed {
        selectedDataType: DataType | null
        selectedRegions: NestedFilterOption[]
    }

    interface FilteredDataGetters {
        regionIndicators: Dict<Indicators>
        colorFunctions: Dict<(t: number) => string>
        choroplethRanges: Dict<IndicatorRange>
    }

    interface Computed extends BaselineComputed, FilteredDataComputed, FilteredDataGetters {
        countryFeature: Feature
        maxLevel: number
        featuresByLevel: Dict<Feature[]>
        currentFeatures: Feature[]
        selectedColorFunction: (t: number) => string
        range: IndicatorRange
        options: L.GeoJSONOptions
        artEnabled: boolean
        prevEnabled: boolean
        selectedRegionFeatures: Feature[]
    }

    interface Methods {
        onIndicatorChange: (newVal: Indicator) => void
        onDetailChange: (newVal: number) => void
        getColorForRegion: (region: string) => void
        getFeatureFromAreaId: (areaId: string) => Feature | null
        updateBounds: () => void
    }

    export default Vue.extend<Data, Methods, Computed, {}>({
        name: 'Choropleth',
        components: {
            LMap,
            LGeoJson,
            MapLegend,
            MapControl
        },
        computed: {
            ...mapStateProps<BaselineState, keyof BaselineComputed>("baseline",
                {
                    features: state => state.shape!!.data.features as Feature[],
                    countryRegion: state => state.shape!!.filters.regions,
                    featureLevels: state => state.shape!!.filters.level_labels || []
                }
            ),
            ...mapStateProps<FilteredDataState, keyof FilteredDataComputed>("filteredData",
                {
                    selectedDataType: state => state.selectedDataType,
                    selectedRegions: state => state.selectedChoroplethFilters.regions || []
                }
            ),
            ...mapGettersByNames<keyof FilteredDataGetters>("filteredData",
                ["regionIndicators", "colorFunctions", "choroplethRanges"]),
            countryFeature: function (): Feature {
                return this.getFeatureFromAreaId((this.countryRegion as NestedFilterOption).id)!!;
            },
            maxLevel: function () {
                const levelNums: number[] = Object.keys(this.featuresByLevel).map(k => parseInt(k));
                return Math.max(...levelNums);
            },
            featuresByLevel: function () {
                const result = {} as any;
                this.featureLevels.forEach((l: any) => {
                    if (l.display) {
                        result[l.id] = [];
                    }
                });

                this.features.forEach((feature: Feature) => {
                    const areas = feature.properties!!["area_id"].split(".");
                    const adminLevel = areas.length - 1;  //Country (e.g. "MWI") is level 0
                    if (result[adminLevel]) {
                        result[adminLevel].push(feature);
                    }
                });

                return result;
            },
            currentFeatures: function () {
                return this.featuresByLevel[this.detail]
            },
            selectedColorFunction: function () {
                return this.colorFunctions[this.indicator];
            },
            range: function () {
                return this.choroplethRanges[this.indicator];
            },
            prevEnabled: function () {
                return this.selectedDataType != DataType.Program;
            },
            artEnabled: function () {
                return this.selectedDataType == DataType.Survey || this.selectedDataType == DataType.Program;
            },
            options: function () {
                const regionIndicators = this.regionIndicators;
                const indicator = this.indicator;
                return {
                    onEachFeature: function onEachFeature(feature: Feature, layer: Layer) {
                        const area_id = feature.properties && feature.properties["area_id"];
                        const area_name = feature.properties && feature.properties["area_name"];

                        const values = regionIndicators[area_id];
                        let value = values && values[indicator] && values[indicator]!!.value;

                        layer.bindPopup(`<div>
                                <strong>${area_name}</strong>
                                <br/>${value || ""}
                            </div>`);
                    }
                }
            },
            selectedRegionFeatures: function (): Feature[] {
                if (this.selectedRegions && this.selectedRegions.length > 0) {
                    return this.selectedRegions.map((r: NestedFilterOption) => this.getFeatureFromAreaId(r.id)!!);
                } else if (this.countryFeature) {
                    return [this.countryFeature];
                }
                return [];
            }
        },
        data(): Data {
            return {
                style: {
                    weight: 1,
                    fillOpacity: 1.0,
                    color: 'grey'
                },
                indicator: "prev",
                detail: 0
            }
        },
        created() {
            this.detail = this.maxLevel
        },
        mounted() {
            this.updateBounds();
        },
        methods: {
            onIndicatorChange: function (newVal: Indicator) {
                this.indicator = newVal;
            },
            onDetailChange: function (newVal: number) {
                this.detail = newVal
            },
            getColorForRegion: function (region: string) {
                const regionIndicators = this.regionIndicators[region];
                const indicator = regionIndicators && regionIndicators[this.indicator];
                let color = indicator && indicator.color;

                if (!color) {
                    //show a lighter grey than the outlines if no data
                    //so unselected regions are still distinguishable
                    color = "rgb(200,200,200)";
                }

                return color;
            },
            getFeatureFromAreaId(areaId: string): Feature {
                return this.features.find((f: Feature) => f.properties!!.area_id == areaId)!!;
            },
            updateBounds: function () {
                const map = this.$refs.map as LMap;
                if (map && map.fitBounds) {
                    map.fitBounds(this.selectedRegionFeatures.map((f: Feature) => new GeoJSON(f).getBounds()) as any);
                }
            }
        },
        watch: {
            selectedDataType: function (newVal) {
                //Update indicator to one which is enabled if required
                if (!this.prevEnabled && this.artEnabled && this.indicator == "prev") {
                    this.indicator = "art";
                } else if (!this.artEnabled && this.prevEnabled && this.indicator == "art") {
                    this.indicator = "prev";
                }
            },
            selectedRegionFeatures: function (newVal) {
                this.updateBounds();
            }
        },
    })
</script>
