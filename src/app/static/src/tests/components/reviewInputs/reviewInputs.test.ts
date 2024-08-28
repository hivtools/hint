import {shallowMount} from "@vue/test-utils";
import Vuex, {Store} from "vuex";
import {emptyState, RootState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import PlotControlSet from "../../../app/components/plots/PlotControlSet.vue";
import FilterSet from "../../../app/components/plots/FilterSet.vue";
import Choropleth from "../../../app/components/plots/choropleth/Choropleth.vue";
import ReviewInputs from "../../../app/components/reviewInputs/ReviewInputs.vue";
import TimeSeries from "../../../app/components/plots/timeSeries/TimeSeries.vue";
import {mockAncResponse, mockMetadataState, mockSurveyAndProgramState, mockSurveyResponse} from "../../mocks";
import {initialSurveyAndProgramState} from "../../../app/store/surveyAndProgram/surveyAndProgram";
import {nextTick} from "vue";
import {initialMetadataState} from "../../../app/store/metadata/metadata";
import {shallowMountWithTranslate} from "../../testHelpers";

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

    const createStore = (dataFetched: boolean) => {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                surveyAndProgram: {
                    state: dataFetched ? mockSurveyAndProgramState({
                        anc: mockAncResponse(),
                        survey: mockSurveyResponse()
                    }): initialSurveyAndProgramState()
                },
                metadata: {
                    namespaced: true,
                    state: dataFetched ? mockMetadataState({
                        reviewInputMetadataFetched: true
                    }): initialMetadataState(),
                    actions: {
                        getReviewInputMetadata: mockGetReviewInputMetadata
                    }
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
        expect(wrapper.find("#plot-description").text()).toContain("Values are shown in red when");

        plotTabs[1].trigger("click");
        await nextTick();
        const plotTabsPostClick = wrapper.findAll(".nav-link");
        expect(plotTabsPostClick[0].classes()).not.contains("active");
        expect(plotTabsPostClick[1].classes()).contains("active");
        expect(wrapper.findComponent(TimeSeries).exists()).toBeFalsy();
        expect(wrapper.findComponent(Choropleth).exists()).toBeTruthy();
        expect(wrapper.find("#plot-description").exists()).toBeFalsy();
    });
});
