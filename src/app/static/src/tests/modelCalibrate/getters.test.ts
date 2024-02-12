import {modelCalibrateGetters} from "../../app/store/modelCalibrate/modelCalibrate";
import {mockModelCalibrateState} from "../mocks";
import * as utils from "../../app/store/plotSelections/utils";
import {FilterOption, FilterTypes, PlotSetting, PlotSettingOption} from "../../app/generated";
import {RootState} from "../../app/root";

describe("modelCalibrate getters", () => {

    const mockFilterAfterUseShapeRegions = jest
        .spyOn(utils, "filterAfterUseShapeRegions")
        .mockImplementation((x: FilterTypes, y: RootState) => x)
    afterEach(() => {
        jest.resetAllMocks();
    })

    const mockFilterTypeOptions: FilterOption[] = [
            {
                label: "label 1",
                id: "id1"
            },
            {
                label: "label 2",
                id: "id2"
            }
        ]
    const mockPlotSettingOptions: PlotSettingOption[] = [
        {
            label: "Opt1a",
            id: "opt1a",
            effect: {}
        },
        {
            label: "Opt1b",
            id: "opt1b",
            effect: {}
        }
    ]

    const state = mockModelCalibrateState({
        metadata: {
            filterTypes: [
                {
                    id: "typeId1",
                    column_id: "columnId1",
                    options: mockFilterTypeOptions
                },
                {
                    id: "typeId2",
                    column_id: "columnId2",
                    options: [],
                    use_shape_regions: true
                },
            ],
            plotSettingsControl: {
                choropleth: {
                    plotSettings: []
                },
                table: {
                    plotSettings: []
                },
                bubble: {
                    plotSettings: []
                },
                barchart: {
                    plotSettings: [
                        {
                            id: "settingId1",
                            label: "Setting 1",
                            options: mockPlotSettingOptions
                        }
                    ]
                }
            },
            indicators: [],
            warnings: []
        }
    });

    it("gets options for output filters", async () => {
        const getter = modelCalibrateGetters.outputFilterOptions(state, null, {} as RootState);
        const options1 = getter("typeId1");
        expect(options1).toStrictEqual(mockFilterTypeOptions);
        expect(mockFilterAfterUseShapeRegions).toHaveBeenCalledTimes(1);

        const options2 = getter("typeId2");
        expect(options2).toStrictEqual([]);
        expect(mockFilterAfterUseShapeRegions).toHaveBeenCalledTimes(2);
    });

    it("gets options for plot controls", async () => {
        const getter = modelCalibrateGetters.plotControlOptions(state);
        const options1 = getter("barchart", "settingId1")
        expect(options1).toStrictEqual(mockPlotSettingOptions);

        const options2 = getter("barchart", "unknownId")
        expect(options2).toStrictEqual([]);
    });


})
