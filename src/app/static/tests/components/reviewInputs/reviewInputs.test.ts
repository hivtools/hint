import Vuex, {Store} from "vuex";
import {emptyState, RootState} from "../../../src/root";
import registerTranslations from "../../../src/store/translations/registerTranslations";
import PlotControlSet from "../../../src/components/plots/PlotControlSet.vue";
import FilterSet from "../../../src/components/plots/FilterSet.vue";
import Choropleth from "../../../src/components/plots/choropleth/Choropleth.vue";
import ReviewInputs from "../../../src/components/reviewInputs/ReviewInputs.vue";
import TimeSeries from "../../../src/components/plots/timeSeries/TimeSeries.vue";
import {
    mockAncResponse,
    mockError,
    mockReviewInputState,
    mockMetadataState,
    mockSurveyAndProgramState,
    mockSurveyResponse
} from "../../mocks";
import {
    initialSurveyAndProgramState,
    SurveyAndProgramState
} from "../../../src/store/surveyAndProgram/surveyAndProgram";
import {nextTick} from "vue";
import {shallowMountWithTranslate} from "../../testHelpers";
import ErrorAlert from "../../../src/components/ErrorAlert.vue";
import LoadingSpinner from "../../../src/components/LoadingSpinner.vue";
import DownloadTimeSeries from "../../../src/components/plots/timeSeries/downloadTimeSeries/DownloadTimeSeries.vue";
import Barchart from "../../../src/components/plots/bar/Barchart.vue";
import Table from "../../../src/components/plots/table/Table.vue";
import PopulationGrid from "../../../src/components/plots/population/PopulationGrid.vue";

