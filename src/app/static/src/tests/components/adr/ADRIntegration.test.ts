import {Error} from "../../../app/generated";
import Vuex, {ActionTree} from "vuex";
import {mockADRState, mockRootState} from "../../mocks";
import {ADRActions} from "../../../app/store/adr/actions";
import {RootState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {shallowMount} from "@vue/test-utils";
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
                         partialRootState: Partial<RootState> = {}) => {
        const store = new Vuex.Store({
            state: mockRootState({...partialRootState}),
            modules: {
                adr: {
                    namespaced: true,
                    state: mockADRState({key, keyError: error, capacity: "admin"}),
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

    it("renders adr-access text as expected", () => {
        const renders = shallowMount(ADRIntegration, {store: createStore("123")});
        const store = renders.vm.$store
        expect(renders.findAll(ADRKey).length).toBe(1);
        const spans = (renders.find("#adr-capacity").findAll("span"))

        expect(spans.at(1).classes("has-tooltip")).toBeTruthy()
        expectTranslated(spans.at(0), "ADR access level", "Niveau d'accès ADR", store)
        expectTranslated(spans.at(1), "Read & Write", "Lire et écrire", store)
    });

    it("renders Tooltip text as expected", () => {
        const store = createStore("123")
        const mockTooltip = jest.fn()
        shallowMount(ADRIntegration,
            {
                store,
                directives: {"tooltip": mockTooltip}
            })

        expect(mockTooltip.mock.calls[0][1].value).toBe("You have full permission to push output files to ADR");
    });

    it("renders Tooltip text as expected in French", () => {
        const store = createStore("123")
        store.state.language = Language.fr
        const mockTooltip = jest.fn()
        shallowMount(ADRIntegration,
            {
                store,
                directives: {"tooltip": mockTooltip}
            })
        expect(mockTooltip.mock.calls[0][1].value).toBe("Vous avez la permission complète de pousser les fichiers de sortie vers ADR");
    });

    it("call getUserCanUpload action if key is provided", async() => {
        const wrapper = shallowMount(ADRIntegration, {store: createStore()});
        wrapper.vm.$store.state.adr.key = "123"
        expect(getUserCanUploadStub.mock.calls.length).toBe(1);
    });
});
