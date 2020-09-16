import {Error} from "../../../app/generated";
import Vuex, {ActionTree} from "vuex";
import {mockRootState} from "../../mocks";
import {RootActions} from "../../../app/store/root/actions";
import {RootState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {shallowMount} from "@vue/test-utils";
import ADRKey from "../../../app/components/adr/ADRKey.vue";
import ADRIntegration from "../../../app/components/adr/ADRIntegration.vue";
import SelectDataset from "../../../app/components/adr/SelectDataset.vue";
import {mutations, RootMutation} from "../../../app/store/root/mutations";
import { getters } from "../../../app/store/root/getters";

describe("adr integration", () => {

    const fetchKeyStub = jest.fn();
    const getDataStub = jest.fn();

    const createStore = (key: string = "", error: Error | null = null, partialRootState: Partial<RootState> = {}) => {
        const store = new Vuex.Store({
            state: mockRootState({...partialRootState, adrKey: key, adrKeyError: error}),
            actions: {
                getADRDatasets: getDataStub,
                fetchADRKey: fetchKeyStub
            } as Partial<RootActions> & ActionTree<RootState, RootState>,
            mutations,
            getters: getters
        });
        registerTranslations(store);
        return store;
    }

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("does not render if not logged in", () => {
        const store = createStore('', null, {currentUser: 'guest'})
        // store.getters.isGuest = true
        const rendered = shallowMount(ADRIntegration, {store});
        expect(rendered.findAll("div").length).toBe(0);
    });

    it("fetches ADR key if logged in", () => {
        shallowMount(ADRIntegration, {store: createStore()});
        expect(fetchKeyStub.mock.calls.length).toBe(1);
    });

    it("does not fetch ADR key if not logged in", () => {
        const store = createStore('', null, {currentUser: 'guest'})
        // store.getters.isGuest = true
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
        store.commit({type: RootMutation.UpdateADRKey, payload: "123"})
        expect(getDataStub.mock.calls.length).toBe(1);
    });

})