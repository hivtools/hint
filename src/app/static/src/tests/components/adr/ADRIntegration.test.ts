import Vuex, {type ActionTree} from "vuex";
import {mockADRState, mockBaselineState, mockDatasetResource, mockRootState} from "../../mocks";
import type {ADRActions} from "../../../app/store/adr/actions";
import type {RootState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {shallowMount} from "@vue/test-utils";
import ADRIntegration from "../../../app/components/adr/ADRIntegration.vue";
import SelectDataset from "../../../app/components/adr/ADRInputDataset.vue";
import {mutations} from "../../../app/store/adr/mutations";
import {getters} from "../../../app/store/root/getters";
import type {ADRState} from "../../../app/store/adr/adr";
import {Language} from "../../../app/store/translations/locales";
import {expectTranslated, shallowMountWithTranslate} from "../../testHelpers";
import type {BaselineState} from "../../../app/store/baseline/baseline";

describe("adr integration", () => {

    const getUserCanUploadStub = vi.fn();

    const fakeDataset = {
        id: "id1",
        title: "Some data",
        url: "www.adr.com/naomi-data/some-data",
        organization: {id: "org-id"},
        resources: {
            pjnz: null,
            program: null,
            pop: null,
            survey: null,
            shape: mockDatasetResource({
                url: "shape.geojson",
                lastModified: "2020-11-03",
                metadataModified: "2020-11-04"
            }),
            anc: null
        }
    }

    const createStore = (partialRootState: Partial<RootState> = {},
                         canUpload = false,
                         baselineState?: Partial<BaselineState>) => {
        const store = new Vuex.Store({
            state: mockRootState({...partialRootState}),
            modules: {
                adr: {
                    namespaced: true,
                    state: mockADRState({userCanUpload: canUpload}),
                    actions: {
                        getUserCanUpload: getUserCanUploadStub
                    } as Partial<ADRActions> & ActionTree<ADRState, RootState>,
                    mutations
                },
                baseline: {
                    namespaced: true,
                    state: mockBaselineState(baselineState),
                }
            },
            getters: getters
        });
        registerTranslations(store);
        return store;
    }

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("does not render if not logged in", () => {
        const store = createStore({currentUser: 'guest'});
        const rendered = shallowMount(ADRIntegration, {global: { plugins: [store] }});
        expect(rendered.findAll("div").length).toBe(0);
        expect(rendered.findAllComponents(SelectDataset).length).toBe(0);
    });

    it("renders select dataset widget if logged in", () => {
        const rendered = shallowMount(ADRIntegration, {global: {plugins: [createStore()]}});
        expect(rendered.findAllComponents(SelectDataset).length).toBe(1);
    });

    it("renders adr-access text for writers as expected", () => {
        const mockTooltip = vi.fn()
        const store = createStore({}, true, {selectedDataset: fakeDataset});
        const renders = shallowMountWithTranslate(ADRIntegration, store,
            {
                global: {
                    plugins: [store],
                    directives: {"tooltip": mockTooltip}
                }
            });
        const spans = renders.find("#adr-capacity").findAll("span")

        expectTranslated(spans[0], "ADR access level:", "Niveau d'accès ADR:", "Nível de acesso ADR:", store)
        expectTranslated(spans[1], "Read & Write", "Lecture et écriture", "Leitura e Escrita", store)
        expect(mockTooltip.mock.calls[0][1].value).toBe("You have read and write permissions for this dataset and may push output files to ADR");
    });

    it("renders adr-access text for readers as expected", () => {
        const mockTooltip = vi.fn();
        const store = createStore({}, false, {selectedDataset: fakeDataset});
        const renders = shallowMountWithTranslate(ADRIntegration, store,
            {
                global: {
                    plugins: [store],
                    directives: {"tooltip": mockTooltip}
                }
            });
        const spans = (renders.find("#adr-capacity").findAll("span"))

        expectTranslated(spans[0], "ADR access level:", "Niveau d'accès ADR:","Nível de acesso ADR:", store)
        expectTranslated(spans[1], "Read only", "Lecture seule", "Apenas leitura", store)
        expect(mockTooltip.mock.calls[0][1].value).toBe("You do not currently have write permissions for this dataset and will be unable to upload files to ADR");
    });

    it("renders Tooltip text for writers as expected in French", () => {
        const store = createStore({}, true, {selectedDataset: fakeDataset})
        store.state.language = Language.fr
        const mockTooltip = vi.fn()
        shallowMount(ADRIntegration,
            {
                global: {
                    plugins: [store],
                    directives: {"tooltip": mockTooltip}
                }
            })
        expect(mockTooltip.mock.calls[0][1].value).toBe("Vous bénéficiez des droits de lecture et d’écriture pour cet ensemble de données et vous pouvez envoyer les fichiers de sortie vers le ADR");
    });

    it("renders Tooltip text for readers as expected in French", () => {
        const store = createStore({}, false, {selectedDataset: fakeDataset})
        store.state.language = Language.fr
        const mockTooltip = vi.fn()
        shallowMount(ADRIntegration,
            {
                global: {
                    plugins: [store],
                    directives: {"tooltip": mockTooltip}
                }
            })
        expect(mockTooltip.mock.calls[0][1].value).toBe("Vous ne disposez actuellement d’aucun droit d’écriture pour cet ensemble de données et vous ne pourrez pas télécharger de fichiers vers le ADR");
    });

    it("renders Tooltip text for writers as expected in Portuguese", () => {
        const store = createStore({}, true, {selectedDataset: fakeDataset})
        store.state.language = Language.pt
        const mockTooltip = vi.fn()
        shallowMount(ADRIntegration,
            {
                global: {
                    plugins: [store],
                    directives: {"tooltip": mockTooltip}
                }
            })
        expect(mockTooltip.mock.calls[0][1].value).toBe("Tem permissões de leitura e escrita para este conjunto de dados e pode carregar ficheiros de saída para o ADR");
    });

    it("renders Tooltip text for readers as expected in Portuguese", () => {
        const store = createStore({}, false, {selectedDataset: fakeDataset})
        store.state.language = Language.pt
        const mockTooltip = vi.fn()
        shallowMount(ADRIntegration,
            {
                global: {
                    plugins: [store],
                    directives: {"tooltip": mockTooltip}
                }
            })
        expect(mockTooltip.mock.calls[0][1].value).toBe("Atualmente não tem permissões de escrita para este conjunto de dados e não poderá carregar ficheiros para o ADR");
    });

    it("call getUserCanUpload action if dataset is selected", () => {
        const store = createStore()
        const rendered = shallowMount(ADRIntegration, {global: { plugins: [store] }});
        (rendered.vm as any).$options.watch.selectedDataset.call(rendered.vm)
        expect(getUserCanUploadStub.mock.calls.length).toBe(1);
    });

    it("call getUserCanUpload action if dataset is selected when page is loaded",  () => {
        const store = createStore({}, false, {selectedDataset: fakeDataset});

        shallowMount(ADRIntegration, {global: { plugins: [store] }});
        expect(getUserCanUploadStub.mock.calls.length).toBe(1);
    });

    it("does not call getUserCanUpload action when dataset is not selected", () => {
        const store = createStore();
        shallowMount(ADRIntegration, {global: { plugins: [store] }});
        expect(getUserCanUploadStub.mock.calls.length).toBe(0);
    });

    it("does not render permission displayText if dataset is not selected", () => {
        const store = createStore()
        const renders = shallowMount(ADRIntegration, {global: { plugins: [store] }});
        expect(renders.find("#adr-capacity").exists()).toBeFalsy()
    });
});
