import {modelCalibrateGetters} from "../../app/store/modelCalibrate/modelCalibrate";
import {mockModelCalibrateState} from "../mocks";

describe("modelCalibrate getters", () => {

    const state = mockModelCalibrateState({
            calibratePlotResult: {
                plottingMetadata: {
                    barchart: {
                        indicators: ["testIndicators"],
                        filters: ["testFilters"],
                        defaults: ["testDefaults"]
                    }
                }
            }
        });

    it("gets barchart indicators", async () => {
        const result = modelCalibrateGetters.indicators(state);
        expect(result.length).toEqual(1);
        expect(result).toStrictEqual(["testIndicators"]);
    });

    it("gets barchart filters", async () => {
        const result = modelCalibrateGetters.filters(state);
        expect(result).toStrictEqual(["testFilters"]);
    });

    it("gets calibratePlotDefaultSelections", async () => {
        const result = modelCalibrateGetters.calibratePlotDefaultSelections(state);
        expect(result).toStrictEqual(["testDefaults"]);
    });

})
