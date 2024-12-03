import {mockMetadataState, mockReviewInputMetadata} from "../mocks";
import {getters} from "../../app/store/metadata/getters";


describe("time series getters", () => {
    it("can get time series plot labels from ART and ANC metadata", () => {
        const optionsA = [
            {
                id: "1",
                label: "One"
            },
            {
                id: "2",
                label: "Two"
            }
        ];
        const optionsB = [
            {
                id: "2",
                label: "Two"
            },
            {
                id: "3",
                label: "Three"
            }
        ];
        const expectedOptionsMap = new Map<string, string>([
            ["1", "One"],
            ["2", "Two"],
            ["3", "Three"],
        ]);
        const state = mockMetadataState({
            reviewInputMetadata: mockReviewInputMetadata({
                filterTypes: [
                    {
                        id: "time_series_programme_plot_type",
                        column_id: "plot",
                        options: optionsA
                    },
                    {
                        id: "time_series_anc_plot_type",
                        column_id: "plot",
                        options: optionsB
                    }
                ]
            })
        });

        expect(getters.timeSeriesPlotTypeLabel(state)).toStrictEqual(expectedOptionsMap);
    });

    it("timeSeriesPlotTypeLabel returns empty map if can't locate ANC or ART plot options", () => {
        const state = mockMetadataState({
            reviewInputMetadata: mockReviewInputMetadata({
                filterTypes: [
                    {
                        id: "my_id",
                        column_id: "plot",
                        options: []
                    },
                ]
            })
        });

        expect(getters.timeSeriesPlotTypeLabel(state)).toStrictEqual(new Map<string, string>());
    })
})
