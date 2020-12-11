import {modelCalibrate, ModelCalibrateState, modelCalibrateGetters} from "../../app/store/modelCalibrate/modelCalibrate";

it("it has changes if state has changes flag", () => {
    const initialState = modelCalibrate.state as ModelCalibrateState;
    expect(modelCalibrateGetters.hasChanges(initialState)).toBe(false);

    initialState.changes = true;
    expect(modelCalibrateGetters.hasChanges(initialState)).toBe(true);
});
