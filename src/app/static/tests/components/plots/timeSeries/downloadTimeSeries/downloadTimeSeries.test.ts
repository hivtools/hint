import Vuex from "vuex";
import {emptyState} from "../../../../../src/root";
import {
    mockBaselineState,
    mockControlSelection,
    mockFilterSelection, mockPlotDataState,
    mockPlotSelectionsState, mockReviewInputDataset, mockReviewInputState
} from "../../../../mocks";
import DownloadButton from "../../../../../src/components/plots/timeSeries/downloadTimeSeries/DownloadButton.vue";
import registerTranslations from "../../../../../src/store/translations/registerTranslations";
import {expectTranslated, mountWithTranslate} from "../../../../testHelpers";
import {BaselineState} from "../../../../../src/store/baseline/baseline";
import DownloadTimeSeries
    from "../../../../../src/components/plots/timeSeries/downloadTimeSeries/DownloadTimeSeries.vue";
import {InputTimeSeriesData} from "../../../../../src/generated";
import {exportService} from "../../../../../src/dataExportService";
import {Mock} from "vitest";
import {PlotData} from "../../../../../src/store/plotData/plotData";
import {ReviewInputState} from "../../../../../src/store/reviewInput/reviewInput";

vi.mock("../../../../../src/dataExportService", () => ({
    exportService: vi.fn(() => ({
        addUnfilteredData: vi.fn().mockReturnThis(),
        addFilteredData: vi.fn().mockReturnThis(),
        download: vi.fn()
    }))
}));

describe("download indicator", () => {

    beforeEach(() => {
        vi.clearAllMocks()
    });

    const baselineData = {iso3: "MWI", country: "Malawi"}

    const mockFilteredDataset = [{x: "data"}] as any as InputTimeSeriesData;
    const mockUnfilteredDataset = [
        {x: "data"},
        {x: "data2"}
    ] as any as InputTimeSeriesData;

    const reviewInputDatasets = {
        anc: mockReviewInputDataset({
            data: mockUnfilteredDataset
        })
    }

    const createStore = (baseline: Partial<BaselineState> = baselineData,
                         datasets: ReviewInputState["datasets"] = reviewInputDatasets) => {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                baseline: {
                    namespaced: true,
                    state: mockBaselineState(baseline)
                },
                plotData: {
                    namespaced: true,
                    state: mockPlotDataState({
                        timeSeries: mockFilteredDataset
                    })
                },
                reviewInput: {
                    namespaced: true,
                    state: mockReviewInputState({
                        datasets: datasets
                    })
                },
                plotSelections: {
                    namespaced: true,
                    state: mockPlotSelectionsState({
                        timeSeries: {
                            controls: [mockControlSelection({
                                id: "time_series_data_source",
                                selection: [
                                    {label: "ANC", id: "anc"}
                                ],
                            })],
                            filters: [mockFilterSelection({
                                filterId: "time_series_data_source",
                                stateFilterId: "time_series_data_source",
                                label: "Data source filter",
                                multiple: false,
                                selection: [],
                            })]
                        }
                    })
                }
            }
        })
        registerTranslations(store);
        return store
    }

    const mockExportService = exportService as any as Mock;

    const getWrapper = (store = createStore()) => {
        return mountWithTranslate(DownloadTimeSeries, store, {
            global: {
                plugins: [store]
            }
        })
    }

    it('it renders download button props as expected ', async() => {
        const wrapper = getWrapper();
        expect(wrapper.findComponent(DownloadButton).props()).toEqual(
            {
                "disabled": false,
                "name": "downloadIndicator"
            }
        )
        const span = wrapper.find("span")
        expectTranslated(span,
            "Download data",
            "Télécharger les données",
            "Descarregar dados",
            (wrapper.vm as any).$store)
    });

    it('can trigger download with iso3 country prefix in filename', async() => {
        const wrapper = getWrapper();
        const button = wrapper.find("#indicator-download").find("button");
        expect(button.element.disabled).toBe(false);
        await button.trigger("click");

        expect(mockExportService).toHaveBeenCalledTimes(1);
        expect(mockExportService.mock.calls[0][0].data).toStrictEqual({
            filteredData: mockFilteredDataset,
            unfilteredData: mockUnfilteredDataset
        });
        const filename = mockExportService.mock.calls[0][0].filename
        expect(filename.split(".")[0]).toContain("MWI_naomi_data-review_")
        expect(filename.split(".")[1]).toBe("xlsx")
    });

    it('can use country prefix when iso3 data is empty', async() => {
        const wrapper = getWrapper(createStore({iso3: "", country: "Malawi"}));
        const button = wrapper.find("#indicator-download").find("button");
        expect(button.element.disabled).toBe(false);
        await button.trigger("click")
        expect(mockExportService).toHaveBeenCalledTimes(1);

        const filename = mockExportService.mock.calls[0][0].filename
        expect(filename.split(".")[0]).toContain("Malawi_naomi_data-review_")
        expect(filename.split(".")[1]).toBe("xlsx")
    });

    it("dows not download file twice when clicked in rapid succession", async() => {
        const wrapper = getWrapper();
        const button = wrapper.find("#indicator-download").find("button");
        expect(button.element.disabled).not.toBeTruthy();
        await button.trigger("click");
        await button.trigger("click");

        expect(mockExportService).toHaveBeenCalledTimes(1);
    })

    it('does not download file when indicator data is empty', async() => {
        const wrapper = getWrapper(createStore({}, {}));

        const button = wrapper.find("#indicator-download").find("button");
        expect(button.element.disabled).toBeTruthy();

        (wrapper.vm as any).download();
        expect(mockExportService).toHaveBeenCalledTimes(0);
    });
})
