import {mount} from "@vue/test-utils";
import DownloadPlotData from "../../../../app/components/plots/download/DownloadPlotData.vue"
import Vuex from "vuex";
import {emptyState} from "../../../../app/root";
import {mockPlottingSelections} from "../../../mocks";
import DownloadButton from "../../../../app/components/plots/download/downloadButton.vue";
import {getters} from "../../../../app/store/plottingSelections/getters";
import registerTranslations from "../../../../app/store/translations/registerTranslations";
import {expectTranslated} from "../../../testHelpers";

describe("download plot data", () => {
    const downloadFile = jest.spyOn(getters, "downloadFile")
    const mockDownloadFile = jest.fn().mockImplementation(() => downloadFile)

    const createSut = () => {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                plottingSelections: {
                    namespaced: true,
                    state: mockPlottingSelections(),
                    getters: {
                        downloadFile: mockDownloadFile
                    }
                }
            }
        })
        registerTranslations(store);
        return store
    }

    const getWrapper = () => {
        return mount(DownloadPlotData, {
            store: createSut()
        })
    }

    it('it renders download button props as expected ', async() => {
        const wrapper = getWrapper();
        expect(wrapper.find(DownloadButton).props()).toEqual(
            {
                "disabled": false,
                "name": "downloadPlotData"
            }
        )
        const span = wrapper.find("span")
        expectTranslated(span,
            "Download plot data",
            "Télécharger les données de parcelle",
            "Baixar dados de plotagem",
            wrapper.vm.$store)
    });

    it('can trigger download', async() => {
        const wrapper = getWrapper();
        await wrapper.find(DownloadButton).vm.$emit("click")
        await expect(mockDownloadFile).toHaveBeenCalledTimes(1)
    });
})