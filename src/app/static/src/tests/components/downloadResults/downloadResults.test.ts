import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vuex from 'vuex';
import {mockModelRunState} from "../../mocks";
import DownloadResults from "../../../app/components/downloadResults/DownloadResults.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {emptyState} from "../../../app/root";
import {expectTranslated} from "../../testHelpers";

const localVue = createLocalVue();

describe("Download Results component", () => {

    const createStore = () => {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                modelRun: {
                    namespaced: true,
                    state: mockModelRunState({modelRunId: "testId"})
                }
            }
        });
        registerTranslations(store);
        return store;
    };

    it("renders as expected", () => {
        const store = createStore();
        const wrapper = shallowMount(DownloadResults, {store, localVue});

        const headers = wrapper.findAll("h4");
        expectTranslated(headers.at(0), "Export model outputs for Spectrum",
            "Exporter des sorties de modèles pour Spectrum", store);
        expectTranslated(headers.at(1), "Download coarse age group outputs",
            "Télécharger les résultats grossiers du groupe d'âge", store);

        const links = wrapper.findAll("a");
        expect(links.length).toBe(3);
        expectTranslated(links.at(0), "Export", "Exporter", store);
        expect(links.at(0).attributes().href).toEqual("/download/spectrum/testId");
        expectTranslated(links.at(1), "Download", "Télécharger", store);
        expect(links.at(1).attributes().href).toEqual("/download/coarse-output/testId");
        expectTranslated(links.at(2), "Download", "Télécharger", store);
        expect(links.at(2).attributes().href).toEqual("/download/summary/testId")
    });
});
