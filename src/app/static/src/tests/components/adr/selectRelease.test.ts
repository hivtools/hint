import {shallowMount} from "@vue/test-utils";
import SelectRelease from "../../../app/components/adr/SelectRelease.vue";
import Vuex from "vuex";
import {ADRMutation} from "../../../app/store/adr/mutations";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {mockRootState} from "../../mocks";
import {expectTranslated} from "../../testHelpers";
import TreeSelect from '@riophae/vue-treeselect';
import {Language} from "../../../app/store/translations/locales";

describe("select release", () => {

    const releasesArray = [
        {
            id: "releaseId",
            name: "releaseName",
            notes: "releaseNotes"
        },
        {
            id: "releaseId2",
            name: "releaseName2",
            notes: null
        }
    ]
    const getReleasesMock = jest.fn();
    const clearReleasesMock = jest.fn();
    
    const getStore = (releases = releasesArray) => {
        const store = new Vuex.Store({
            state: mockRootState(),
            modules: {
                adr: {
                    namespaced: true,
                    state: {
                        releases
                    },
                    actions: {
                        getDatasets: jest.fn(),
                        getReleases: getReleasesMock
                    },
                    mutations: {
                        [ADRMutation.ClearReleases]: clearReleasesMock,
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

    it("renders select release", () => {
        let store = getStore()
        const rendered = shallowMount(SelectRelease, {store});
        rendered.setProps({datasetId: "datasetId"})
        expect(getReleasesMock.mock.calls.length).toBe(1);
        expect(rendered.find("#selectRelease").exists()).toBe(true);
        expect(rendered.findAll("input").length).toBe(2);
        const labels = rendered.findAll("label")
        expect(labels.length).toBe(3);
        expectTranslated(labels.at(0), "Use latest data", "Utiliser les dernières données",
            "Use os dados mais recentes", store);
        expectTranslated(labels.at(1), "Select a release", "Sélectionnez une version",
            "Selecione um lançamento", store);
        expectTranslated(labels.at(2), "Releases", "Versions",
            "Lançamentos", store);
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
            },
            {
                id: "releaseId2",
                label: "releaseName2",
                customLabel: `releaseName2
                <div class="text-muted small" style="margin-top:-5px; line-height: 0.8rem">
                    
                </div>`
            }
        ]

        expect(select.props("options")).toStrictEqual(expectedOptions);
    });

    it("does not render select release if there are no releases", () => {
        const rendered = shallowMount(SelectRelease, {store: getStore([])});
        rendered.setProps({datasetId: "datasetId"})
        expect(rendered.find("#selectRelease").exists()).toBe(false);
    });

    it("does not render select release if no dataset is selected", () => {
        const rendered = shallowMount(SelectRelease, {store: getStore()});
        expect(rendered.find("#selectRelease").exists()).toBe(false);
    });

    it("does not get releases if dataset id is cleared", () => {
        const rendered = shallowMount(SelectRelease, {store: getStore()});
        rendered.setProps({datasetId: "datasetId"})
        expect(getReleasesMock.mock.calls.length).toBe(1);
        rendered.setProps({datasetId: null})
        expect(getReleasesMock.mock.calls.length).toBe(1);
    });

    it("can render tooltips in English", () => {
        const mockTooltip = jest.fn();
        const store = getStore()
        
        const rendered = shallowMount(SelectRelease, {store,
             directives: {"tooltip": mockTooltip} });
        rendered.setProps({datasetId: "datasetId"})

        expect(mockTooltip.mock.calls[0][1].value).toBe("Load the latest data, whether it is included in a release (a labelled version) or not");
        expect(mockTooltip.mock.calls[1][1].value).toBe("Load data from a particular labelled version, which may not be the latest data");
    });

    it("can render tooltips in French", () => {
        const mockTooltip = jest.fn();
        const store = getStore()
        store.state.language = Language.fr;
        
        const rendered = shallowMount(SelectRelease, {store,
             directives: {"tooltip": mockTooltip} });
        rendered.setProps({datasetId: "datasetId"})

        expect(mockTooltip.mock.calls[0][1].value).toBe("Chargez les dernières données, qu'elles soient incluses dans une version (une version étiquetée) ou non");
        expect(mockTooltip.mock.calls[1][1].value).toBe("Charger des données à partir d'une version étiquetée particulière, qui peuvent ne pas être les dernières données");
    });

    it("can render tooltips in Portuguese", () => {
        const mockTooltip = jest.fn();
        const store = getStore()
        store.state.language = Language.pt;

        const rendered = shallowMount(SelectRelease, {store,
            directives: {"tooltip": mockTooltip} });
        rendered.setProps({datasetId: "datasetId"})

        expect(mockTooltip.mock.calls[0][1].value).toBe("Carregue os dados mais recentes, estejam incluídos em uma versão (uma versão rotulada) ou não");
        expect(mockTooltip.mock.calls[1][1].value).toBe("Carregar dados de uma determinada versão rotulada, que podem não ser os dados mais recentes");
    });

    it("radial toggles whether release tree select is disabled", async (done) => {
        let store = getStore()
        const rendered = shallowMount(SelectRelease, {store});
        rendered.setProps({datasetId: "datasetId"})
        const select = rendered.find(TreeSelect);
        expect(select.attributes("disabled")).toBe("true");
        const selectRelease = rendered.findAll("input").at(1)
        await selectRelease.trigger("click")
        expect(select.attributes("disabled")).toBeUndefined();
        done()
    });

    it("selecting a release emits release id", async (done) => {
        let store = getStore()
        const rendered = shallowMount(SelectRelease, {store});
        rendered.setProps({datasetId: "datasetId"})
        const selectRelease = rendered.findAll("input").at(1)
        await selectRelease.trigger("click")
        rendered.setData({releaseId: "releaseId"})
        expect(rendered.emitted("selected-dataset-release")).toStrictEqual([[undefined], ["releaseId"]])
        done()
    });

    it("selecting a release emits true valid", async (done) => {
        let store = getStore()
        const rendered = shallowMount(SelectRelease, {store});
        rendered.setProps({datasetId: "datasetId"})
        const selectRelease = rendered.findAll("input").at(1)
        await selectRelease.trigger("click")
        expect(rendered.emitted("valid")).toStrictEqual([[true], [false]])
        rendered.setData({releaseId: "releaseId"})
        expect(rendered.emitted("valid")).toStrictEqual([[true], [false], [true]])
        done()
    });

    it("changing datasetId clears releases and resets radial and releaseId", async () => {
        let store = getStore()
        const rendered = shallowMount(SelectRelease, {store});
        rendered.setProps({datasetId: "datasetId"})
        const selectRelease = rendered.findAll("input").at(1);
        await selectRelease.trigger("click")
        rendered.setData({releaseId: "releaseId"})
        expect(rendered.vm.$data.releaseId).toBe("releaseId");
        expect(rendered.vm.$data.choiceADR).toBe("useRelease");

        rendered.setProps({datasetId: "datasetId2"})
        expect(clearReleasesMock.mock.calls.length).toBe(2);
        const select = rendered.find(TreeSelect);
        expect(select.attributes("disabled")).toBe("true");
        expect(rendered.vm.$data.releaseId).toBe(undefined);
        expect(rendered.vm.$data.choiceADR).toBe("useLatest");
    });
});
