import {shallowMount} from "@vue/test-utils";
import SelectRelease from "../../../app/components/adr/SelectRelease.vue";
import Vuex from "vuex";
import {ADRMutation} from "../../../app/store/adr/mutations";
import registerTranslations from "../../../app/store/translations/registerTranslations";import {
    mockBaselineState,
    mockDataset,
    mockDatasetResource,
    mockError,
    mockErrorsState,
    mockProjectsState,
    mockRootState,
    mockShapeResponse
} from "../../mocks";
import {expectTranslated} from "../../testHelpers";
import TreeSelect from '@riophae/vue-treeselect';
import {Language} from "../../../app/store/translations/locales";

describe("select release", () => {

    const releasesArray = [
        {
            id: "releaseId",
            name: "releaseName",
            notes: "releaseNotes"
        }
    ]
    
    const getStore = (releases = releasesArray) => {
        const store = new Vuex.Store({
            state: mockRootState(),
            modules: {
                adr: {
                    namespaced: true,
                    state: {
                        // schemas: schemas,
                        // datasets: fakeRawDatasets,
                        releases,
                        // ...adrProps
                    },
                    actions: {
                        getDatasets: jest.fn(),
                        getReleases: jest.fn()
                    },
                    mutations: {
                        [ADRMutation.ClearReleases]: jest.fn(),
                        [ADRMutation.SetReleases]: jest.fn()
                    }
                },
            }
        });
        registerTranslations(store);
        return store;
    }

    afterEach(() => {
        jest.resetAllMocks();
    });
    // const getWrapper() = shallowMount(SelectRelease, {store: getStore()})

    it("renders select release", () => {
        let store = getStore()
        const rendered = shallowMount(SelectRelease, {store});
        rendered.setProps({newDatasetId: "datasetId"})
        expect(rendered.find("#selectRelease").exists()).toBe(true);
        expect(rendered.findAll("input").length).toBe(2);
        const labels = rendered.findAll("label")
        expect(labels.length).toBe(3);
        expectTranslated(labels.at(0), "Use latest data", "Utiliser les dernières données", store);
        expectTranslated(labels.at(1), "Select a release", "Sélectionnez une version", store);
        expectTranslated(labels.at(2), "Releases", "Versions", store);
        expect(rendered.findAll("help-circle-icon-stub").length).toBe(2);
        const select = rendered.find(TreeSelect);
        expect(select.props("multiple")).toBe(false);
        expect(select.props("searchable")).toBe(true);

        const expectedOptions = [
            {
                id: "releaseId",
                label: "releaseName",
                customLabel: `releaseName
                <div class="text-muted small" style="margin-top:-5px; line-height: 0.8rem">
                    releaseNotes<br/>
                </div>`
            }
        ]

        expect(select.props("options")).toStrictEqual(expectedOptions);
    });

    it("does not render select release if there are no releases", () => {
        const rendered = shallowMount(SelectRelease, {store: getStore([])});
        rendered.setProps({newDatasetId: "datasetId"})
        expect(rendered.find("#selectRelease").exists()).toBe(false);
    });

    it("does not render select release if no dataset is selected", () => {
        const rendered = shallowMount(SelectRelease, {store: getStore()});
        expect(rendered.find("#selectRelease").exists()).toBe(false);
    });

    it("can render tooltips in English", () => {
        const mockTooltip = jest.fn();
        const store = getStore()
        
        const rendered = shallowMount(SelectRelease, {store,
             directives: {"tooltip": mockTooltip} });
        rendered.setProps({newDatasetId: "datasetId"})

        expect(mockTooltip.mock.calls[0][1].value).toBe("Load the latest data, whether it is included in a release (a labelled version) or not");
        expect(mockTooltip.mock.calls[1][1].value).toBe("Load data from a particular labelled version, which may not be the latest data");
    });

    it("can render tooltips in French", () => {
        const mockTooltip = jest.fn();
        const store = getStore()
        store.state.language = Language.fr;
        
        const rendered = shallowMount(SelectRelease, {store,
             directives: {"tooltip": mockTooltip} });
        rendered.setProps({newDatasetId: "datasetId"})

        expect(mockTooltip.mock.calls[0][1].value).toBe("Chargez les dernières données, qu'elles soient incluses dans une version (une version étiquetée) ou non");
        expect(mockTooltip.mock.calls[1][1].value).toBe("Charger des données à partir d'une version étiquetée particulière, qui peuvent ne pas être les dernières données");
    });
});