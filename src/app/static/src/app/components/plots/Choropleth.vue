<template>
    <l-map ref="map" style="height: 800px; width: 100%">
        <template v-for="feature in currentFeatures">
            <l-geo-json ref=""
                        :optionsStyle="{fillColor: getColorForRegion(feature.id)}"
                        :geojson="feature.feature"
                        :options="options">
            </l-geo-json>
        </template>
        <map-control :initialDetail=detail
                     @indicator-changed="onIndicatorChange"
                     @detail-changed="onDetailChange"
                     :indicator="indicator"></map-control>
        <map-legend :metadata="indicatorMetadata"></map-legend>
    </l-map>
</template>
<script lang="ts">
    import Vue from "vue";
    import {LGeoJson, LMap} from 'vue2-leaflet';
    import {Feature} from "geojson";
    import {GeoJSON, Layer} from "leaflet";
    import MapControl from "./MapControl.vue";
    import MapLegend from "./MapLegend.vue";
    import {BaselineState} from "../../store/baseline/baseline";
    import {DataType, FilteredDataState, SelectedChoroplethFilters} from "../../store/filteredData/filteredData";
    import {IndicatorMetadata, NestedFilterOption} from "../../generated";
    import {Dict, LevelLabel} from "../../types";
    import {mapGettersByNames, mapStateProps} from "../../utils";
    import {getRegionIndicators} from "./choroplethData";

    interface Data {
        indicator: string | null;
        detail: number;
        options: L.GeoJSONOptions;
        getColorForRegion: (regionId: string) => string;
    }

    interface BaselineComputed {
        features: Feature[]
        countryRegion: unknown
        featureLevels: LevelLabel[]
    }

    interface FilteredDataComputed {
        selectedDataType: DataType | null
        selectedFilters: SelectedChoroplethFilters
    }

    interface MetadataGetters {
        choroplethIndicators: string[],
        choroplethIndicatorsMetadata: IndicatorMetadata[]
    }

    interface Computed extends BaselineComputed, FilteredDataComputed, MetadataGetters {
        countryFeature: Feature
        maxLevel: number
        featuresByLevel: Dict<Feature[]>
        currentFeatures: Feature[]
        selectedRegionFeatures: Feature[],
        indicatorMetadata: IndicatorMetadata
    }

    interface Methods {
        onIndicatorChange: (newVal: string) => void
        onDetailChange: (newVal: number) => void
        getFeatureFromAreaId: (areaId: string) => Feature | null
        updateBounds: () => void,
        refreshIndicator: () => void
        updateRegionIndicators: () => void
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
            ...mapStateProps<BaselineState, keyof BaselineComputed>("baseline", {
                    features: state => state.shape!!.data.features as Feature[],
                    countryRegion: state => state.shape!!.filters.regions,
                    featureLevels: state => state.shape!!.filters.level_labels || []
                }
            ),
            ...mapStateProps<FilteredDataState, keyof FilteredDataComputed>("filteredData", {
                    selectedDataType: state => state.selectedDataType,
                    selectedFilters: state => state.selectedChoroplethFilters
                }
            ),
            ...mapGettersByNames<keyof MetadataGetters>("metadata", [
                    "choroplethIndicators",
                    "choroplethIndicatorsMetadata"
                ]
            ),
            countryFeature(): Feature {
                return this.getFeatureFromAreaId((this.countryRegion as NestedFilterOption).id)!!;
            },
            maxLevel() {
                const levelNums: number[] = Object.keys(this.featuresByLevel).map(k => parseInt(k));
                return Math.max(...levelNums);
            },
            featuresByLevel() {
                const result = {} as any;
                this.featureLevels.forEach((l: any) => {
                    if (l.display) {
                        result[l.id] = [];
                    }
                });

                this.features.forEach((feature: Feature) => {
                    const id = feature.properties!!["area_id"];
                    const areas = id.split(".");
                    const adminLevel = areas.length - 1;  //Country (e.g. "MWI") is level 0
                    if (result[adminLevel]) {
                        result[adminLevel].push({id, feature});
                    }
                });

                return result;
            },
            currentFeatures() {
                return this.featuresByLevel[this.detail]
            },
            indicatorMetadata: function () {
                return this.choroplethIndicatorsMetadata.filter((i: IndicatorMetadata) => i.indicator == this.indicator)[0];
            },
            selectedRegionFeatures(): Feature[] {
                if (this.selectedFilters.regions.length > 0) {
                    return this.selectedFilters.regions.map((id: string) => this.getFeatureFromAreaId(id)!!);
                }
                return [this.countryFeature];
            }
        },
        data(): Data {
            return {
                indicator: "",
                detail: 0,
                options: {},
                getColorForRegion: () => ""
            }
        },
        created() {
            this.detail = this.maxLevel;
            this.refreshIndicator();
        },
        mounted() {
            this.updateRegionIndicators();
            this.updateBounds();
        },
        methods: {
            onIndicatorChange: function (newVal: string) {
                this.indicator = newVal;
                this.updateRegionIndicators();
            },
            onDetailChange: function (newVal: number) {
                this.detail = newVal;
                this.updateRegionIndicators();
            },
            getFeatureFromAreaId(areaId: string): Feature {
                return this.features.find((f: Feature) => f.properties!!.area_id == areaId)!!;
            },
            updateBounds: function () {
                const map = this.$refs.map as LMap;
                if (map && map.fitBounds) {
                    map.fitBounds(this.selectedRegionFeatures.map((f: Feature) => new GeoJSON(f).getBounds()) as any);
                }
            },
            refreshIndicator: function () {
                if (!this.indicator || this.choroplethIndicators.indexOf(this.indicator) < 0) {
                    this.indicator = this.choroplethIndicators.length > 0 ? this.choroplethIndicators[0] : null;
                }
            },
            updateRegionIndicators() {
                const regionIndicators = getRegionIndicators(this.$store.state, this.indicatorMetadata);
                this.options = {
                    onEachFeature: function onEachFeature(feature: Feature, layer: Layer) {
                        const area_id = feature.properties && feature.properties["area_id"];
                        const area_name = feature.properties && feature.properties["area_name"];

                        const values = regionIndicators[area_id];
                        let value = values && values.value;
                        const stringVal = (value || value === 0) ? value.toString() : "";

                        layer.bindPopup(`<div>
                                <strong>${area_name}</strong>
                                <br/>${stringVal}
                            </div>`);
                    }
                };

                this.getColorForRegion = (region: string) => {
                    const indicator = regionIndicators[region];
                    return indicator ? indicator.color : "rgb(200,200,200)";
                };
            }
        },
        watch: {
            selectedDataType: function () {
                this.refreshIndicator();
                this.updateRegionIndicators();
            },
            selectedRegionFeatures: function () {
                this.updateBounds();
                this.updateRegionIndicators();
            },
            selectedFilters: {
                handler: function () {
                    this.updateRegionIndicators();
                },
                deep: true
            }
        },
    })
</script>
