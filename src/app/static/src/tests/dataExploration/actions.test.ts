import {actions} from "../../app/store/dataExploration/actions";
import {
    mockAxios,
    mockBaselineState,
    mockGenericChartState,
    mockDataExplorationState
} from "../mocks";
import {Language} from "../../app/store/translations/locales";
import {expectChangeLanguageMutations} from "../testHelpers";

describe("data exploration actions", () => {

    beforeEach(() => {
        mockAxios.reset();
    });

    it("changeLanguage fetches plotting metadata and calibrate result", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const rootState = mockDataExplorationState({
            baseline: mockBaselineState({iso3: "MWI"})
        });
        await actions.changeLanguage({commit, dispatch, rootState} as any, Language.fr);

        expectChangeLanguageMutations(commit);

        expect(dispatch.mock.calls.length).toBe(1);
        expect(dispatch.mock.calls[0][0]).toStrictEqual("metadata/getPlottingMetadata");
        expect(dispatch.mock.calls[0][1]).toStrictEqual("MWI");
    });

    it("changeLanguage does not fetch plotting metadata if country code is empty", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const rootState = mockDataExplorationState();
        await actions.changeLanguage({commit, dispatch, rootState} as any, Language.fr);

        expectChangeLanguageMutations(commit);

        expect(dispatch.mock.calls.length).toBe(0);
    });

    it("changeLanguage refreshes genericChart datasets, if any", async() => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const rootState = mockDataExplorationState(
            {
                baseline: mockBaselineState({iso3: "MWI"}),
                genericChart: mockGenericChartState({datasets: {dataset1: "TEST"}} as any)
            });
        await actions.changeLanguage({commit, dispatch, rootState} as any, Language.fr);

        expectChangeLanguageMutations(commit);

        expect(dispatch.mock.calls.length).toBe(2);
        expect(dispatch.mock.calls[0][0]).toStrictEqual("metadata/getPlottingMetadata");
        expect(dispatch.mock.calls[1][0]).toStrictEqual("genericChart/refreshDatasets");
    });

    it("changeLanguage fetches nothing if no relevant metadata to fetch", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const rootState = mockDataExplorationState({baseline: {iso3: ""} as any})
        await actions.changeLanguage({commit, dispatch, rootState} as any, Language.fr);

        expectChangeLanguageMutations(commit);

        expect(dispatch.mock.calls.length).toBe(0)
    });

    it("changeLanguage does nothing if new language is the same as current language", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const rootState = mockDataExplorationState(
            {
                language: Language.fr,
                baseline: mockBaselineState({iso3: "MWI"})
            });
        await actions.changeLanguage({commit, dispatch, rootState} as any, Language.fr);

        expect(commit.mock.calls.length).toBe(0);
        expect(dispatch.mock.calls.length).toBe(0);
    });

});