<template>
    <div class="row">
        <filters class="col-md-3" v-if="includeFilters"
                :filters="filtersToDisplay"
                :selectedFilterOptions="selections.selectedFilterOptions"
                @update="onFilterSelectionsChange"></filters>
        <div id="chart" :class="includeFilters ? 'col-md-9' : 'col-md-12'">
            <l-map ref="map" style="height: 800px; width: 100%">
                <template v-for="feature in currentFeatures">
                    <l-geo-json ref=""
                                :geojson="feature"
                                :options="options"
                                :optionsStyle="{...style, fillColor: getColor(feature)}">
                    </l-geo-json>
                </template>
                <map-control :initialDetail=selections.detail
                             :indicator=selections.indicatorId
                             :show-indicators="true"
                             :indicators-metadata="indicators"
                             :level-labels="featureLevels"
                             @detail-changed="onDetailChange"
                             @indicator-changed="onIndicatorChange"></map-control>
                <map-legend :metadata="colorIndicator"></map-legend>
            </l-map>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Treeselect from '@riophae/vue-treeselect';
    import {Feature} from "geojson";
    import {LGeoJson, LMap, LTooltip} from "vue2-leaflet";
    import {Layer} from "leaflet";
    import MapControl from "../MapControl.vue";
    import MapLegend from "../MapLegend.vue";
    import Filters from "../Filters.vue";
    import {GeoJSON} from "leaflet";
    import {ChoroplethIndicatorMetadata, FilterOption, NestedFilterOption} from "../../../generated";
    import {ChoroplethSelections} from "../../../store/plottingSelections/plottingSelections";
    import {toIndicatorNameLookup} from "../utils";
    import {getFeatureIndicators} from "./utils";
    import {Dict, Filter, IndicatorValuesDict, LevelLabel, NumericRange} from "../../../types";
    import {flattenOptions, flattenToIdSet} from "../../../utils";
    import {getIndicatorRanges} from "../utils";
    import {replaceAreaFilterOptionsWithCountryChildren} from "../utils";

    interface Props {
        features: Feature[],
        featureLevels: LevelLabel[]
        indicators: ChoroplethIndicatorMetadata[],
        chartdata: any[],
        filters: Filter[],
        selections: ChoroplethSelections,
        areaFilterId: string,
        includeFilters: boolean
    }

    interface Data {
        style: any
    }

    interface Methods {
        initialise: () => void,
        updateBounds: () => void,
        showColor: (feature: Feature) => boolean,
        getColor: (feature: Feature) => string,
        onDetailChange: (newVal: number) => void,
        onIndicatorChange: (newVal: string) => void,
        onFilterSelectionsChange: (newSelections: Dict<FilterOption[]>) => void,
        changeSelections: (newSelections: Partial<ChoroplethSelections>) => void,
        getFeatureFromAreaId: (id: string) => Feature,
        normalizeIndicators: (node: ChoroplethIndicatorMetadata) => any
    }

    interface Computed {
        initialised: boolean,
        indicatorRanges: Dict<NumericRange>,
        featureIndicators: Dict<IndicatorValuesDict>,
        featuresByLevel: { [k: number]: Feature[] },
        currentFeatures: Feature[],
        maxLevel: number,
        indicatorNameLookup: Dict<string>,
        areaFilter: Filter,
        nonAreaFilters: Filter[],
        selectedAreaFilterOptions: FilterOption[],
        flattenedAreas: Dict<NestedFilterOption>,
        selectedAreaFeatures: Feature[],
        countryFilterOption: FilterOption,
        countryFeature: Feature | null,
        colorIndicator: ChoroplethIndicatorMetadata,
        options: L.GeoJSONOptions
        filtersToDisplay: Filter[]
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
        },
        areaFilterId: {
            type: String
        },
        includeFilters: {
            type: Boolean
        }
    };

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: "Choropleth",
        components: {
            LMap,
            LGeoJson,
            LTooltip,
            MapControl,
            MapLegend,
            Filters,
            Treeselect
        },
        props: props,
        data(): Data {
            return {
                style: {
                    className: "geojson",
                }
            }
        },
        computed: {
            initialised() {
                const unsetFilters = this.nonAreaFilters.filter((f: Filter) => !this.selections.selectedFilterOptions[f.id]);
                return unsetFilters.length == 0 && this.selections.detail > -1 &&
                    !!this.selections.indicatorId;
            },
            indicatorRanges() {
                return getIndicatorRanges(this.chartdata, this.indicators)
            },
            featureIndicators() {
                const selectedAreaIdSet = flattenToIdSet(this.selectedAreaFilterOptions.map(o => o.id), this.flattenedAreas);
                return getFeatureIndicators(
                    this.chartdata,
                    Array.from(selectedAreaIdSet),
                    this.indicators,
                    this.indicatorRanges,
                    this.nonAreaFilters,
                    this.selections.selectedFilterOptions,
                    [this.selections.indicatorId]
                );
            },
            featuresByLevel() {
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
                const levelNums: number[] = Object.keys(this.featuresByLevel).map(k => parseInt(k));

                return Math.max(...levelNums);
            },
            currentFeatures() {
                return this.featuresByLevel[this.selections.detail]
            },
            indicatorNameLookup() {
                return toIndicatorNameLookup(this.indicators)
            },
            areaFilter() {
                return this.filters.find((f:Filter) => f.id == this.areaFilterId)!!;
            },
            nonAreaFilters() {
                return this.filters.filter((f: Filter) => f.id != this.areaFilterId);
            },
            selectedAreaFilterOptions() {
                const selectedOptions = this.selections.selectedFilterOptions[this.areaFilterId];
                if (selectedOptions && selectedOptions.length > 0) {
                    return selectedOptions
                }
                return this.countryFilterOption ? [this.countryFilterOption] : [];
            },
            flattenedAreas() {
                return flattenOptions(this.areaFilter.options);
            },
            selectedAreaFeatures(): Feature[] {
                if (this.initialised && this.selectedAreaFilterOptions && this.selectedAreaFilterOptions.length > 0) {
                    return this.selectedAreaFilterOptions.map(o => this.getFeatureFromAreaId(o.id)!!);
                }
                return [];
            },
            countryFilterOption(): FilterOption {
                return this.areaFilter.options[0]
            },
            countryFeature(): Feature | null {
                return this.countryFilterOption ? this.getFeatureFromAreaId(this.countryFilterOption.id)!! : null;
            },
            colorIndicator(): ChoroplethIndicatorMetadata {
                return this.indicators.find(i => i.indicator == this.selections.indicatorId)!!;
            },
            filtersToDisplay(): Filter[] {
                return replaceAreaFilterOptionsWithCountryChildren(this.filters, this.areaFilterId);
            },
            options() {
                const indicator = this.selections.indicatorId;
                const featureIndicators = this.featureIndicators;
                return {
                    onEachFeature: function onEachFeature(feature: Feature, layer: Layer) {
                        const area_id = feature.properties && feature.properties["area_id"];
                        const area_name = feature.properties && feature.properties["area_name"];

                        const values = featureIndicators[area_id];
                        const value = values && values[indicator] && values[indicator]!!.value;

                        const stringVal = (value || value === 0) ? value.toString() : "";
                        layer.bindTooltip(`<div>
                                <strong>${area_name}</strong>
                                <br/>${stringVal}
                            </div>`);
                    }
                }
            }
        },
        methods: {
            initialise: function() {
                if (this.selections.detail < 0) {
                    this.onDetailChange(this.maxLevel);
                }

                if (!this.selections.indicatorId || !this.indicators.some(i => i.indicator == this.selections.indicatorId)) {
                    const indicator = this.indicatorNameLookup.prevalence ? "prevalence" : this.indicators[0].indicator;
                    this.changeSelections({indicatorId: indicator});
                }

                const existingFilterSels = this.selections.selectedFilterOptions;
                const refreshSelected = this.nonAreaFilters.reduce((obj: any, current: Filter) => {
                    const currentOptionIds = current.options.map(o => o.id);
                    let newSels = existingFilterSels[current.id] ?
                        existingFilterSels[current.id].filter(o => currentOptionIds.indexOf(o.id) > -1) : [];

                    if (newSels.length == 0) {
                        newSels = current.options.length > 0 ? [current.options[0]] : [];
                    }

                    obj[current.id] = newSels;
                    return obj;
                }, {} as Dict<FilterOption[]>);
                //assume area filters remain valid
                refreshSelected[this.areaFilterId] = this.selections.selectedFilterOptions[this.areaFilterId];

                this.changeSelections({selectedFilterOptions: refreshSelected});
            },
            updateBounds: function() {
                if (this.initialised) {
                    const map = this.$refs.map as LMap;
                    if (map && map.fitBounds) {
                        map.fitBounds(this.selectedAreaFeatures.map((f: Feature) => new GeoJSON(f).getBounds()) as any);
                    }
                }
            },
            showColor(feature: Feature) {
                return !!this.featureIndicators[feature.properties!!.area_id] &&
                    !!this.featureIndicators[feature.properties!!.area_id][this.selections.indicatorId];
            },
            getColor: function(feature: Feature) {
                if (this.showColor(feature))
                {
                    return this.featureIndicators[feature.properties!!.area_id][this.selections.indicatorId].color;
                }
                else
                {
                    //show a lighter grey than the outlines if no data
                    //so unselected regions are still distinguishable
                    return "rgb(200,200,200)";
                }
            },
            onDetailChange: function (newVal: number) {
                this.changeSelections({detail: newVal});
            },
            onIndicatorChange: function(newVal: string) {
                this.changeSelections({indicatorId: newVal});
            },
            onFilterSelectionsChange(newSelections: Dict<FilterOption[]>) {
                this.changeSelections({selectedFilterOptions: newSelections});
            },
            changeSelections(newSelections: Partial<ChoroplethSelections>) {
                this.$emit("update", newSelections)
            },
            getFeatureFromAreaId(areaId: string): Feature {
                return this.features.find((f: Feature) => f.properties!!.area_id == areaId)!!;
            },
            normalizeIndicators(node: ChoroplethIndicatorMetadata) {
                return {id: node.indicator, label: node.name};
            }
        },
        watch:
            {
                initialised: function(newVal: boolean) {
                    this.updateBounds();
                },
                selectedAreaFeatures: function (newVal) {
                    this.updateBounds();
                },
                filters: function() {
                    this.initialise();
                },
                indicators: function() {
                    this.initialise();
                },
            },
        created() {
            this.initialise();
        },
        mounted(){
            this.updateBounds();
        }
    });
</script>