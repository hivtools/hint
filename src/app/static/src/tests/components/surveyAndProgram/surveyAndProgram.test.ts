import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import SurveyAndProgram from "../../../app/components/surveyAndProgram/SurveyAndProgram.vue";
import {
    mockAncResponse,
    mockBaselineState, mockGenericChartState,
    mockPlottingSelections,
    mockProgramResponse,
    mockSurveyAndProgramState,
    mockSurveyResponse
} from "../../mocks";
import {DataType, SurveyAndProgramState} from "../../../app/store/surveyAndProgram/surveyAndProgram";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {emptyState} from "../../../app/root";
import {actions} from "../../../app/store/surveyAndProgram/actions";
import {mutations} from "../../../app/store/surveyAndProgram/mutations";
import {getters} from "../../../app/store/surveyAndProgram/getters";
import {mutations as selectionsMutations} from "../../../app/store/plottingSelections/mutations";
import {ScaleSelections, ScaleType} from "../../../app/store/plottingSelections/plottingSelections";
import {Language} from "../../../app/store/translations/locales";
import {expectTranslated} from "../../testHelpers";
import GenericChart from "../../../app/components/genericChart/GenericChart.vue";
import {GenericChartState} from "../../../app/store/genericChart/genericChart";
import Choropleth from "../../../app/components/plots/choropleth/Choropleth.vue";
import {testUploadComponent} from "../baseline/fileUploads";

const localVue = createLocalVue();

