import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vuex from 'vuex';
import {mockModelRunState} from "../../mocks";
import DownloadResults from "../../../app/components/downloadResults/DownloadResults.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {emptyState} from "../../../app/root";

const localVue = createLocalVue();

describe("Download Results component", () => {

    const createStore = () => {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                modelRun: {
                    namespaced: true,
                    state: mockModelRunState({ modelRunId: "testId" })
                }
            }
        });
        registerTranslations(store);
        return store;
    };

    it("renders as expected", () => {
        const store = createStore();
        const wrapper = shallowMount(DownloadResults, {store, localVue});
        const links = wrapper.findAll("a");

        expect(links.length).toBe(2);
        expect(links.at(0).attributes().href).toEqual("/download/spectrum/testId");
        expect(links.at(1).attributes().href).toEqual("/download/summary/testId");
    });
});