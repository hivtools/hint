import {createLocalVue, shallowMount} from "@vue/test-utils";
import Choropleth from "../../../../app/components/plots/choropleth/Choropleth.vue";
import {LGeoJson} from "vue2-leaflet";
import {getFeatureIndicators} from "../../../../app/components/plots/choropleth/utils";
import {getIndicatorRanges} from "../../../../app/components/plots/utils";
import MapControl from "../../../../app/components/plots/MapControl.vue";
import {NestedFilterOption} from "../../../../app/generated";
import registerTranslations from "../../../../app/store/translations/registerTranslations";
import Vuex from "vuex";
import {emptyState} from "../../../../app/root";
import MapLegend from "../../../../app/components/plots/MapLegend.vue";
import {expectFilter, testData} from "../testHelpers";
import Filters from "../../../../app/components/plots/Filters.vue";

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
            age: [{id: "0:15", label:"0-15"}],
            sex: [{id: "female", label:"Female"}],
            area: []
        }
    },
    includeFilters: true
};

const getWrapper  = (customPropsData: any = {}) => {
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

        //TODO: ADD TEST THAT MODIFIES AREA FILTER FOR DISPLAY IN FILTERS
    });

    it("does not render filters if includeFilters is false", () => {
        const wrapper = getWrapper({includeFilters: false});
        expect(wrapper.findAll(Filters).length).toBe(0);
    });

    it("renders color legend", () => {
        const wrapper = getWrapper();
        const legend = wrapper.find(MapLegend);
        expect(legend.props().metadata).toBe(propsData.indicators[1]);
    });

    it("computes indicatorRanges", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;

        expect(vm.indicatorRanges).toStrictEqual(getIndicatorRanges(propsData.chartdata, propsData.indicators));
    });

    it("computes featureIndicators", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;

        expect(vm.featureIndicators).toStrictEqual(getFeatureIndicators(propsData.chartdata,
            ["MWI_3_1", "MWI_4_1", "MWI_4_2", "MWI_4_3"],
            propsData.indicators,
            getIndicatorRanges(propsData.chartdata, propsData.indicators),
            [propsData.filters[1]],
            propsData.selections.selectedFilterOptions,
            ["prevalence"]
        ));
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
            "MWI": {id: "MWI", label: "Malawi", children: [
                    {id: "MWI_3_1", label: "3.1"},
                    {id: "MWI_4_1", label: "4.1"},
                    {id: "MWI_4_2", label: "4.2"},
                    {id: "MWI_4_3", label: "4.3"}
                ]},
            "MWI_3_1": {id: "MWI_3_1", label: "3.1"},
            "MWI_4_1": {id: "MWI_4_1", label: "4.1"},
            "MWI_4_2": {id: "MWI_4_2", label: "4.2"},
            "MWI_4_3": {id: "MWI_4_3", label: "4.3"}
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
                { id: "age", label: "Age", column_id: "age", options: []},
                { id: "sex", label: "Sex", column_id: "sex", options: []}
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
            filters: [{ id: "area", label: "Area", column_id: "area_id",options: []}, propsData.filters[1], propsData.filters[2]]
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
        const wrapper = getWrapper({selections: {
                detail: -1,
                indicatorId: null,
                selectedFilterOptions: {}
            }});

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
                { id: "age", label: "Age", column_id: "age", options: []},
                { id: "sex", label: "Sex", column_id: "sex", options: []}
            ],
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
                            <br/>0.01
                        </div>`);

        const mockZeroValueFeature = {
            properties: {
                area_id: "MWI_4_3",
                area_name: "Area 2"
            }
        };

        onEachFeatureFunction(mockZeroValueFeature, mockLayer);
        expect(mockLayer.bindTooltip.mock.calls[1][0]).toEqual(`<div>
                            <strong>Area 2</strong>
                            <br/>0
                        </div>`);

    });

});