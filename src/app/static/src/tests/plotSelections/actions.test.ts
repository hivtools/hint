import {
    mockAxios,
    mockBaselineState,
    mockCalibrateMetadataResponse, mockFilterSelection,
    mockModelCalibrateState,
    mockPlotSelections,
    mockRootState
} from "../mocks";
import {Mock, MockInstance} from "vitest";
import {actions, PlotSelectionActionUpdate, Selection} from "../../app/store/plotSelections/actions";
import * as plotSelectionsUtils from "../../app/store/plotSelections/utils";
import {PayloadWithType} from "../../app/types";
import {ModelCalibrateMutation} from "../../app/store/modelCalibrate/mutations";
import {PlotSelectionsMutations} from "../../app/store/plotSelections/mutations";
import {CalibrateMetadataResponse} from "../../app/generated";

describe("Projects actions", () => {
    let getPlotDataMock: MockInstance;

    beforeEach(() => {
        mockAxios.reset();
        // stop apiService logging to console
        console.log = vi.fn();

        getPlotDataMock = vi.spyOn(
            plotSelectionsUtils,
            "getPlotData"
        ).mockImplementation(vi.fn());
    });

    afterEach(() => {
        (console.log as Mock).mockClear();
    });

    const commit = vi.fn();
    const rootState = mockRootState();

    it("updateSelections gets plot data and commits new selections when filter updates", async () => {
        const choroplethSelections = {
            controls: [],
            filters: [mockFilterSelection({
                filterId: "sexFilterId",
                stateFilterId: "sex"
            })]
        }
        const state = mockPlotSelections({
            choropleth: choroplethSelections
        });

        const selectedOptions = [
            {
                id: "male",
                label: "Male"
            },
            {
                id: "female",
                label: "Female"
            }
        ]
        const payload = {
            payload: {
                plot: "choropleth",
                selection: {
                    filter: {
                        id: "sex",
                        options: selectedOptions
                    }
                } as Selection
            }
        } as PayloadWithType<PlotSelectionActionUpdate>

        await actions.updateSelections({commit, state, rootState} as any, payload);

        expect(getPlotDataMock.mock.calls.length).toBe(1);
        expect(getPlotDataMock.mock.calls[0][0].plot).toBe("choropleth")

        const expectedPayload = choroplethSelections
        expectedPayload.filters[0].selection = selectedOptions
        expect(getPlotDataMock.mock.calls[0][0].selections).toStrictEqual(expectedPayload)

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0].type).toBe(PlotSelectionsMutations.updatePlotSelection);
        expect(commit.mock.calls[0][0].payload.plot).toBe("choropleth");
        expect(commit.mock.calls[0][0].payload.selections).toStrictEqual(expectedPayload);
    });

    it("updateSelections runs effect, gets plot data and commits new selections when control updates", async () => {
        const mockFiltersInfoFromEffects = vi.spyOn(
            plotSelectionsUtils,
            "filtersInfoFromEffects"
        ).mockImplementation(vi.fn()
        ).mockReturnValue([mockFilterSelection({
            filterId: "newFilter",
            stateFilterId: "newFilterStateId"
        })]);

        const root = {
            ...rootState,
            modelCalibrate: mockModelCalibrateState({
                metadata: mockCalibrateMetadataResponse(

                )
            })
        }
        const state = mockPlotSelections();

        const payload = {
            payload: {
                plot: "choropleth",
                selection: {
                    filter: {
                        id: "sex",
                        options: [
                            {
                                id: "male",
                                label: "Male"
                            },
                            {
                                id: "female",
                                label: "Female"
                            }
                        ]
                    }
                } as Selection
            }
        } as PayloadWithType<PlotSelectionActionUpdate>

        await actions.updateSelections({commit, state, rootState} as any, payload);

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0].type).toBe(PlotSelectionsMutations.updatePlotSelection);
        expect(commit.mock.calls[0][0].payload).toBe("TEST");
    });
})
;
