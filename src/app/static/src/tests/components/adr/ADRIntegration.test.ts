import {Error} from "../../../app/generated";
import Vuex, {ActionTree} from "vuex";
import {mockADRState, mockRootState} from "../../mocks";
import {ADRActions} from "../../../app/store/adr/actions";
import {emptyState, RootState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {shallowMount, Wrapper} from "@vue/test-utils";
import ADRKey from "../../../app/components/adr/ADRKey.vue";
import ADRIntegration from "../../../app/components/adr/ADRIntegration.vue";
import SelectDataset from "../../../app/components/adr/SelectDataset.vue";
import {ADRMutation, mutations} from "../../../app/store/adr/mutations";
import {getters} from "../../../app/store/root/getters";
import {ADRState} from "../../../app/store/adr/adr";
import {prefixNamespace} from "../../../app/utils";
import {Language} from "../../../app/store/translations/locales";
import {expectTranslated} from "../../testHelpers";

describe("adr integration", () => {

    const fetchKeyStub = jest.fn();
    const getDataStub = jest.fn();
    const getUserCanUploadStub = jest.fn()

    const createStore = (key: string = "", error: Error | null = null,
                         partialRootState: Partial<RootState> = {}, capacity = "") => {
        const store = new Vuex.Store({
            state: mockRootState({...partialRootState}),
            modules: {
                adr: {
                    namespaced: true,
                    state: mockADRState({key, keyError: error, capacity: capacity}),
                    actions: {
                        getDatasets: getDataStub,
                        fetchKey: fetchKeyStub,
                        getUserCanUpload: getUserCanUploadStub,
                    } as Partial<ADRActions> & ActionTree<ADRState, RootState>,
                    mutations
                }
            },
            getters: getters
        });
        registerTranslations(store);
        return store;
    }

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("does not render if not logged in", () => {
        const store = createStore('', null, {currentUser: 'guest'});
        const rendered = shallowMount(ADRIntegration, {store});
        expect(rendered.findAll("div").length).toBe(0);
    });

    it("fetches ADR key if logged in", () => {
        shallowMount(ADRIntegration, {store: createStore()});
        expect(fetchKeyStub.mock.calls.length).toBe(1);
    });

    it("does not fetch ADR key if not logged in", () => {
        const store = createStore('', null, {currentUser: 'guest'})
        shallowMount(ADRIntegration, {store});
        expect(fetchKeyStub.mock.calls.length).toBe(0);
    });

    it("renders adr-key widget", () => {
        const rendered = shallowMount(ADRIntegration, {store: createStore()});
        expect(rendered.findAll(ADRKey).length).toBe(1);
    });

    it("does not render select dataset widget if key is not present", () => {
        const rendered = shallowMount(ADRIntegration, {store: createStore()});
        expect(rendered.findAll(SelectDataset).length).toBe(0);
    });

    it("renders select dataset widget if key is present", () => {
        const rendered = shallowMount(ADRIntegration, {store: createStore("123")});
        expect(rendered.findAll(SelectDataset).length).toBe(1);
    });

    it("fetches datasets when key changes", () => {
        const store = createStore();
        shallowMount(ADRIntegration, {store});
        store.commit(prefixNamespace("adr", ADRMutation.UpdateKey),"123");
        expect(getDataStub.mock.calls.length).toBe(1);
    });

    it("renders adr-access text for admin  users as expected", () => {
        const mockTooltip = jest.fn()
        const renders = shallowMount(ADRIntegration,
            {
                store: createStore("123",
                    null, {}, "admin"),
                directives: {"tooltip": mockTooltip}
            });
        const store = renders.vm.$store
        expect(renders.findAll(ADRKey).length).toBe(1);
        const spans = (renders.find("#adr-capacity").findAll("span"))

        expectTranslated(spans.at(0), "ADR access level", "Niveau d'accès ADR", store)
        expectTranslated(spans.at(1), "Read & Write", "Lire et écrire", store)
        expect(mockTooltip.mock.calls[0][1].value).toBe("You have full permission to push output files to ADR");
    });

    it("renders adr-access text for editors as expected", () => {
        const mockTooltip = jest.fn()
        const renders = shallowMount(ADRIntegration,
            {
                store: createStore("123",
                    null, {}, "editor"),
                directives: {"tooltip": mockTooltip}
            });
        const store = renders.vm.$store
        expect(renders.findAll(ADRKey).length).toBe(1);
        const spans = (renders.find("#adr-capacity").findAll("span"))

        expectTranslated(spans.at(0), "ADR access level", "Niveau d'accès ADR", store)
        expectTranslated(spans.at(1), "Read & Write", "Lire et écrire", store)
        expect(mockTooltip.mock.calls[0][1].value).toBe("You have the required permission to push output files to ADR");
    });

    it("renders adr-access text for members as expected", () => {
        const mockTooltip = jest.fn()
        const renders = shallowMount(ADRIntegration,
            {
                store: createStore("123",
                    null, {}, "member"),
                directives: {"tooltip": mockTooltip}
            });
        const store = renders.vm.$store
        expect(renders.findAll(ADRKey).length).toBe(1);
        const spans = (renders.find("#adr-capacity").findAll("span"))

        expectTranslated(spans.at(0), "ADR access level", "Niveau d'accès ADR", store)
        expectTranslated(spans.at(1), "Read", "Lire", store)
        expect(mockTooltip.mock.calls[0][1].value).toBe("You don't have permission to push data to ADR");
    });

    it("renders Tooltip text for admin as expected in French", () => {
        const store = createStore("123", null, {}, "admin")
        store.state.language = Language.fr
        const mockTooltip = jest.fn()
        shallowMount(ADRIntegration,
            {
                store,
                directives: {"tooltip": mockTooltip}
            })
        expect(mockTooltip.mock.calls[0][1].value).toBe("Vous avez la permission complète de pousser les fichiers de sortie vers ADR");
    });

    it("renders Tooltip text for editor as expected in French", () => {
        const store = createStore("123", null, {}, "editor")
        store.state.language = Language.fr
        const mockTooltip = jest.fn()
        shallowMount(ADRIntegration,
            {
                store,
                directives: {"tooltip": mockTooltip}
            })
        expect(mockTooltip.mock.calls[0][1].value).toBe("Vous avez l'autorisation requise pour pousser les fichiers de sortie vers ADR");
    });

    it("renders Tooltip text for member as expected in French", () => {
        const store = createStore("123", null, {}, "member")
        store.state.language = Language.fr
        const mockTooltip = jest.fn()
        shallowMount(ADRIntegration,
            {
                store,
                directives: {"tooltip": mockTooltip}
            })
        expect(mockTooltip.mock.calls[0][1].value).toBe("Vous n'êtes pas autorisé à envoyer des données vers ADR");
    });

    it("call getUserCanUpload action if key is provided", async() => {
        const wrapper = shallowMount(ADRIntegration, {store: createStore()});
        wrapper.vm.$store.state.adr.key = "123"
        expect(getUserCanUploadStub.mock.calls.length).toBe(1);
    });
});
