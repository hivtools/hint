<template>
    <l-map ref="map" style="height: 800px; width: 100%">

        <template>
            <l-geo-json ref="selectedRegionsGeoJson" v-for="selectedRegionFeature in selectedRegionFeatures"
                        :key="selectedRegionFeature.properties.area_id"
                        :geojson="selectedRegionFeature"
                        class="selectedRegionFeature"
                        :optionsStyle="{...style, fillColor: 'rgba(0,0,0,0)'}">
            </l-geo-json>
        </template>

        <template v-for="feature in currentFeatures">
            <l-geo-json ref=""
                        :geojson="feature"
                        :options="options"
                        :optionsStyle="{...style, fillColor: getColorForRegion(feature.properties['area_id'])}">
            </l-geo-json>
        </template>
        <map-control @indicator-changed="onIndicatorChange"
                     @detail-changed="onDetailChange"
                     :indicator="indicator"
                    :artEnabled="artEnabled" :prevEnabled="prevEnabled"></map-control>
        <map-legend :colorFunction="selectedColorFunction" :max="range.max" :min="range.min"></map-legend>
    </l-map>
</template>
<script lang="ts">
    import Vue from "vue";
    import {mapGetters, mapState} from "vuex";
    import {LGeoJson, LMap} from 'vue2-leaflet';
    import {Feature} from "geojson";
    import {Layer, Bounds, bounds} from "leaflet";
    import MapControl from "./MapControl.vue";
    import MapLegend from "./MapLegend.vue";
    import {Indicator} from "../../types";
    import {BaselineState} from "../../store/baseline/baseline";
    import {DataType, FilteredDataState} from "../../store/filteredData/filteredData";

    interface Data {
        featuresByLevel: { [k: number]: any },
        style: any,
        indicator: Indicator;
        detail: number
    }

    export default Vue.extend<Data, any, any, any>({
        name: 'Choropleth',
        components: {
            LMap,
            LGeoJson,
            MapLegend,
            MapControl
        },
        computed: {
            ...mapState<BaselineState>("baseline", {
                features: state => state.shape && state.shape.data.features,
                countryFeature: function(state) {
                    if (state.shape && state.shape.filters && state.shape.filters.regions) {
                        const countryRegion = state.shape && state.shape.filters && state.shape.filters.regions as any;
                        return this.getFeatureFromAreaId(countryRegion.id);
                    }
                    return null;
                }
            }),
            ...mapState<FilteredDataState>("filteredData", {
                selectedDataType: state => state.selectedDataType,
                selectedRegions: state => state.selectedChoroplethFilters.regions
            }),
            ...mapGetters('filteredData', ["regionIndicators", "colorFunctions", "choroplethRanges"]),
            currentFeatures: function () {
                return this.featuresByLevel[this.detail || 1]
            },
            selectedColorFunction: function () {
                return this.colorFunctions[this.indicator];
            },
            range: function() {
                return this.choroplethRanges[this.indicator];
            },
            prevEnabled: function() {
                return this.selectedDataType != DataType.Program;
            },
            artEnabled: function() {
                return this.selectedDataType == DataType.Survey || this.selectedDataType == DataType.Program;
            },
            options: function() {
                const regionIndicators = this.regionIndicators;
                const indicator = this.indicator;
                return {
                    onEachFeature: function onEachFeature(feature: Feature, layer: Layer) {
                        const area_id = feature.properties && feature.properties["area_id"];
                        const area_name = feature.properties && feature.properties["area_name"];

                        const values = regionIndicators[area_id];
                        let value = values && values[indicator] && values[indicator].value;
                        if (value == null || value == undefined) {
                            value = "";
                        }
                        layer.bindPopup(`<div>
                                <strong>${area_name}</strong>
                                <br/>${value}
                            </div>`);
                    }
                }
            },
            selectedRegionFeatures: function() {
                if (this.selectedRegions && this.selectedRegions.length > 0) {
                    return (this.selectedRegions as any[]).map(r => this.getFeatureFromAreaId(r.id));
                } else if (this.countryFeature) {
                    return [this.countryFeature];
                }
                return [];
            }
        },
        data(): Data {
            return {
                featuresByLevel: {1: [], 2: [], 3: [], 4: [], 5: [], 6: []},
                style: {
                    weight: 1,
                    fillOpacity: 1.0,
                    color: 'grey'
                },
                indicator: "prev",
                detail: 5
            }
        },
        created() {
            this.features.forEach((feature: Feature) => {
                const areas = feature.properties!!["area_id"].split(".");
                const adminLevel = areas.length;
                this.featuresByLevel[adminLevel].push(feature);
            });
            this.updateBounds();
        },
        methods: {
            onIndicatorChange: function (newVal: string) {
                this.indicator = newVal;
            },
            onDetailChange: function (newVal: number) {
                this.detail = newVal
            },
            getColorForRegion: function (region: string) {
                let data = this.regionIndicators[region];
                data = data && data[this.indicator];
                data = data && data.color;

                if (data == null || data == undefined) {
                    //show a lighter grey than the outlines if no data
                    //so unselected regions are still distinguishable
                    data = "rgb(200,200,200)";
                }

                return data;
            },
            getFeatureFromAreaId(areaId: string){
                return (this.features as any[]).filter(f => f.properties.area_id == areaId)[0];
            },
            updateBounds(){
                Vue.nextTick().then(() => {
                    const geoJsonArray = this.$refs.selectedRegionsGeoJson;

                    let combinedBounds = null;
                    if (geoJsonArray) {
                        for (const geoJson of geoJsonArray) {
                            if (geoJson.getBounds) {
                                const regionBounds = geoJson.getBounds();
                                if (combinedBounds) {
                                    combinedBounds.extend(regionBounds);
                                } else {
                                    combinedBounds = regionBounds;
                                }
                            }
                        }

                        if (combinedBounds) {
                            const map = this.$refs.map;
                            map.fitBounds(combinedBounds);
                        }
                    }

                });
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
