<template>
    <div class="row">
        <div class="col-md-3">
            <div id="color-indicator" class="form-group">
                <label class="font-weight-bold" v-translate="'colorIndicator'"></label>
                <treeselect :multiple=false
                            :clearable="false"
                            :options="indicators"
                            v-model="selections.colorIndicatorId"
                            :normalizer="normalizeIndicators"
                            @input="onColorIndicatorSelect($event)">
                </treeselect>
            </div>
            <div id="size-indicator" class="form-group">
                <label class="font-weight-bold" v-translate="'sizeIndicator'"></label>
                <treeselect :multiple=false
                            :clearable="false"
                            :options="indicators"
                            v-model="selections.sizeIndicatorId"
                            :normalizer="normalizeIndicators"
                            @input="onSizeIndicatorSelect($event)">
                </treeselect>
            </div>
            <h4 v-translate="'filters'"></h4>
            <div id="area-filter" class="form-group">
                <filter-select :label="areaFilter.label"
                               :multiple="true"
                               :options="areaFilterOptions"
                               :value="getSelectedFilterValues('area')"
                               @select="onFilterSelect(areaFilter, $event)">
                </filter-select>
            </div>
            <div :id="'filter-' + filter.id" v-for="filter in nonAreaFilters" class="form-group">
                <filter-select :value="getSelectedFilterValues(filter.id)"
                               :multiple="false"
                               :label="filter.label"
                               :options="filter.options"
                               @select="onFilterSelect(filter, $event)"></filter-select>
            </div>
        </div>
        <div id="chart" class="col-md-9">
            <l-map ref="map" style="height: 800px; width: 100%">
                <template v-for="feature in currentFeatures">
                    <l-geo-json ref=""
                                :geojson="feature"
                                :optionsStyle="style">
                    </l-geo-json>
                    <l-circle-marker v-if="showBubble(feature)"
                                     :lat-lng="[feature.properties.center_y, feature.properties.center_x]"
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
                             :level-labels="featureLevels"
                             @detail-changed="onDetailChange"></map-control>
                <map-legend :metadata="colorIndicator"
                            :colour-range="colourRange"
                            :colour-scale="colourIndicatorScale"
                            @update="updateColourScale"
                ></map-legend>
                <size-legend :indicatorRange="sizeRange" :max-radius="maxRadius" :min-radius="minRadius"></size-legend>
            </l-map>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Treeselect from '@riophae/vue-treeselect';
    import {Feature} from "geojson";
    import {LCircleMarker, LGeoJson, LMap, LTooltip} from "vue2-leaflet";
    import MapControl from "../MapControl.vue";
    import MapLegend from "../MapLegend.vue";
    import FilterSelect from "../FilterSelect.vue";
    import {GeoJSON} from "leaflet";
    import {ChoroplethIndicatorMetadata, FilterOption, NestedFilterOption} from "../../../generated";
    import {
        BubblePlotSelections,
        ColourScaleSelections,
        ColourScaleSettings,
        ColourScaleType
    } from "../../../store/plottingSelections/plottingSelections";
    import {getFeatureIndicators} from "./utils";
    import {getDynamicFilteredColourRange, getIndicatorRange, toIndicatorNameLookup} from "../utils";
    import {BubbleIndicatorValuesDict, Dict, Filter, LevelLabel, NumericRange} from "../../../types";
    import {flattenOptions, flattenToIdSet} from "../../../utils";
    import SizeLegend from "./SizeLegend.vue";
    import {initialiseColourScaleFromMetadata} from "../choropleth/utils";


    interface Props {
        features: Feature[],
        featureLevels: LevelLabel[]
        indicators: ChoroplethIndicatorMetadata[],
        chartdata: any[],
        filters: Filter[],
        selections: BubblePlotSelections,
        areaFilterId: string,
        colourScales: ColourScaleSelections,
    }

    interface Data {
        style: any,
        maxRadius: number,
        minRadius: number,
        fullIndicatorRanges: Dict<NumericRange>
    }

    interface Methods {
        updateBounds: () => void,
        showBubble: (feature: Feature) => boolean,
        getRadius: (feature: Feature) => number,
        getColor: (feature: Feature) => string,
        getTooltip: (feature: Feature) => string,
        getSelectedFilterValues: (filterId: string) => string[],
        onDetailChange: (newVal: number) => void,
        onFilterSelect: (filter: Filter, selectedOptions: FilterOption[]) => void,
        onColorIndicatorSelect: (newValue: string) => void,
        onSizeIndicatorSelect: (newValue: string) => void,
        changeSelections: (newSelections: Partial<BubblePlotSelections>) => void,
        getFeatureFromAreaId: (id: string) => Feature,
        normalizeIndicators: (node: ChoroplethIndicatorMetadata) => any,
        updateColourScale: (colourScale: ColourScaleSettings) => void,
    }

    interface Computed {
        initialised: boolean,
        currentLevelFeatureIds: string[],
        featureIndicators: BubbleIndicatorValuesDict,
        featuresByLevel: { [k: number]: Feature[] },
        currentFeatures: Feature[],
        maxLevel: number,
        indicatorNameLookup: Dict<string>,
        areaFilter: Filter,
        nonAreaFilters: Filter[],
        areaFilterOptions: FilterOption[],
        selectedAreaFilterOptions: FilterOption[],
        flattenedAreas: Dict<NestedFilterOption>,
        selectedAreaFeatures: Feature[],
        countryFilterOption: FilterOption,
        countryFeature: Feature | null,
        sizeIndicator: ChoroplethIndicatorMetadata,
        colorIndicator: ChoroplethIndicatorMetadata,
        sizeRange: NumericRange,
        colourRange: NumericRange,
        colourIndicatorScale: ColourScaleSettings | null
        selectedAreaIds: string[]
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
        colourScales: {
            type: Object
        },
    };

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: "BubblePlot",
        components: {
            LMap,
            LGeoJson,
            LCircleMarker,
            LTooltip,
            MapControl,
            MapLegend,
            SizeLegend,
            FilterSelect,
            Treeselect
        },
        props: props,
        data(): Data {
            return {
                style: {
                    className: "geojson-grey",
                },
                maxRadius: 70,
                minRadius: 10,
                fullIndicatorRanges: {}
            }
        },
        computed: {
            initialised() {
                const unsetFilters = this.nonAreaFilters.filter((f: Filter) => !this.selections.selectedFilterOptions[f.id]);
                return unsetFilters.length == 0 && this.selections.detail > -1 &&
                    !!this.selections.colorIndicatorId && !!this.selections.sizeIndicatorId;
            },
            currentLevelFeatureIds() {
                return this.currentFeatures.map(f => f.properties!!["area_id"]);
            },
            sizeRange() {
                if (!this.initialised) {
                    return {max: 1, min: 0}
                }
                const sizeId = this.selections.sizeIndicatorId;
                if (!this.fullIndicatorRanges.hasOwnProperty(sizeId)) {
                    // cache the result in the fullIndicatorRanges object for future lookups
                    this.fullIndicatorRanges[sizeId] =
                        getIndicatorRange(this.chartdata, this.sizeIndicator)
                }
                return this.fullIndicatorRanges[sizeId];
            },
            colourRange() {
                if (!this.initialised) {
                    return {max: 1, min: 0}
                }
                const colorId = this.selections.colorIndicatorId;
                const type = this.colourScales[colorId] && this.colourScales[colorId].type;
                switch (type) {
                    case  ColourScaleType.DynamicFull:
                        if (!this.fullIndicatorRanges.hasOwnProperty(colorId)) {
                            // cache the result in the fullIndicatorRanges object for future lookups
                            this.fullIndicatorRanges[colorId] =
                                getIndicatorRange(this.chartdata, this.colorIndicator)
                        }
                        return this.fullIndicatorRanges[colorId];
                    case ColourScaleType.DynamicFiltered:
                        const selectedCurrentLevelAreaIds = this.selectedAreaIds
                            .filter(a => this.currentLevelFeatureIds.indexOf(a) > -1);
                        return getDynamicFilteredColourRange(
                            this.chartdata,
                            this.colorIndicator,
                            this.nonAreaFilters,
                            this.selections.selectedFilterOptions,
                            selectedCurrentLevelAreaIds
                        );
                    case ColourScaleType.Custom:
                        return {
                            min: this.colourScales[colorId].customMin,
                            max: this.colourScales[colorId].customMax
                        };
                    case ColourScaleType.Default:
                    default:
                        return {max: this.colorIndicator.max, min: this.colorIndicator.min}
                }
            },
            selectedAreaIds() {
                const selectedAreaIdSet = flattenToIdSet(this.selectedAreaFilterOptions.map(o => o.id), this.flattenedAreas);
                return Array.from(selectedAreaIdSet)
            },
            featureIndicators() {
                if (!this.initialised) {
                    return {}
                }
                return getFeatureIndicators(
                    this.chartdata,
                    this.selectedAreaIds,
                    this.sizeIndicator,
                    this.colorIndicator,
                    this.sizeRange,
                    this.colourRange,
                    this.nonAreaFilters,
                    this.selections.selectedFilterOptions,
                    this.minRadius,
                    this.maxRadius
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
                return this.featuresByLevel[this.selections.detail] || [];
            },
            indicatorNameLookup() {
                return toIndicatorNameLookup(this.indicators)
            },
            areaFilter() {
                return this.filters.find((f: Filter) => f.id == this.areaFilterId)!!;
            },
            nonAreaFilters() {
                return this.filters.filter((f: Filter) => f.id != this.areaFilterId);
            },
            areaFilterOptions() {
                return this.countryFilterOption ? (this.countryFilterOption as any).children : [];
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
                if (this.selectedAreaFilterOptions && this.selectedAreaFilterOptions.length > 0) {
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
                return this.indicators.find(i => i.indicator == this.selections.colorIndicatorId)!!;
            },
            sizeIndicator(): ChoroplethIndicatorMetadata {
                return this.indicators.find(i => i.indicator == this.selections.sizeIndicatorId)!!;
            },
            colourIndicatorScale(): ColourScaleSettings | null {
                const current = this.colourScales[this.selections.colorIndicatorId];
                if (current) {
                    return current
                } else {
                    const newScale = initialiseColourScaleFromMetadata(this.colorIndicator);
                    this.updateColourScale(newScale);
                    return newScale;
                }
            },
        },
        methods: {
            updateBounds: function () {
                if (this.initialised) {
                    const map = this.$refs.map as LMap;
                    if (map && map.fitBounds) {
                        map.fitBounds(this.selectedAreaFeatures.map((f: Feature) => new GeoJSON(f).getBounds()) as any);
                    }
                }
            },
            showBubble(feature: Feature) {
                return !!this.featureIndicators[feature.properties!!.area_id] &&
                    !!this.featureIndicators[feature.properties!!.area_id]
                    && !!this.featureIndicators[feature.properties!!.area_id].value
                    && !!this.featureIndicators[feature.properties!!.area_id].sizeValue
            },
            getRadius: function (feature: Feature) {
                return this.featureIndicators[feature.properties!!.area_id].radius;
            },
            getColor: function (feature: Feature) {
                return this.featureIndicators[feature.properties!!.area_id].color;
            },
            getTooltip: function (feature: Feature) {
                const area_id = feature.properties && feature.properties["area_id"];
                const area_name = feature.properties && feature.properties["area_name"];

                const values = this.featureIndicators[area_id];
                const colorIndicator = this.selections.colorIndicatorId;
                const sizeIndicator = this.selections.sizeIndicatorId;
                const colorValue = values && values!!.value;
                const sizeValue = values && values!!.sizeValue;

                const colorIndicatorName = this.indicatorNameLookup[colorIndicator];
                const sizeIndicatorName = this.indicatorNameLookup[sizeIndicator];
                return `<div>
                                <strong>${area_name}</strong>
                                <br/>${colorIndicatorName}: ${colorValue}
                                <br/>${sizeIndicatorName}: ${sizeValue}
                            </div>`;
            },
            getSelectedFilterValues(filterId: string) {
                return (this.selections.selectedFilterOptions[filterId] || []).map(o => o.id);
            },
            onDetailChange: function (newVal: number) {
                this.changeSelections({detail: newVal});
            },
            onFilterSelect(filter: Filter, selectedOptions: FilterOption[]) {
                const newSelectedFilterOptions = {...this.selections.selectedFilterOptions};
                newSelectedFilterOptions[filter.id] = selectedOptions;

                this.changeSelections({selectedFilterOptions: newSelectedFilterOptions});
            },
            onColorIndicatorSelect(newValue: string) {
                this.changeSelections({colorIndicatorId: newValue});
            },
            onSizeIndicatorSelect(newValue: string) {
                this.changeSelections({sizeIndicatorId: newValue});
            },
            changeSelections(newSelections: Partial<BubblePlotSelections>) {
                this.$emit("update", newSelections)
            },
            getFeatureFromAreaId(areaId: string): Feature {
                return this.features.find((f: Feature) => f.properties!!.area_id == areaId)!!;
            },
            normalizeIndicators(node: ChoroplethIndicatorMetadata) {
                return {id: node.indicator, label: node.name};
            },
            updateColourScale: function (colourScale: ColourScaleSettings) {
                const newColourScales = {...this.colourScales};
                newColourScales[this.selections.colorIndicatorId] = colourScale;

                this.$emit("updateColourScales", newColourScales);
            },
        },
        watch:
            {
                initialised: function (newVal: boolean) {
                    this.updateBounds();
                },
                selectedAreaFeatures: function (newVal) {
                    this.updateBounds();
                }
            },
        mounted() {
            this.updateBounds();
        },
        created() {
            //If selections have not been initialised, refresh them
            if (this.selections.detail < 0) {
                this.onDetailChange(this.maxLevel);
            }

            if (!this.selections.colorIndicatorId) {
                const colorIndicator = this.indicatorNameLookup.prevalence ? "prevalence" : this.indicators[0].indicator;
                this.changeSelections({colorIndicatorId: colorIndicator});
            }
            if (!this.selections.sizeIndicatorId) {
                const sizeIndicator = this.indicatorNameLookup.plhiv ? "plhiv" : this.indicators[0].indicator;
                this.changeSelections({sizeIndicatorId: sizeIndicator});
            }

            if (Object.keys(this.selections.selectedFilterOptions).length < 1) {
                const defaultSelected = this.nonAreaFilters.reduce((obj: any, current: Filter) => {
                    obj[current.id] = current.options.length > 0 ? [current.options[0]] : [];
                    return obj;
                }, {} as Dict<FilterOption[]>);
                this.changeSelections({selectedFilterOptions: defaultSelected});
            }
        },
    });
</script>