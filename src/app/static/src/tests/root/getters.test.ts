import {mockModelCalibrateState, mockModelOptionsState, mockModelRunState, mockRootState} from "../mocks";
import {getters} from "../../app/store/root/getters";
import {Warning} from "../../app/generated";

describe(`root getters`, () => {

    const modelOptionWarnings: Warning[] = [
        {text: "model option test", locations: ["model_options"]}
    ]

    const calibrateWarnings: Warning[] = [
        {text: "model calibrate test", locations: ["model_options", "model_calibrate"]}
    ]

    const modelRunWarnings: Warning[] = [
        {text: "model run test", locations: ["model_fit"]}
    ]

    const testState = () => {
        return mockRootState({
            modelOptions: mockModelOptionsState({warnings: modelOptionWarnings}),
            modelRun: mockModelRunState({warnings: modelRunWarnings}),
            modelCalibrate: mockModelCalibrateState({warnings: calibrateWarnings})
        })
    }

    it(`can get modelRun warnings when on model run step`, () => {
        const rootState = testState()

        const warnings = getters.warnings(rootState, null, testState() as any, null)
        const result = warnings("fitModel").modelRun
        expect(result).toEqual(modelRunWarnings)
    })

    it(`can get modelCalibrate warnings when on model calibrate step`, () => {
        const rootState = testState()

        const warnings = getters.warnings(rootState, null, testState() as any, null)
        const result = warnings("calibrateModel").modelCalibrate
        expect(result).toEqual([
            {
                "locations": ["model_options", "model_calibrate"],
                "text": "model calibrate test"
            }
        ])
    })

    it(`can get modelCalibrate warnings if exists in modelOptions step`, () => {
        const rootState = testState()

        const warnings = getters.warnings(rootState, null, testState() as any, null)
        const result = warnings("modelOptions").modelCalibrate
        expect(result).toEqual([
            {
                locations: ["model_options", "model_calibrate"],
                text: "model calibrate test"
            }
        ])
    })

    it(`does not get modelOptions warnings if it does not exist on modelCalibrate step`, () => {
        const rootState = testState()

        const warnings = getters.warnings(rootState, null, testState() as any, null)
        const result = warnings("modelCalibrate").modelOptions
        expect(result).toEqual([])
    })

    it(`can get model options warnings`, () => {
        const rootState = testState()

        const warnings = getters.warnings(rootState, null, testState() as any, null)
        const result = warnings("modelOptions").modelOptions
        expect(result).toEqual(modelOptionWarnings)
    })

    it(`can get empty warnings when all warnings properties are undefined in state`, () => {
        // We should be able to remove this test when warnings are fully implemented in hintr, as warnings
        // array will always be provided. Can also remove defensive code for this case in the getter.
        const rootState = mockRootState({
            modelOptions: mockModelOptionsState({warnings: undefined}),
            modelRun: mockModelRunState({warnings: undefined}),
            modelCalibrate: mockModelCalibrateState({warnings: undefined})
        });
        const warnings = getters.warnings(rootState, null, rootState, null);
        const expected = {
            modelOptions: [],
            modelRun: [],
            modelCalibrate: []
        };
        expect(warnings("modelOptions")).toStrictEqual(expected);
        expect(warnings("fitModel")).toStrictEqual(expected);
        expect(warnings("calibrateModel")).toStrictEqual(expected);
        expect(warnings("reviewOutput")).toStrictEqual(expected);
        expect(warnings("downloadResults")).toStrictEqual(expected);
    });

})
