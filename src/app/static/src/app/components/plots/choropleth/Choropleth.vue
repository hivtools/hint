<template>
    <div class="row">
        <filters class="col-md-3" v-if="includeFilters"
                 :filters="filters"
                 :selectedFilterOptions="selections.selectedFilterOptions"
                 @update="onFilterSelectionsChange"></filters>
        <div id="chart" :class="includeFilters ? 'col-md-9' : 'col-md-12'">
            <l-map ref="map" style="height: 800px; width: 100%">
                <template v-for="feature in currentFeatures">
                    <l-geo-json ref="" :key="feature.id"
                                :geojson="feature"
                                :options="options"
                                :optionsStyle="{...style, fillColor: getColor(feature)}">
                    </l-geo-json>
                </template>
                <map-empty-feature v-if="emptyFeature"></map-empty-feature>
                <map-control :initialDetail=selections.detail
                             :indicator=selections.indicatorId
                             :show-indicators="true"
                             :indicators-metadata="indicators"
                             :level-labels="featureLevels"
                             @detail-changed="onDetailChange"
                             @indicator-changed="onIndicatorChange"></map-control>
                <map-legend :metadata="colorIndicator"
                            :colour-scale="indicatorColourScale"
                            :colour-range="colourRange"
                            @update="updateColourScale"></map-legend>
            </l-map>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {Feature} from "geojson";
    import {LGeoJson, LMap, LControl} from "vue2-leaflet";
    import {GeoJSON, Layer, GeoJSONOptions} from "leaflet";
    import MapControl from "../MapControl.vue";
    import MapLegend from "../MapLegend.vue";
    import Filters from "../Filters.vue";
    import MapEmptyFeature from "../MapEmptyFeature.vue";
    import {ChoroplethIndicatorMetadata, FilterOption, NestedFilterOption} from "../../../generated";
    import {
        ChoroplethSelections,
        ColourScaleSelections,
        ColourScaleSettings,
        ColourScaleType
    } from "../../../store/plottingSelections/plottingSelections";
    import {getIndicatorRange, toIndicatorNameLookup, formatOutput} from "../utils";
    import {getFeatureIndicator, initialiseColourScaleFromMetadata} from "./utils";
    import {Dict, Filter, IndicatorValuesDict, LevelLabel, NumericRange} from "../../../types";
    import {flattenOptions, flattenToIdSet} from "../../../utils";

    interface Props {
        features: Feature[],
        featureLevels: LevelLabel[]
        indicators: ChoroplethIndicatorMetadata[],
        chartdata: any[],
        filters: Filter[],
        selections: ChoroplethSelections,
        colourScales: ColourScaleSelections,
        areaFilterId: string,
        includeFilters: boolean
    }

    interface Data {
        style: any,
        fullIndicatorRanges: Dict<NumericRange>
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
        updateColourScale: (colourScale: ColourScaleSettings) => void,
        getFeatureFromAreaId: (id: string) => Feature,
        normalizeIndicators: (node: ChoroplethIndicatorMetadata) => any
    }

    interface Computed {
        initialised: boolean,
        colourRange: NumericRange,
        featureIndicators: IndicatorValuesDict,
        featuresByLevel: { [k: number]: Feature[] },
        currentFeatures: Feature[],
        currentLevelFeatureIds: string[],
        maxLevel: number,
        indicatorNameLookup: Dict<string>,
        indicatorColourScale: ColourScaleSettings | null,
        areaFilter: Filter,
        nonAreaFilters: Filter[],
        selectedAreaFilterOptions: FilterOption[],
        flattenedAreas: Dict<NestedFilterOption>,
        selectedAreaFeatures: Feature[],
        selectedAreaIds: string[],
        colorIndicator: ChoroplethIndicatorMetadata,
        options: GeoJSONOptions,
        emptyFeature: boolean
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
        colourScales: {
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
            MapControl,
            MapLegend,
            Filters,
            MapEmptyFeature
        },
        props: props,
        data(): Data {
            return {
                style: {
                    className: "geojson",
                },
                fullIndicatorRanges: {}
            }
        },
        computed: {
            initialised() {
                const unsetFilters = this.nonAreaFilters.filter((f: Filter) => !this.selections.selectedFilterOptions[f.id]);
                return unsetFilters.length == 0 && this.selections.detail > -1 &&
                    !!this.selections.indicatorId;
            },
            emptyFeature() {
                const nonEmptyFeature = (this.currentFeatures.filter(filtered => !!this.featureIndicators[filtered.properties!.area_id]))
                return nonEmptyFeature.length == 0
            },
            colourRange() {
                const indicator = this.selections.indicatorId;
                const type = this.colourScales[indicator] && this.colourScales[indicator].type;
                switch (type) {
                    case  ColourScaleType.DynamicFull:
                        if (!this.fullIndicatorRanges.hasOwnProperty(indicator)) {
                            // cache the result in the fullIndicatorRanges object for future lookups
                            /* eslint vue/no-side-effects-in-computed-properties: "off" */
                            this.fullIndicatorRanges[indicator] =
                                getIndicatorRange(this.chartdata, this.colorIndicator)
                        }
                        return this.fullIndicatorRanges[indicator];
                    case  ColourScaleType.DynamicFiltered:
                        return getIndicatorRange(
                            this.chartdata,
                            this.colorIndicator,
                            this.nonAreaFilters,
                            this.selections.selectedFilterOptions,
                            this.selectedAreaIds.filter(a => this.currentLevelFeatureIds.indexOf(a) > -1)
                        );
                    case ColourScaleType.Custom:
                        return {
                            min: this.colourScales[indicator].customMin,
                            max: this.colourScales[indicator].customMax
                        };
                    case ColourScaleType.Default:
                    default:
                        if (!this.initialised) {
                            return {max: 1, min: 0}
                        }
                        return {max: this.colorIndicator.max, min: this.colorIndicator.min}
                }
            },
            selectedAreaIds() {
                const selectedAreaIdSet = flattenToIdSet(this.selectedAreaFilterOptions.map(o => o.id), this.flattenedAreas);

                //Should also ensure include top level (country) included if no filters selected
                const selectedOptions = this.selections.selectedFilterOptions[this.areaFilterId];
                if (!selectedOptions || selectedOptions.length == 0) {
                    this.currentLevelFeatureIds.forEach(id => selectedAreaIdSet.add(id));
                }

                return Array.from(selectedAreaIdSet);
            },
            featureIndicators() {
                return getFeatureIndicator(
                    this.chartdata,
                    this.selectedAreaIds,
                    this.colorIndicator,
                    this.colourRange,
                    this.nonAreaFilters,
                    this.selections.selectedFilterOptions
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
                    const adminLevel = parseInt(feature.properties!["area_level"]); //Country (e.g. "MWI") is level 0
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
                return this.featuresByLevel[this.selections.detail] || [];
            },
            currentLevelFeatureIds() {
                return this.currentFeatures.map(f => f.properties!["area_id"]);
            },
            indicatorNameLookup() {
                return toIndicatorNameLookup(this.indicators)
            },
            areaFilter() {
                return this.filters.find((f: Filter) => f.id == this.areaFilterId)!;
            },
            nonAreaFilters() {
                return this.filters.filter((f: Filter) => f.id != this.areaFilterId);
            },
            selectedAreaFilterOptions() {
                const selectedOptions = this.selections.selectedFilterOptions[this.areaFilterId];
                if (selectedOptions && selectedOptions.length > 0) {
                    return selectedOptions
                }
                return this.areaFilter ? this.areaFilter.options : []; //consider all top level areas to be selected if none are
            },
            flattenedAreas() {
                return this.areaFilter ? flattenOptions(this.areaFilter.options) : {};
            },
            selectedAreaFeatures(): Feature[] {
                if (this.initialised) {
                    return this.selectedAreaFilterOptions.map(o => this.getFeatureFromAreaId(o.id)!);
                }
                return [];
            },
            colorIndicator(): ChoroplethIndicatorMetadata {
                return this.indicators.find(i => i.indicator == this.selections.indicatorId)!;
            },
            indicatorColourScale(): ColourScaleSettings | null {
                const current = this.colourScales[this.selections.indicatorId];
                if (current) {
                    return current
                } else {
                    const newScale = initialiseColourScaleFromMetadata(this.colorIndicator);
                    this.updateColourScale(newScale);
                    return newScale;
                }
            },
            options() {
                const featureIndicators = this.featureIndicators;
                const {format, scale, accuracy} = this.colorIndicator!;
                return {
                    onEachFeature: function onEachFeature(feature: Feature, layer: Layer) {
                        const area_id = feature.properties && feature.properties["area_id"];
                        const area_name = feature.properties && feature.properties["area_name"];

                        const values = featureIndicators[area_id];
                        const value = values && values!.value;

                        const stringVal = (value || value === 0) ? value.toString() : "";
                        if (stringVal) {
                            layer.bindTooltip(`<div>
                                <strong>${area_name}</strong>
                                <br/>${formatOutput(stringVal, format, scale, accuracy)}
                            </div>`);
                        }
                    }
                }
            }
        },
        methods: {
            initialise: function () {
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
            updateBounds: function () {
                if (this.initialised) {
                    const map = this.$refs.map as LMap;

                    if (map && map.fitBounds) {
                        map.fitBounds(this.selectedAreaFeatures.map((f: Feature) => new GeoJSON(f).getBounds()) as any);
                    }
                }
            },
            showColor(feature: Feature) {
                return !!this.featureIndicators[feature.properties!.area_id] &&
                    !!this.featureIndicators[feature.properties!.area_id];
            },
            getColor: function (feature: Feature) {
                if (this.showColor(feature)) {
                    return this.featureIndicators[feature.properties!.area_id].color;
                } else {
                    //show a lighter grey than the outlines if no data
                    //so unselected regions are still distinguishable
                    return "rgb(200,200,200)";
                }
            },
            onDetailChange: function (newVal: number) {
                this.changeSelections({detail: newVal});
            },
            onIndicatorChange: function (newVal: string) {
                this.changeSelections({indicatorId: newVal});
            },
            onFilterSelectionsChange(newSelections: Dict<FilterOption[]>) {
                this.changeSelections({selectedFilterOptions: newSelections});
            },
            changeSelections(newSelections: Partial<ChoroplethSelections>) {
                this.$emit("update", newSelections)
            },
            updateColourScale: function (colourScale: ColourScaleSettings) {
                const newColourScales = {...this.colourScales};
                newColourScales[this.selections.indicatorId] = colourScale;
                this.$emit("update-colour-scales", newColourScales);
            },
            getFeatureFromAreaId(areaId: string): Feature {
                return this.features.find((f: Feature) => f.properties!.area_id == areaId)!;
            },
            normalizeIndicators(node: ChoroplethIndicatorMetadata) {
                return {id: node.indicator, label: node.name};
            }
        },
        watch:
            {
                initialised: function (newVal: boolean) {
                    this.updateBounds();
                },
                selectedAreaFeatures: function (newVal) {
                    this.updateBounds();
                },
                filters: function () {
                    this.initialise();
                },
                indicators: function () {
                    this.initialise();
                },
            },
        created() {
            this.initialise();
        },
        mounted() {
            this.updateBounds();
        }
    });
</script>