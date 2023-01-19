import {mount} from "@vue/test-utils";
import DownloadPlotData from "../../../../app/components/plots/download/DownloadPlotData.vue"
import Vuex from "vuex";
import {emptyState} from "../../../../app/root";
import {mockBaselineState, mockDownloadIndicatorData} from "../../../mocks";
import DownloadButton from "../../../../app/components/plots/download/downloadButton.vue";
import registerTranslations from "../../../../app/store/translations/registerTranslations";
import {expectTranslated} from "../../../testHelpers";
import {BaselineState} from "../../../../app/store/baseline/baseline";

describe("download plot data", () => {

    afterEach(() => {
        jest.clearAllMocks()
    })

    const mockDownloadFileActions = jest.fn()

    const stateData = {iso3: "MWI", country: "Malawi"}

    const {filteredData, unfilteredData} = mockDownloadIndicatorData()

    const createSut = (props: Partial<BaselineState> = stateData) => {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                baseline: {
                    namespaced: true,
                    state: mockBaselineState(props)
                },
                downloadIndicator: {
                    namespaced: true,
                    actions: {
                        downloadFile: mockDownloadFileActions
                    }
                }
            }
        })
        registerTranslations(store);
        return store
    }

    const getWrapper = (store = createSut()) => {
        return mount(DownloadPlotData, {
            store,
            propsData: {
                unfilteredData,
                filteredData
            }
        })
    }

    it('it renders download button props as expected ', async() => {
        const wrapper = getWrapper();
        expect(wrapper.find(DownloadButton).props()).toEqual(
            {
                "disabled": false,
                "name": "downloadIndicator"
            }
        )
        const span = wrapper.find("span")
        expectTranslated(span,
            "Download indicator",
            "Indicateur de téléchargement",
            "indicador de download",
            wrapper.vm.$store)
    });

    it('can trigger download with iso3 country prefix in filename', async() => {
        const wrapper = getWrapper();
        await wrapper.find(DownloadButton).vm.$emit("click")
        await expect(mockDownloadFileActions).toHaveBeenCalledTimes(1)

        const filename = mockDownloadFileActions.mock.calls[0][1].filename
        expect(filename.split(".")[0]).toContain("MWI_naomi_data-review_")
        expect(filename.split(".")[1]).toBe("xlsx")

        expect(mockDownloadFileActions.mock.calls[0][1].data).toStrictEqual(mockDownloadIndicatorData())
    });

    it('can use country prefix when iso3 data is empty', async () => {
        const wrapper = getWrapper(createSut({iso3: "", country: "Malawi"}));
        await wrapper.find(DownloadButton).vm.$emit("click")
        await expect(mockDownloadFileActions).toHaveBeenCalledTimes(1)

        const filename = mockDownloadFileActions.mock.calls[0][1].filename
        expect(filename.split(".")[0]).toContain("Malawi_naomi_data-review_")
    });
})