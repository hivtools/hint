import {actions} from "../../app/store/modelCalibrate/actions";
import {rootState} from "./integrationTest";
import {isDynamicFormMeta} from "@reside-ic/vue-dynamic-form";
import {Language} from "../../app/store/translations/locales";

describe("model calibrate actions integration", () => {
    it("can get model calibrate options", async () => {
        const commit = jest.fn();
        await actions.fetchModelCalibrateOptions({commit, rootState} as any);
        expect(commit.mock.calls[1][0]["type"]).toBe("ModelCalibrateOptionsFetched");
        const payload = commit.mock.calls[1][0]["payload"];
        expect(isDynamicFormMeta(payload)).toBe(true);

        expect(commit.mock.calls[2][0]["type"]).toBe("SetModelCalibrateOptionsVersion");
        expect(commit.mock.calls[2][0]["payload"]).toBeDefined();
    });

    it("can calibrate model run", async () => {
        const commit = jest.fn();
        const testRootState = {
            language: Language.en,
            modelRun:{
                modelRunId: "1234"
            }
        };

        const testState = {
            version: {hintr: "0.1.3", naomi: "1.0.4", rrq: "0.2.7"}
        };

        await actions.calibrate({commit, state: testState, rootState: testRootState} as any, {});

        // passing an invalid run id so this will return an error
        // but the expected error message confirms
        // that we're hitting the correct endpoint
        expect(commit.mock.calls.length).toBe(3);
        expect(commit.mock.calls[2][0]["type"]).toBe("SetError");
        expect(commit.mock.calls[2][0]["payload"].detail).toBe("Failed to fetch result");
    });
});
