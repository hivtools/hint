import {createLocalVue, shallowMount} from "@vue/test-utils";
import Choropleth from "../../../../app/components/plots/choropleth/Choropleth.vue";
import {LControl, LGeoJson} from "vue2-leaflet";
import {getFeatureIndicator} from "../../../../app/components/plots/choropleth/utils";
import MapControl from "../../../../app/components/plots/MapControl.vue";
import registerTranslations from "../../../../app/store/translations/registerTranslations";
import Vuex from "vuex";
import {emptyState} from "../../../../app/root";
import MapLegend from "../../../../app/components/plots/MapLegend.vue";
import {prev, testData} from "../testHelpers";
import Filters from "../../../../app/components/plots/Filters.vue";
import {ColourScaleType} from "../../../../app/store/plottingSelections/plottingSelections";
import Vue from "vue";
import { expectTranslated } from "../../../testHelpers";

const localVue = createLocalVue();
const store = new Vuex.Store({
    state: emptyState()
});
registerTranslations(store);

const propsData = {
    ...testData,
    selections: {
        indicatorId: "prevalence",
        detail: 4,
        selectedFilterOptions: {
            age: [{id: "0:15", label: "0-15"}],
            sex: [{id: "female", label: "Female"}],
            area: []
        }
    },
    includeFilters: true,
    colourScales: {
        prevalence: {
            type: ColourScaleType.Custom,
            customMin: 1,
            customMax: 2
        }
    }
};

const allAreaIds = ["MWI", "MWI_3_1", "MWI_3_2", "MWI_4_1", "MWI_4_2"];

const getWrapper = (customPropsData: any = {}) => {
    return shallowMount(Choropleth, {propsData: {...propsData, ...customPropsData}, localVue});
};

