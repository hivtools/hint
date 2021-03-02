import {createLocalVue, shallowMount, mount} from '@vue/test-utils';
import Vuex from 'vuex';
import {mockModelCalibrateState} from "../../mocks";
import DownloadResults from "../../../app/components/downloadResults/DownloadResults.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {emptyState} from "../../../app/root";
import {expectTranslated} from "../../testHelpers";
import UploadModal from "../../../app/components/downloadResults/UploadModal.vue";
import Vue from "vue"
import Modal from "../../../app/components/Modal.vue";

const localVue = createLocalVue();

describe("Download Results component", () => {

    const createStore = () => {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                modelCalibrate: {
                    namespaced: true,
                    state: mockModelCalibrateState({calibrateId: "testId"})
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
        expectTranslated(headers.at(2), "Download summary report",
            "Télécharger le rapport de synthèse", store);
        expectTranslated(headers.at(3), "Upload to ADR",
            "Télécharger vers ADR", store);

        const links = wrapper.findAll("a");
        expect(links.length).toBe(4);
        expectTranslated(links.at(0), "Export", "Exporter", store);
        expect(links.at(0).attributes().href).toEqual("/download/spectrum/testId");
        expectTranslated(links.at(1), "Download", "Télécharger", store);
        expect(links.at(1).attributes().href).toEqual("/download/coarse-output/testId");
        expectTranslated(links.at(2), "Download", "Télécharger", store);
        expect(links.at(2).attributes().href).toEqual("/download/summary/testId")
        expectTranslated(links.at(3), "Upload", "Télécharger", store);
    });

    it(`renders, opens and closes dialog as expected`, async() => {
        const store = createStore();
        const wrapper = mount(DownloadResults,
            {
                store,
                localVue,
                stubs: ["upload-modal"],
                data() {
                    return {
                        modalOpen: false
                    }
                }
            });

        expect(wrapper.find(UploadModal).exists()).toBe(true)
        expect(wrapper.vm.$data.modelOpen).toBe(false)

        const upload = wrapper.find("#upload").find("a")
        await upload.trigger("click")
        expect(wrapper.vm.$data.modelOpen).toBe(true)
    })
});