describe("Review inputs page", () => {
    const getWrapper = (store: Store<RootState>) => {
        return shallowMountWithTranslate(ReviewInputs,
            store,
            {
                global: {
                    plugins: [store]
                }
            }
        )
    };

    const mockGetReviewInputMetadata = vi.fn();
    const mockGetInputComparisonDataset = vi.fn();
    const mockGetPopulationDataset = vi.fn()

    const mockDispatch = vi.fn();

    afterEach(() => {
        vi.resetAllMocks();
    });

    const createStore = (sapState: SurveyAndProgramState, dataFetched = true, error = false) => {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                surveyAndProgram: {
                    state: sapState
                },
                reviewInput: {
                    namespaced: true,
                    actions: {
                        getInputComparisonDataset: mockGetInputComparisonDataset,
                        getPopulationDataset: mockGetPopulationDataset
                    },
                    state: mockReviewInputState({loading: !dataFetched}),
                },
                metadata: {
                    namespaced: true,
                    actions: {
                        getReviewInputMetadata: mockGetReviewInputMetadata
                    },
                    state: error ? mockMetadataState({
                        reviewInputMetadataError: mockError("Metadata failed")
                    }) : {}
                }
            }
        });
        registerTranslations(store);
        store.dispatch = mockDispatch;
        return store;
    };

    test("renders as expected when no data fetched", async () => {
        const store = createStore(initialSurveyAndProgramState(), false);
        const wrapper = getWrapper(store);

        const plotTabs = wrapper.findAll(".nav-link");
        expect(plotTabs.length).toBe(2);
        expect(plotTabs[0].classes()).contains("active");
        expect(wrapper.findComponent(PlotControlSet).exists()).toBeFalsy();
        expect(wrapper.findComponent(FilterSet).exists()).toBeFalsy();
        expect(wrapper.findComponent(TimeSeries).exists()).toBeFalsy();
        expect(wrapper.findComponent(DownloadTimeSeries).exists()).toBeFalsy();
        expect(wrapper.findComponent(Choropleth).exists()).toBeFalsy();
        expect(wrapper.findComponent(PopulationGrid).exists()).toBeFalsy();
        expect(wrapper.findComponent(LoadingSpinner).exists()).toBeTruthy();
        expect(wrapper.findComponent(ErrorAlert).exists()).toBeFalsy();

        // Fetches review input metadata on mount
        await nextTick();
        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenNthCalledWith(1, "metadata/getReviewInputMetadata", {}, {root: true})
    });

    test("renders as expected when only survey data fetched", () => {
        const sapState = mockSurveyAndProgramState({
            survey: mockSurveyResponse()
        });
        const store = createStore(sapState);
        const wrapper = getWrapper(store);

        const plotTabs = wrapper.findAll(".nav-link");
        expect(plotTabs.length).toBe(2);
        expect(plotTabs[0].classes()).contains("active");
        expect(wrapper.findComponent(PlotControlSet).exists()).toBeTruthy();
        expect(wrapper.findComponent(FilterSet).exists()).toBeTruthy();
        expect(wrapper.findComponent(TimeSeries).exists()).toBeFalsy();
        expect(wrapper.findComponent(DownloadTimeSeries).exists()).toBeFalsy();
        expect(wrapper.findComponent(Choropleth).exists()).toBeTruthy();
        expect(wrapper.findComponent(LoadingSpinner).exists()).toBeFalsy();
        expect(wrapper.findComponent(ErrorAlert).exists()).toBeFalsy();
    });

    test("renders as expected when data has been fetched", async () => {
        const sapState = mockSurveyAndProgramState({
            anc: mockAncResponse(),
            survey: mockSurveyResponse()
        });
        const store = createStore(sapState);
        const wrapper = getWrapper(store);

        const plotTabs = wrapper.findAll(".nav-link");
        expect(plotTabs.length).toBe(5);
        expect(plotTabs[0].classes()).contains("active");
        expect(plotTabs[1].classes()).not.contains("active");
        expect(plotTabs[2].classes()).not.contains("active");
        expect(plotTabs[3].classes()).not.contains("active");
        expect(plotTabs[4].classes()).not.contains("active");
        expect(wrapper.findComponent(PlotControlSet).exists()).toBeTruthy();
        expect(wrapper.findComponent(FilterSet).exists()).toBeTruthy();
        expect(wrapper.findComponent(TimeSeries).exists()).toBeTruthy();
        expect(wrapper.findComponent(DownloadTimeSeries).exists()).toBeTruthy();
        expect(wrapper.findComponent(Choropleth).exists()).toBeFalsy();
        expect(wrapper.findComponent(Table).exists()).toBeFalsy();
        expect(wrapper.findComponent(Barchart).exists()).toBeFalsy();
        expect(wrapper.findComponent(PopulationGrid).exists()).toBeFalsy();
        expect(wrapper.findComponent(LoadingSpinner).exists()).toBeFalsy();
        expect(wrapper.findComponent(ErrorAlert).exists()).toBeFalsy();
        expect(wrapper.find("#plot-description").text()).toContain("Values are shown in red when");

        // Fetches review input metadata on mount
        await nextTick();
        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenNthCalledWith(1, "metadata/getReviewInputMetadata", {}, {root: true});

        plotTabs[1].trigger("click");
        await nextTick();
        expect(plotTabs[0].classes()).not.contains("active");
        expect(plotTabs[1].classes()).contains("active");
        expect(plotTabs[2].classes()).not.contains("active");
        expect(plotTabs[3].classes()).not.contains("active");
        expect(plotTabs[4].classes()).not.contains("active");
        expect(wrapper.findComponent(TimeSeries).exists()).toBeFalsy();
        expect(wrapper.findComponent(Choropleth).exists()).toBeTruthy();
        expect(wrapper.findComponent(Table).exists()).toBeFalsy();
        expect(wrapper.findComponent(Barchart).exists()).toBeFalsy();
        expect(wrapper.findComponent(PopulationGrid).exists()).toBeFalsy();
        expect(wrapper.findComponent(LoadingSpinner).exists()).toBeFalsy();
        expect(wrapper.findComponent(ErrorAlert).exists()).toBeFalsy();
        expect(wrapper.find("#plot-description").exists()).toBeFalsy();

        // No new fetch
        await nextTick();
        expect(mockDispatch).toHaveBeenCalledTimes(1);

        plotTabs[2].trigger("click");
        await nextTick();
        expect(plotTabs[0].classes()).not.contains("active");
        expect(plotTabs[1].classes()).not.contains("active");
        expect(plotTabs[2].classes()).contains("active");
        expect(plotTabs[3].classes()).not.contains("active");
        expect(plotTabs[4].classes()).not.contains("active");
        expect(wrapper.findComponent(TimeSeries).exists()).toBeFalsy();
        expect(wrapper.findComponent(Choropleth).exists()).toBeFalsy();
        expect(wrapper.findComponent(Table).exists()).toBeTruthy();
        expect(wrapper.findComponent(Barchart).exists()).toBeFalsy();
        expect(wrapper.findComponent(PopulationGrid).exists()).toBeFalsy();
        expect(wrapper.findComponent(LoadingSpinner).exists()).toBeFalsy();
        expect(wrapper.findComponent(ErrorAlert).exists()).toBeFalsy();
        expect(wrapper.find("#plot-description").exists()).toBeFalsy();

        // Fetches input comparison data when opening an input comparison plot
        await nextTick();
        expect(mockDispatch).toHaveBeenCalledTimes(2);
        expect(mockDispatch).toHaveBeenNthCalledWith(2, "reviewInput/getInputComparisonDataset", {}, {root: true});

        plotTabs[3].trigger("click");
        await nextTick();
        expect(plotTabs[0].classes()).not.contains("active");
        expect(plotTabs[1].classes()).not.contains("active");
        expect(plotTabs[2].classes()).not.contains("active");
        expect(plotTabs[3].classes()).contains("active");
        expect(plotTabs[4].classes()).not.contains("active");
        expect(wrapper.findComponent(TimeSeries).exists()).toBeFalsy();
        expect(wrapper.findComponent(Choropleth).exists()).toBeFalsy();
        expect(wrapper.findComponent(Table).exists()).toBeFalsy();
        expect(wrapper.findComponent(Barchart).exists()).toBeTruthy();
        expect(wrapper.findComponent(PopulationGrid).exists()).toBeFalsy();
        expect(wrapper.findComponent(LoadingSpinner).exists()).toBeFalsy();
        expect(wrapper.findComponent(ErrorAlert).exists()).toBeFalsy();
        expect(wrapper.find("#plot-description").exists()).toBeFalsy();

        // It will fetch in tested because action is mocked, but with a real store this won't increment
        await nextTick();
        expect(mockDispatch).toHaveBeenCalledTimes(3);

        plotTabs[4].trigger("click");
        await nextTick();
        expect(plotTabs[0].classes()).not.contains("active");
        expect(plotTabs[1].classes()).not.contains("active");
        expect(plotTabs[2].classes()).not.contains("active");
        expect(plotTabs[3].classes()).not.contains("active");
        expect(plotTabs[4].classes()).contains("active");
        expect(wrapper.findComponent(TimeSeries).exists()).toBeFalsy();
        expect(wrapper.findComponent(Choropleth).exists()).toBeFalsy();
        expect(wrapper.findComponent(Table).exists()).toBeFalsy();
        expect(wrapper.findComponent(Barchart).exists()).toBeFalsy();
        expect(wrapper.findComponent(PopulationGrid).exists()).toBeTruthy();
        expect(wrapper.findComponent(LoadingSpinner).exists()).toBeFalsy();
        expect(wrapper.findComponent(ErrorAlert).exists()).toBeFalsy();
        expect(wrapper.find("#plot-description").exists()).toBeFalsy();

        // Fetches population metadata
        await nextTick();
        expect(mockDispatch).toHaveBeenCalledTimes(4);
        expect(mockDispatch).toHaveBeenNthCalledWith(4, "reviewInput/getPopulationDataset", {}, {root: true});
    });

    test("renders as expected when error fetching review input metadata", async () => {
        const sapState = mockSurveyAndProgramState({
            anc: mockAncResponse(),
            survey: mockSurveyResponse()
        });
        const store = createStore(sapState, true, true);
        const wrapper = getWrapper(store);

        expect(wrapper.findComponent(PlotControlSet).exists()).toBeFalsy();
        expect(wrapper.findComponent(FilterSet).exists()).toBeFalsy();
        expect(wrapper.findComponent(TimeSeries).exists()).toBeFalsy();
        expect(wrapper.findComponent(DownloadTimeSeries).exists()).toBeFalsy();
        expect(wrapper.findComponent(Choropleth).exists()).toBeFalsy();
        expect(wrapper.findComponent(LoadingSpinner).exists()).toBeFalsy();
        const errorAlert = wrapper.findComponent(ErrorAlert);
        expect(errorAlert.exists()).toBeTruthy();
        expect(errorAlert.props("error")).toStrictEqual({
            error: "OTHER_ERROR",
            detail: "Metadata failed"
        });
    })
});