describe("Survey and programme component", () => {

    beforeAll(() => {
        Vue.config.silent = true;
    });

    afterAll(() => {
        Vue.config.silent = false;
    });

    const createStore = (surveyAndProgramState: Partial<SurveyAndProgramState> = {selectedDataType: DataType.Survey},
                            genericChartState: Partial<GenericChartState> = {}) => {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                surveyAndProgram: {
                    namespaced: true,
                    state: mockSurveyAndProgramState(surveyAndProgramState),
                    mutations: mutations,
                    actions: actions,
                    getters: getters
                },
                genericChart: {
                    namespaced: true,
                    state: mockGenericChartState(genericChartState)
                },
                baseline: {
                    namespaced: true,
                    state: mockBaselineState({
                        shape: {
                            data: {features: "TEST FEATURES" as any} as any,
                            filters: {
                                level_labels: "TEST LEVEL LABELS",
                                regions: {id: "country", children: [{id: "region 1"}, {id: "region 2"}]}
                            } as any
                        } as any
                    })
                },
                plottingSelections: {
                    namespaced: true,
                    state: mockPlottingSelections({
                        sapChoropleth: {selectedFilterOptions: "TEST SELECTIONS"} as any
                    }),
                    getters: {
                        selectedSAPColourScales: () => {
                            return {
                                prevalence: {
                                    type: ScaleType.Custom,
                                    customMin: 1,
                                    customMax: 2
                                }
                            } as ScaleSelections
                        }
                    },
                    mutations: selectionsMutations
                },
                metadata: {
                    namespaced: true,
                    getters: {
                        sapIndicatorsMetadata: () => {
                            return ["TEST INDICATORS"]
                        }
                    }
                }
            }
        });
        registerTranslations(store);
        return store;
    };

    it("renders tabs", () => {
        const store = createStore();
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        const tabItems = wrapper.findAll("li.nav-item a");
        expect(tabItems.length).toBe(2);
        expect(tabItems.at(0).classes()).toContain("active");
        expectTranslated(tabItems.at(0), "Map", "Carte", "Mapa", store);
        expect(tabItems.at(1).classes()).not.toContain("active");
        expectTranslated(tabItems.at(1), "Time series", "Séries chronologiques", "Séries temporais", store);
    });

    it("renders choropleth controls if there is a selected data type and selectedTab is 0", () => {
        const store = createStore({selectedDataType: DataType.Survey});
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});

        expect(wrapper.findAll("choropleth-stub").length).toBe(1);
        expect(wrapper.findAll("filters-stub").length).toBe(1);
        expect(wrapper.find(GenericChart).exists()).toBe(false);
    });

    it("does not render choropleth controls if there is no selected data type", () => {
        const store = createStore({selectedDataType: null});
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});

        expect(wrapper.findAll("choropleth-stub").length).toBe(0);
        expect(wrapper.findAll("filters-stub").length).toBe(0);
    });

    it("renders choropleth as expected", () => {
        const store = createStore({
            selectedDataType: DataType.Survey,
            survey: {
                "data": "TEST DATA",
                "filters": {
                    "year": "TEST YEAR FILTERS"
                }
            } as any,
        });
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        const choro = wrapper.find("choropleth-stub");
        expect(choro.props().includeFilters).toBe(false);
        expect(choro.props().areaFilterId).toBe("area");
        expect(choro.props().chartdata).toBe("TEST DATA");
        expect(choro.props().filters[0]).toStrictEqual({
            id: "area",
            column_id: "area_id",
            label: "area",
            allowMultiple: true,
            options: [{id: "region 1"}, {id: "region 2"}]
        });
        expect(choro.props().filters[1]).toStrictEqual({
            id: "year",
            column_id: "year",
            label: "year",
            allowMultiple: false,
            options: "TEST YEAR FILTERS"
        });
        expect(choro.props().features).toBe("TEST FEATURES");
        expect(choro.props().featureLevels).toBe("TEST LEVEL LABELS");
        expect(choro.props().indicators).toStrictEqual(["TEST INDICATORS"]);
        expect(choro.props().selections).toStrictEqual({selectedFilterOptions: "TEST SELECTIONS"});
        expect(choro.props().colourScales).toEqual({
            prevalence: {
                type: ScaleType.Custom,
                customMin: 1,
                customMax: 2
            }
        });

    });

    it("renders generic chart component when generic chart metadata exists and selectedTab is 1", () => {
        const genericChartMetadata = {value: "TEST"} as any;
        const store = createStore({}, {
            genericChartMetadata
        });
        const data = () => {
            return {selectedTab: 1};
        };
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue, data});
        const tabItems = wrapper.findAll("li.nav-item a");
        expect(tabItems.at(0).classes()).not.toContain("active");
        expect(tabItems.at(1).classes()).toContain("active");

        const genericChart  = wrapper.find(GenericChart);
        expect(genericChart.props("chartId")).toBe("input-time-series");
        expect(genericChart.props("metadata")).toBe(genericChartMetadata);
        expect(genericChart.props("chartHeight")).toBe("600px");

        expect(wrapper.find(Choropleth).exists()).toBe(false);
    });

    it("does not render generic chart component if generic chart metadata does not exist", () => {
        const store = createStore();
        const data = ()  => {
            return {selectedTab: 1}
        };
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue, data});
        expect(wrapper.find(GenericChart).exists()).toBe(false);
        expect(wrapper.find(Choropleth).exists()).toBe(false);
    });

    it("clicking tab item changes tab", async () => {
        const genericChartMetadata = {value: "TEST"} as any;
        const store = createStore(
            {selectedDataType: DataType.Survey},
            {genericChartMetadata}
        );
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});

        const tabItems = wrapper.findAll("li.nav-item a");
        await tabItems.at(1).trigger("click");
        expect(tabItems.at(0).classes()).not.toContain("active");
        expect(tabItems.at(1).classes()).toContain("active");
        expect(wrapper.find(Choropleth).exists()).toBe(false);
        expect(wrapper.find(GenericChart).exists()).toBe(true);

        await tabItems.at(0).trigger("click");
        expect(tabItems.at(0).classes()).toContain("active");
        expect(tabItems.at(1).classes()).not.toContain("active");
        expect(wrapper.find(Choropleth).exists()).toBe(true);
        expect(wrapper.find(GenericChart).exists()).toBe(false);
    });

    it("renders filters as expected", () => {
        const store = createStore({
            selectedDataType: DataType.Survey,
            survey: {
                "data": "TEST DATA",
                "filters": {
                    "year": "TEST YEAR FILTERS"
                }
            } as any,
        });
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        const filters = wrapper.find("filters-stub");
        expect(filters.props().filters[0]).toStrictEqual({
            id: "area",
            column_id: "area_id",
            label: "area",
            allowMultiple: true,
            options: [{id: "region 1"}, {id: "region 2"}]
        });
        expect(filters.props().filters[1]).toStrictEqual({
            id: "year",
            column_id: "year",
            label: "year",
            allowMultiple: false,
            options: "TEST YEAR FILTERS"
        });
        expect(filters.props().selectedFilterOptions).toBe("TEST SELECTIONS");
    });

    it("updates state when choropleth selections change", async () => {
        const wrapper = shallowMount(SurveyAndProgram, {store: createStore(), localVue});
        (wrapper.vm as any).updateChoroplethSelections({payload: {selectedFilterOptions: "NEW TEST SELECTIONS"}});

        await Vue.nextTick();
        expect((wrapper.vm as any).plottingSelections).toStrictEqual({selectedFilterOptions: "NEW TEST SELECTIONS"});
    });

    it("data source is not rendered if no selected data type", () => {
        const store = createStore({selectedDataType: null});
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        expect(wrapper.find("#data-source").exists()).toBe(false);
    });

    it("renders data source header as expected", () => {
        const store = createStore();
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        const header = wrapper.find("#data-source h4");
        expectTranslated(header, "Data source", "Source de données", "Fonte de dados", store);
    });

    it("survey is included in data sources when survey data is present", () => {
        expectDataSource({survey: mockSurveyResponse(), selectedDataType: DataType.Survey},
            "Household Survey", "Enquête de ménage", "Inquérito aos agregados familiares", "2");
    });

    it("programme (ART) is included in data sources when programme data is present", () => {
        expectDataSource({program: mockProgramResponse(), selectedDataType: DataType.Program},
            "ART", "ART", "TARV", "1");
    });

    it("ANC is included in data sources when ANC data is present", () => {
        expectDataSource({anc: mockAncResponse(), selectedDataType: DataType.ANC},
            "ANC Testing", "Test de clinique prénatale", "Teste da CPN", "0");
    });

    function expectDataSource(state: Partial<SurveyAndProgramState>, englishName: string, frenchName: string,
                              portugueseName: string, id: string) {
        const store = createStore(state);
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        let options = wrapper.find("#data-source tree-select-stub").props("options");
        expect(options).toStrictEqual([{id, label: englishName}]);

        store.state.language = Language.fr;
        registerTranslations(store);
        options = wrapper.find("#data-source tree-select-stub").props("options");
        expect(options).toStrictEqual([{id, label:frenchName}]);

        store.state.language = Language.pt;
        registerTranslations(store);
        options = wrapper.find("#data-source tree-select-stub").props("options");
        expect(options).toStrictEqual([{id, label:portugueseName}]);
    }

    it("can select data source", () => {
        const store = createStore(
            {
                anc: mockAncResponse(),
                survey: mockSurveyResponse(),
                program: mockProgramResponse(),
                selectedDataType: DataType.Program
            });
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});

        const dataSourceSelect = wrapper.find("#data-source tree-select-stub");
        expect(dataSourceSelect.attributes("value")).toBe("1");
        expect(dataSourceSelect.props("options").length).toBe(3);

        dataSourceSelect.vm.$emit("select", {id: "0", label: "ANC"});
        expect(dataSourceSelect.attributes("value")).toBe("0");
        expect((wrapper.vm as any).selectedDataType).toBe(DataType.ANC);

        dataSourceSelect.vm.$emit("select", {id: "2", label: "Household Survey"});
        expect(dataSourceSelect.attributes("value")).toBe("2");
        expect((wrapper.vm as any).selectedDataType).toBe(DataType.Survey);

        dataSourceSelect.vm.$emit("select", {id: "1", label: "ART"});
        expect(dataSourceSelect.attributes("value")).toBe("1");
        expect((wrapper.vm as any).selectedDataType).toBe(DataType.Program);

        expect(wrapper.findAll("choropleth-stub").length).toBe(1);
    });

    it("computes selectedDataType", () => {
        const store = createStore(
            {
                anc: mockAncResponse(),
                survey: mockSurveyResponse(),
                program: mockProgramResponse(),
                selectedDataType: DataType.Program
            });
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        expect((wrapper.vm as any).selectedDataType).toBe(DataType.Program);
    });

    it("renders table as expected", () => {
        const store = createStore({
            selectedDataType: DataType.Survey,
            survey: {
                "data": "TEST DATA",
                "filters": {
                    "year": "TEST YEAR FILTERS"
                }
            } as any,
        });
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        const table = wrapper.find("table-view-stub");
        expect(table.props().areaFilterId).toBe("area");
        expect(table.props().tabledata).toBe("TEST DATA");
        expect(table.props().filters[0]).toStrictEqual({
            id: "area",
            column_id: "area_id",
            label: "area",
            allowMultiple: true,
            options: [{id: "region 1"}, {id: "region 2"}]
        });
        expect(table.props().filters[1]).toStrictEqual({
            id: "year",
            column_id: "year",
            label: "year",
            allowMultiple: false,
            options: "TEST YEAR FILTERS"
        });
        expect(table.props().indicators).toStrictEqual(["TEST INDICATORS"]);
        expect(table.props().selections).toStrictEqual({selectedFilterOptions: "TEST SELECTIONS"});
        expect(table.props().countryAreaFilterOption).toStrictEqual(
            {
                "children": [
                    {
                        "id": "region 1",
                    },
                    {
                        "id": "region 2",
                    },
                ],
                "id": "country",
            }
        );
    });

});

