import {mockModelCalibrateState, mockModelOptionsState, mockModelRunState, mockRootState} from "../mocks";
import {getters} from "../../app/store/root/getters";
import {Warning} from "../../app/generated";
import {STEPS} from "../../app/root";

describe(`root getters`, () => {

    const warning: Warning[] = [
        {text: "model option test", locations: ["model_options"]},
        {text: "model calibrate test", locations: ["model_calibrate"]},
        {text: "model run test", locations: ["model_fit"]}
    ]

    const testState = () => {
        return mockRootState({
            modelOptions: mockModelOptionsState({warnings: warning}),
            modelRun: mockModelRunState({warnings: warning}),
            modelCalibrate: mockModelCalibrateState({warnings: warning})
        })
    }

    it(`can get model run warnings`, () => {
        const rootState = testState()

        const warn = getters.warnings(rootState, null, testState() as any, null)
        const result = warn(STEPS.modelRun).modelRun
        expect(result).toEqual([{text: "model run test", locations: [STEPS.modelRun]}])
    })

    it(`can get model calibrate warnings`, () => {
        const rootState = testState()

        const warn = getters.warnings(rootState, null, testState() as any, null)
        const result = warn(STEPS.modelCalibrate).modelCalibrate
        expect(result).toEqual([{text: "model calibrate test", locations: [STEPS.modelCalibrate]}])
    })

    it(`can get model options warnings`, () => {
        const rootState = testState()

        const warn = getters.warnings(rootState, null, testState() as any, null)
        const result = warn(STEPS.modelOptions).modelOptions
        expect(result).toEqual([{text: "model option test", locations: [STEPS.modelOptions]}])
    })

})