describe("Choropleth component", () => {
    it("renders plot as expected", () => {
        const wrapper = getWrapper();
        const geoJsons = wrapper.findAll(LGeoJson);
        expect(geoJsons.length).toBe(2);
        expect(geoJsons.at(0).props().geojson).toBe(propsData.features[2]);
        expect(geoJsons.at(1).props().geojson).toBe(propsData.features[3]);

        expect(wrapper.find(MapControl).props().initialDetail).toEqual(4);
        expect(wrapper.find(MapControl).props().showIndicators).toEqual(true);
        expect(wrapper.find(MapControl).props().indicator).toEqual("prevalence");
        expect(wrapper.find(MapControl).props().indicatorsMetadata).toEqual(testData.indicators);
    });

    it("renders filters", () => {
        const wrapper = getWrapper();
        expect(wrapper.findAll(Filters).length).toBe(1);

        //TODO: ADD TEST THAT MODIFIES AREA FILTER FOR DISPLA   Y IN FILTERS
    });

    it("does not render filters if includeFilters is false", () => {
        const wrapper = getWrapper({includeFilters: false});
        expect(wrapper.findAll(Filters).length).toBe(0);
    });

    it("renders color legend", () => {
        const wrapper = getWrapper();
        const legend = wrapper.find(MapLegend);
        expect(legend.props().metadata).toBe(propsData.indicators[1]);
        expect(legend.props().colourScale).toBe(propsData.colourScales.prevalence)
    });

    it("renders no data message on map when selections are empty", () => {
        const wrapper = getWrapper({selections: {...propsData.selections, detail: 0}});
        const vm = wrapper.vm as any;
        expect(vm.emptyFeature).toBe(true);
    });

    it("does not render no data message on map when selections are not empty", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        expect(vm.emptyFeature).toBe(false);
    });

    it("renders can display translated no data message on map", () => {
        const wrapper = getWrapper({selections: {...propsData.selections, detail: 0}});
        expect(wrapper.findAll(LControl).length).toBe(1)
        const noMapData = wrapper.find(LControl).find("p")
        expectTranslated(noMapData, "No data to display on map for these selections",
        "Aucune donnée à afficher sur la carte pour ces sélections", store as any)
    });

    it("computes featureIndicators", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;

        expect(vm.featureIndicators).toStrictEqual(getFeatureIndicator(propsData.chartdata,
            allAreaIds,
            prev,
            {min: propsData.colourScales["prevalence"].customMin, max: propsData.colourScales["prevalence"].customMax},
            [propsData.filters[1], propsData.filters[2]],
            propsData.selections.selectedFilterOptions
        ));
    });

    it("computes currentLevelFeatureIds", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        expect(vm.currentLevelFeatureIds).toStrictEqual(["MWI_4_1", "MWI_4_2"]);
    });

    it("computes selectedAreaIds with no area selection, where detail is 0", () => {
        //no selections means select all areas, including top level
        const wrapper = getWrapper({selections: {...propsData.selections, detail: 0}});
        const vm = wrapper.vm as any;
        expect(vm.selectedAreaIds).toStrictEqual(allAreaIds);
    });

    it("computes selectedAreaIds with area selection", () => {
        const wrapper = getWrapper({
            selections: {
                ...propsData.selections,
                selectedFilterOptions: {
                    ...propsData.selections.selectedFilterOptions,
                    area: [{id: "MWI_4_1", label: ""}]
                }
            }
        });
        const vm = wrapper.vm as any;
        expect(vm.selectedAreaIds).toStrictEqual(["MWI_4_1"]);
    });

    it("computes colourRange", async () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        expect(vm.colourRange).toStrictEqual({
            min: propsData.colourScales["prevalence"].customMin,
            max: propsData.colourScales["prevalence"].customMax
        });

        wrapper.setProps({
            colourScales: {
                prevalence: {
                    type: ColourScaleType.Default,
                    customMin: 1,
                    customMax: 2
                }
            }
        });

        await Vue.nextTick();
        expect(vm.colourRange).toStrictEqual({
            min: prev.min,
            max: prev.max
        });

        wrapper.setProps({
            colourScales: {
                prevalence: {
                    type: ColourScaleType.DynamicFull,
                    customMin: 1,
                    customMax: 2
                }
            }
        });

        await Vue.nextTick();
        expect(vm.colourRange).toStrictEqual({
            min: 0,
            max: 0.9
        });

        wrapper.setProps({
            colourScales: {
                prevalence: {
                    type: ColourScaleType.DynamicFiltered,
                    customMin: 1,
                    customMax: 2
                }
            },
            selections: {
                indicatorId: "prevalence",
                detail: 4,
                selectedFilterOptions: {
                    age: [{id: "0:15", label: "0-15"}],
                    sex: [{id: "male", label: "Male"}],
                    area: []
                }
            }
        });

        await Vue.nextTick();
        expect(vm.colourRange).toStrictEqual({
            min: 0.1,
            max: 0.9
        });

    });

    it("computes featuresByLevel", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;

        expect(vm.featuresByLevel).toStrictEqual({
            0: [propsData.features[0]],
            3: [propsData.features[1], propsData.features[4]],
            4: [propsData.features[2], propsData.features[3]]
        });
    });

    it("computes maxLevel", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        expect(vm.maxLevel).toBe(4);
    });

    it("computes currentFeatures", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;

        expect(vm.currentFeatures).toStrictEqual([propsData.features[2], propsData.features[3]]);
    });

    it("computes indicatorNameLookup", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        expect(vm.indicatorNameLookup).toStrictEqual({
            plhiv: "PLHIV",
            prevalence: "Prevalence"
        });
    });

    it("computed flattenedAreas", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        expect(vm.flattenedAreas).toStrictEqual({
            "MWI": {
                id: "MWI", label: "Malawi", children: [
                    {id: "MWI_3_1", label: "3.1"},
                    {id: "MWI_3_2", label: "3.2"},
                    {id: "MWI_4_1", label: "4.1"},
                    {id: "MWI_4_2", label: "4.2"}
                ]
            },
            "MWI_3_1": {id: "MWI_3_1", label: "3.1"},
            "MWI_3_2": {id: "MWI_3_2", label: "3.2"},
            "MWI_4_1": {id: "MWI_4_1", label: "4.1"},
            "MWI_4_2": {id: "MWI_4_2", label: "4.2"},
        });
    });

    it("computes initialised", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        expect(vm.initialised).toBe(true);

        const uninitialisableWrapper = getWrapper({
            selections: {
                detail: -1,
                selectedFilterOptions: {}
            },
            filters: [
                propsData.filters[0], //area
                {id: "age", label: "Age", column_id: "age", options: []},
                {id: "sex", label: "Sex", column_id: "sex", options: []}
            ],
        });

        expect((uninitialisableWrapper.vm as any).initialised).toBe(false);
    });

    it("computes initialised to false if no filters present", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        expect(vm.initialised).toBe(true);

        const uninitialisableWrapper = getWrapper({
            selections: {
                detail: 2,
                selectedFilterOptions: {}
            },
            filters: []
        });

        expect((uninitialisableWrapper.vm as any).initialised).toBe(false);
    });

    it("computes areaFilter", () => {
        const wrapper = getWrapper();
        expect((wrapper.vm as any).areaFilter).toBe(propsData.filters[0]);
    });

    it("computes nonAreaFilters", () => {
        const wrapper = getWrapper();
        expect((wrapper.vm as any).nonAreaFilters).toStrictEqual([propsData.filters[1], propsData.filters[2]]);
    });

    it("computes selectedAreaFilterOptions", () => {
        const wrapper = getWrapper({
            selections: {
                ...propsData.selections,
                selectedFilterOptions: {
                    ...propsData.selections.selectedFilterOptions,
                    area: [{id: "MWI_4_2", label: "4.2"}]
                }
            }
        });

        expect((wrapper.vm as any).selectedAreaFilterOptions).toStrictEqual([{id: "MWI_4_2", label: "4.2"}]);
    });

    it("computes selectedAreaFeatures where a feature is selected", () => {
        const wrapper = getWrapper({
            selections: {
                ...propsData.selections,
                selectedFilterOptions: {
                    ...propsData.selections.selectedFilterOptions,
                    area: [{id: "MWI_4_2", label: "4.2"}]
                }
            }
        });

        expect((wrapper.vm as any).selectedAreaFeatures).toStrictEqual([propsData.features[3]]);
    });

    it("computes selectedAreaFeatures where no feature is selected", () => {
        //defaults to country level
        const wrapper = getWrapper();
        expect((wrapper.vm as any).selectedAreaFeatures).toStrictEqual([propsData.features[0]]);
    });

    it("computes empty selectedAreaFeatures with empty area options", () => {
        const wrapper = getWrapper({
            filters: [{
                id: "area",
                label: "Area",
                column_id: "area_id",
                options: []
            }, propsData.filters[1], propsData.filters[2]]
        });
        expect((wrapper.vm as any).selectedAreaFeatures).toStrictEqual([]);
    });

    it("updateBounds updates bounds of map from features geojson", () => {
        const wrapper = getWrapper();
        const mockMapFitBounds = jest.fn();

        const vm = wrapper.vm as any;
        vm.$refs.map = {
            fitBounds: mockMapFitBounds
        };

        vm.updateBounds();
        expect(mockMapFitBounds.mock.calls[0][0]).toStrictEqual(
            [{_northEast: {lat: -15.1, lng: 35.9}, _southWest: {lat: -15.3, lng: 35.7}}]);
    });

    it("initialises from empty selections and emits updates", () => {
        const wrapper = getWrapper({
            selections: {
                detail: -1,
                indicatorId: null,
                selectedFilterOptions: {}
            }
        });

        const updates = wrapper.emitted("update");
        expect(wrapper.emitted("update")[0][0]).toStrictEqual({detail: 4});
        expect(wrapper.emitted("update")[1][0]).toStrictEqual({indicatorId: "prevalence"});
        expect(wrapper.emitted("update")[2][0]).toStrictEqual({
            selectedFilterOptions: {
                age: [{id: "0:15", label: "0-15"}],
                sex: [{id: "female", label: "Female"}],
                area: undefined
            }
        });
    });

    it("onFilterSelectionsChange updates filter value", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        const newSelections = {age: [{id: "15:30", label: "15-30"}]};
        vm.onFilterSelectionsChange(newSelections);
        const updates = wrapper.emitted("update");
        expect(updates[updates.length - 1][0]).toStrictEqual({
            selectedFilterOptions: newSelections
        });
    });

    it("onIndicatorChange updates indicator", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        vm.onIndicatorChange("newIndicator");
        const updates = wrapper.emitted("update");
        expect(updates[updates.length - 1][0]).toStrictEqual({
            indicatorId: "newIndicator"
        });
    });

    it("updates detail", () => {
        const wrapper = getWrapper();

        const vm = wrapper.vm as any;
        vm.onDetailChange(3);

        const updates = wrapper.emitted("update");
        expect(updates[updates.length - 1][0]).toStrictEqual({
            detail: 3
        });

    });

    it("updates colour scales on change in legend", () => {
        const wrapper = getWrapper();

        const legend = wrapper.find(MapLegend);
        const newScale = {
            type: ColourScaleType.Custom,
            customMin: 5,
            customMax: 10
        };
        legend.vm.$emit("update", newScale);

        expect(wrapper.emitted("update-colour-scales").length).toBe(1);
        expect(wrapper.emitted("update-colour-scales")[0][0]).toStrictEqual({
            prevalence: newScale
        });
    });

    it("initialises new colour scales when current indicator has no colour scale yet", () => {
        const wrapper = getWrapper({
            selections: {...propsData.selections, indicatorId: "plhiv"}
        });

        expect(wrapper.emitted("update-colour-scales").length).toBe(1);
        expect(wrapper.emitted("update-colour-scales")[0][0]).toStrictEqual({
            ...propsData.colourScales,
            plhiv: {
                type: ColourScaleType.DynamicFiltered,
                customMin: 1,
                customMax: 100
            }
        });
    });

    it("updates bounds when becomes initialises", () => {
        const mockUpdateBounds = jest.fn();
        const wrapper = getWrapper({ //this cannot initialise
            features: [...propsData.features],
            featureLevels: [...propsData.featureLevels],
            chartdata: [...propsData.chartdata],
            indicators: [...propsData.indicators],
            selections: {
                detail: -1,
                selectedFilterOptions: {}
            },
            filters: [
                propsData.filters[0], //area
                {id: "age", label: "Age", column_id: "age", options: []},
                {id: "sex", label: "Sex", column_id: "sex", options: []}
            ],
            colourScales: {}
        });
        const vm = wrapper.vm as any;
        vm.updateBounds = mockUpdateBounds;

        wrapper.setProps(propsData); //This should initialise and trigger the watcher
        expect(mockUpdateBounds.mock.calls.length).toBeGreaterThan(0);
    });

    it("normalizeIndicators converts indicator metadata for treeselect", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        const result = vm.normalizeIndicators(propsData.indicators[0]);
        expect(result).toStrictEqual({id: "plhiv", label: "PLHIV"});
    });

    it("options onEachFeature returns function which generates correct tooltips", () => {

        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        const options = vm.options;
        const onEachFeatureFunction = options.onEachFeature;

        const mockLayer = {
            bindTooltip: jest.fn()
        };

        const mockFeature = {
            properties: {
                area_id: "MWI_3_1",
                area_name: "Area 1"
            }
        };

        onEachFeatureFunction(mockFeature, mockLayer);
        expect(mockLayer.bindTooltip.mock.calls[0][0]).toEqual(`<div>
                            <strong>Area 1</strong>
                            <br/>1.00%
                        </div>`);

        const mockZeroValueFeature = {
            properties: {
                area_id: "MWI_3_2",
                area_name: "Area 2"
            }
        };

        onEachFeatureFunction(mockZeroValueFeature, mockLayer);
        expect(mockLayer.bindTooltip.mock.calls[1][0]).toEqual(`<div>
                            <strong>Area 2</strong>
                            <br/>0.00%
                        </div>`);

    });

});