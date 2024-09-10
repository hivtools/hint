import Vuex, {Store} from "vuex";
import {emptyState, RootState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import PlotControlSet from "../../../app/components/plots/PlotControlSet.vue";
import FilterSet from "../../../app/components/plots/FilterSet.vue";
import Choropleth from "../../../app/components/plots/choropleth/Choropleth.vue";
import ReviewInputs from "../../../app/components/reviewInputs/ReviewInputs.vue";
import TimeSeries from "../../../app/components/plots/timeSeries/TimeSeries.vue";
import {
    mockAncResponse,
    mockError,
    mockReviewInputState,
    mockMetadataState,
    mockSurveyAndProgramState,
    mockSurveyResponse
} from "../../mocks";
import {initialSurveyAndProgramState} from "../../../app/store/surveyAndProgram/surveyAndProgram";
import {nextTick} from "vue";
import {shallowMountWithTranslate} from "../../testHelpers";
import ErrorAlert from "../../../app/components/ErrorAlert.vue";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";

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

    const createStore = (dataFetched: boolean, error: boolean = false) => {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                surveyAndProgram: {
                    state: dataFetched ? mockSurveyAndProgramState({
                        anc: mockAncResponse(),
                        survey: mockSurveyResponse()
                    }) : initialSurveyAndProgramState()
                },
                reviewInput: {
                    namespaced: true,
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
        return store;
    };

    test("renders as expected when no data fetched", () => {
        const store = createStore(false);
        const wrapper = getWrapper(store);

        const plotTabs = wrapper.findAll(".nav-link");
        expect(plotTabs.length).toBe(2);
        expect(plotTabs[0].classes()).contains("active");
        expect(plotTabs[1].classes()).not.contains("active");
        expect(wrapper.findComponent(PlotControlSet).exists()).toBeFalsy();
        expect(wrapper.findComponent(FilterSet).exists()).toBeFalsy();
        expect(wrapper.findComponent(TimeSeries).exists()).toBeFalsy();
        expect(wrapper.findComponent(Choropleth).exists()).toBeFalsy();
        expect(wrapper.findComponent(LoadingSpinner).exists()).toBeTruthy();
        expect(wrapper.findComponent(ErrorAlert).exists()).toBeFalsy();
    });

    test("renders as expected when data has been fetched", async () => {
        const store = createStore(true);
        const wrapper = getWrapper(store);

        const plotTabs = wrapper.findAll(".nav-link");
        expect(plotTabs.length).toBe(2);
        expect(plotTabs[0].classes()).contains("active");
        expect(plotTabs[1].classes()).not.contains("active");
        expect(wrapper.findComponent(PlotControlSet).exists()).toBeTruthy();
        expect(wrapper.findComponent(FilterSet).exists()).toBeTruthy();
        expect(wrapper.findComponent(TimeSeries).exists()).toBeTruthy();
        expect(wrapper.findComponent(Choropleth).exists()).toBeFalsy();
        expect(wrapper.findComponent(LoadingSpinner).exists()).toBeFalsy();
        expect(wrapper.findComponent(ErrorAlert).exists()).toBeFalsy();
        expect(wrapper.find("#plot-description").text()).toContain("Values are shown in red when");

        plotTabs[1].trigger("click");
        await nextTick();
        const plotTabsPostClick = wrapper.findAll(".nav-link");
        expect(plotTabsPostClick[0].classes()).not.contains("active");
        expect(plotTabsPostClick[1].classes()).contains("active");
        expect(wrapper.findComponent(TimeSeries).exists()).toBeFalsy();
        expect(wrapper.findComponent(Choropleth).exists()).toBeTruthy();
        expect(wrapper.findComponent(LoadingSpinner).exists()).toBeFalsy();
        expect(wrapper.findComponent(ErrorAlert).exists()).toBeFalsy();
        expect(wrapper.find("#plot-description").exists()).toBeFalsy();
    });

    test("renders as expected when error fetching review input metadata", async () => {
        const store = createStore(true, true);
        const wrapper = getWrapper(store);

        expect(wrapper.findComponent(PlotControlSet).exists()).toBeFalsy();
        expect(wrapper.findComponent(FilterSet).exists()).toBeFalsy();
        expect(wrapper.findComponent(TimeSeries).exists()).toBeFalsy();
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
