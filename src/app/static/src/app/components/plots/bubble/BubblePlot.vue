<template>
    <div>
        <l-map ref="map" style="height: 800px; width: 100%">
            <template v-for="feature in features">
                <l-geo-json ref=""
                            :geojson="feature"
                            :optionsStyle="style">
                </l-geo-json>
            </template>
            <l-circle v-for="(feature, index) in features" :lat-lng="[feature.properties.center_y, feature.properties.center_x]"
                      :key="index"
                      :radius="getRadius(feature)"
                      :fill-opacity="1"
                      :color="getColor(feature)"
                      :fill-color="getColor(feature)">
            </l-circle>
        </l-map>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {Feature} from "geojson";
    import {LGeoJson, LMap, LCircle} from "vue2-leaflet";
    import {GeoJSON} from "leaflet";
    import {ChoroplethIndicatorMetadata} from "../../../generated";
    import {getFeatureIndicators} from "./utils";
    import {BubbleIndicatorValuesDict, Dict} from "../../../types";

    interface Props {
        features: Feature[],
        indicators: ChoroplethIndicatorMetadata[],
        chartdata: any[]
    }

    interface Data {
        style: any,
        colorIndicator: string,
        sizeIndicator: string
    }

    interface Methods {
        updateBounds: () => void,
        getRadius: (feature: Feature) => number,
        getColor: (feature: Feature) => string
    }

    interface Computed {
        featureIndicators: Dict<BubbleIndicatorValuesDict>
    }

    const props = {
        features: {
            type: Array,
        },
        indicators: {
            type: Array
        },
        chartdata: {
            type: Array
        }
    };

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: "BubblePlot",
        components: {
            LMap,
            LGeoJson,
            LCircle
        },
        props: props,
        data(): Data {
            return {
                style: {
                    weight: 1,
                    fillOpacity: 1.0,
                    color: 'grey',
                    fillColor: 'rgb(200,200,200)'
                },
                //TODO: initialise these from metadata
                colorIndicator: "prevalence",
                sizeIndicator: "plhiv"
            }
        },
        computed: {
            featureIndicators() {
                return getFeatureIndicators(
                    this.chartdata,
                    this.features, //TODO: pass selected features only
                    this.indicators,
                    10000, //min radius in metres (TODO: should come from metadata)
                    100000 //max radius
                );
            }
        },
        methods: {
            updateBounds: function() {
                const map = this.$refs.map as LMap;
                if (map && map.fitBounds) {
                    map.fitBounds(this.features.map((f: Feature) => new GeoJSON(f).getBounds()) as any);
                }
            },
            getRadius: function(feature: Feature) {
                return this.featureIndicators[feature.properties!!.area_id][this.sizeIndicator].size;
            },
            getColor: function(feature: Feature) {
                return this.featureIndicators[feature.properties!!.area_id][this.colorIndicator].color;
            }
        },
        mounted() {
            this.updateBounds();
        }
    });
</script>