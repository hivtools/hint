<template>
    <div class="row">
        <h3>Filters</h3>
        <div :id="'filter-' + filter.id" v-for="filter in filters" class="form-group">
            <filter-select :value="getSelectedFilterOptions(filter.id)"
                           :is-disaggregate-by="false"
                           :is-x-axis="false"
                           :label="filter.label"
                           :options="filter.options"
                           @input="onFilterChange(filter.id, $event)"></filter-select>
        </div>
        <div id="chart" class="col-md-9">
            <l-map ref="map" style="height: 800px; width: 100%">
                <template v-for="feature in currentFeatures">
                    <l-geo-json ref=""
                                :geojson="feature"
                                :optionsStyle="style">
                    </l-geo-json>
                    <l-circle-marker :lat-lng="[feature.properties.center_y, feature.properties.center_x]"
                              :radius="getRadius(feature)"
                              :fill-opacity="0.75"
                              :opacity="0.75"
                              :color="getColor(feature)"
                              :fill-color="getColor(feature)">
                        <l-tooltip :content="getTooltip(feature)"/>
                    </l-circle-marker>
                </template>
                <map-control :initialDetail=selections.detail
                             :show-indicators="false"
                             @detail-changed="onDetailChange"></map-control>
            </l-map>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {Feature} from "geojson";
    import {LGeoJson, LMap, LCircleMarker, LTooltip} from "vue2-leaflet";
    import MapControl from "../MapControl.vue";
    import {GeoJSON, Layer} from "leaflet";
    import {ChoroplethIndicatorMetadata, FilterOption} from "../../../generated";
    import {getFeatureIndicators, toIndicatorNameLookup} from "./utils";
    import {BubbleIndicatorValuesDict, Dict, Filter, LevelLabel} from "../../../types";
    import {BubblePlotSelections} from "../../../store/plottingSelections/plottingSelections";

    interface Props {
        features: Feature[],
        featureLevels: LevelLabel[]
        indicators: ChoroplethIndicatorMetadata[],
        chartdata: any[],
        filters: Filter[],
        selections: BubblePlotSelections
    }

    interface Data {
        style: any,
        //TODO: persist these as part of selections
        colorIndicator: string,
        sizeIndicator: string
    }

    interface Methods {
        updateBounds: () => void,
        getRadius: (feature: Feature) => number,
        getColor: (feature: Feature) => string,
        getTooltip: (feature: Feature) => string,
        onDetailChange: (newVal: number) => void,
        onFilterChange: (filterId: any, selectedOptions: any) => void
    }

    interface Computed {
        featureIndicators: Dict<BubbleIndicatorValuesDict>,
        featuresByLevel: { [k: number]: Feature[] },
        currentFeatures: Feature[],
        maxLevel: number,
        indicatorNameLookup: Dict<string>
    }

    const props = {
        features: {
            type: Array
        },
        featureLevels: {
            type: Array
        },
        indicators: {
            type: Array
        },
        chartdata: {
            type: Array
        },
        filters: {
            type: Array
        },
        selections: {
            type: Object
        }
    };

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: "BubblePlot",
        components: {
            LMap,
            LGeoJson,
            LCircleMarker,
            LTooltip,
            MapControl
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
                    this.currentFeatures,
                    this.indicators,
                    10, //min radius in pixels (TODO: should come from metadata)
                    10000 //max radius
                );
            },
            featuresByLevel() {
                //TODO: this is shared with choropleth, could move into utils file or Mixin
                const result = {} as any;
                this.featureLevels.forEach((l: any) => {
                    if (l.display) {
                        result[l.id] = [];
                    }
                });

                this.features.forEach((feature: Feature) => {
                    const adminLevel = parseInt(feature.properties!!["area_level"]); //Country (e.g. "MWI") is level 0
                    if (result[adminLevel]) {
                        result[adminLevel].push(feature);
                    }
                });

                return result;
            },
            maxLevel() {
                //TODO: this is shared with choropleth, could move into utils file or Mixin
                const levelNums: number[] = Object.keys(this.featuresByLevel).map(k => parseInt(k));

                return Math.max(...levelNums);
            },
            currentFeatures() {
                return this.featuresByLevel[this.selections.detail]
            },
            indicatorNameLookup() {
                return toIndicatorNameLookup(this.indicators)
            }
        },
        methods: {
            updateBounds: function() {
                //NB This will be very inefficient until we filter to selected feature
                const map = this.$refs.map as LMap;
                if (map && map.fitBounds) {
                    map.fitBounds(this.currentFeatures.map((f: Feature) => new GeoJSON(f).getBounds()) as any);
                }
            },
            getRadius: function(feature: Feature) {
                return this.featureIndicators[feature.properties!!.area_id][this.sizeIndicator].radius;
            },
            getColor: function(feature: Feature) {
                return this.featureIndicators[feature.properties!!.area_id][this.colorIndicator].color;
            },
            getTooltip: function(feature: Feature) {
                const area_id = feature.properties && feature.properties["area_id"];
                const area_name = feature.properties && feature.properties["area_name"];

                const values = this.featureIndicators[area_id];
                const colorValue = values && values[this.colorIndicator] && values[this.colorIndicator]!!.value;
                const sizeValue = values && values[this.sizeIndicator] && values[this.sizeIndicator]!!.value;

               const colorIndicatorName = this.indicatorNameLookup[this.colorIndicator];
               const sizeIndicatorName = this.indicatorNameLookup[this.sizeIndicator];
               return `<div>
                                <strong>${area_name}</strong>
                                <br/>${colorIndicatorName}: ${colorValue}
                                <br/>${sizeIndicatorName}: ${sizeValue}
                            </div>`;
            },
            onDetailChange: function (newVal: number) {
                //TODO: emit selections changed event rather than mutating
                this.selections.detail = newVal;
            },
            onFilterChange(filterId: any, selectedOptions: any) {
                console.log("Bubble chart filter changed: " + filterId + " " + JSON.stringify(selectedOptions));
                //TODO: update filters
                //const newSelectedFilterOptions = {...this.selections.selectedFilterOptions};
                //newSelectedFilterOptions[filterId] = selectedOptions;
                //this.changeSelections({...this.selections, selectedFilterOptions: newSelectedFilterOptions});
            },
        },
        mounted() {
            this.updateBounds();
        },
        created() {
            //If selections have not been initialised, refresh them
            // TODO: and emit changed events
            if (this.selections.detail < 0) {
                this.selections.detail = this.maxLevel;
            }

            if (Object.keys(this.selections.selectedFilterOptions).length < 1) {
                this.selections.selectedFilterOptions = this.filters.reduce((obj: any, current: Filter) => {
                    obj[current.id] = [current.options[0]];
                    return obj;
                }, {} as Dict<FilterOption[]>);
            }
        },
    });
</script>