import {testUploadComponent} from "./fileUploads";
import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import SurveyAndProgram from "../../../app/components/surveyAndProgram/SurveyAndProgram.vue";
import {
    mockAncResponse,
    mockBaselineState,
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
import ManageFile from "../../../app/components/files/ManageFile.vue";
import {Language} from "../../../app/store/translations/locales";
import {expectTranslated} from "../../testHelpers";

const localVue = createLocalVue();

describe("Survey and programme component", () => {

    beforeAll(() => {
        Vue.config.silent = true;
    });

    afterAll(() => {
        Vue.config.silent = false;
    })

    testUploadComponent("surveys", 0);
    testUploadComponent("program", 1);
    testUploadComponent("anc", 2);

    const createStore = (surveyAndProgramState: Partial<SurveyAndProgramState> = {selectedDataType: DataType.Survey}) => {
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

    it("renders choropleth controls if there is a selected data type", () => {
        const store = createStore({selectedDataType: DataType.Survey});
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});

        expect(wrapper.findAll("choropleth-stub").length).toBe(1);
        expect(wrapper.findAll("filters-stub").length).toBe(1);
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

    it("survey in included in data sources when survey data is present", () => {
        expectDataSource({survey: mockSurveyResponse(), selectedDataType: DataType.Survey},
            "Household Survey", "Enquête de ménage", "Inquérito aos agregados familiares", "2");
    });

    it("programme (ART) tab is enabled when programme data is present", () => {
        expectDataSource({program: mockProgramResponse(), selectedDataType: DataType.Program},
            "ART", "ART", "TARV", "1");
    });

    it("ANC tab is enabled when ANC data is present", () => {
        expectDataSource({anc: mockAncResponse(), selectedDataType: DataType.ANC},
            "ANC Testing", "Test de clinique prénatale", "Teste da CPN", "0");
    });

    function expectDataSource(state: Partial<SurveyAndProgramState>, englishName: string, frenchName: string,
                              portugueseName: string, id: string) {
        const store = createStore(state);
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});

        let options = wrapper.find("#data-source treeselect-stub").props("options");
        expect(options).toStrictEqual([{id, label: englishName}]);

        store.state.language = Language.fr;
        registerTranslations(store);
        options = wrapper.find("#data-source treeselect-stub").props("options");
        expect(options).toStrictEqual([{id, label:frenchName}]);

        store.state.language = Language.pt;
        registerTranslations(store);
        options = wrapper.find("#data-source treeselect-stub").props("options");
        expect(options).toStrictEqual([{id, label:portugueseName}]);
    }

    it("can change tabs", () => {
        const store = createStore(
            {
                anc: mockAncResponse(),
                survey: mockSurveyResponse(),
                program: mockProgramResponse(),
                selectedDataType: DataType.Program
            });
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});

        const dataSourceSelect = wrapper.find("#data-source treeselect-stub");
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

    it("passes survey response existing file name to manage file", () => {
        const store = createStore({survey: {filename: "existing file"} as any});
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        expect(wrapper.findAll(ManageFile).at(0).props("existingFileName")).toBe("existing file");
    });

    it("passes survey errored file to manage file", () => {
        const store = createStore({surveyErroredFile: "errored file"});
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        expect(wrapper.findAll(ManageFile).at(0).props("existingFileName")).toBe("errored file");
    });

    it("passes program response existing file name to manage file", () => {
        const store = createStore({program: {filename: "existing file"} as any});
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        expect(wrapper.findAll(ManageFile).at(1).props("existingFileName")).toBe("existing file");
    });

    it("passes program errored file to manage file", () => {
        const store = createStore({programErroredFile: "errored file"});
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        expect(wrapper.findAll(ManageFile).at(1).props("existingFileName")).toBe("errored file");
    });

    it("passes anc response existing file name to manage file", () => {
        const store = createStore({anc: {filename: "existing file"} as any});
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        expect(wrapper.findAll(ManageFile).at(2).props("existingFileName")).toBe("existing file");
    });

    it("passes anc errored file to manage file", () => {
        const store = createStore({ancErroredFile: "errored file"});
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        expect(wrapper.findAll(ManageFile).at(2).props("existingFileName")).toBe("errored file");
    });

    it("can return true when fromADR", async () => { 
        const store = createStore({
            survey: {
                "fromADR": true,
                "filters": {
                    "year": "TEST YEAR FILTERS"
                }
            } as any,
            anc: {
                "fromADR": true,
                "filters": {
                    "year": "TEST YEAR FILTERS"
                }
            } as any,
            program: {
                "fromADR": true,
                "filters": {
                    "year": "TEST YEAR FILTERS"
                }
            } as any
        });
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});

        expect(wrapper.findAll("manage-file-stub").at(0).props().fromADR).toBe(true);
        expect(wrapper.findAll("manage-file-stub").at(1).props().fromADR).toBe(true);
        expect(wrapper.findAll("manage-file-stub").at(2).props().fromADR).toBe(true);
    });

    it("can return false when not fromADR", async () => { 
        const store = createStore({
            survey: {
                "fromADR": "",
                "filters": {
                    "year": "TEST YEAR FILTERS"
                }
            } as any,
            anc: {
                "fromADR": "",
                "filters": {
                    "year": "TEST YEAR FILTERS"
                }
            } as any,
            program: {
                "fromADR": "",
                "filters": {
                    "year": "TEST YEAR FILTERS"
                }
            } as any
        });
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});

        expect(wrapper.findAll("manage-file-stub").at(0).props().fromADR).toBe(false);
        expect(wrapper.findAll("manage-file-stub").at(1).props().fromADR).toBe(false);
        expect(wrapper.findAll("manage-file-stub").at(2).props().fromADR).toBe(false);
        
    });

});

