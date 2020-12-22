import {actions, getCalibrateStatus} from "../../app/store/modelCalibrate/actions";
import {isDynamicFormMeta} from "@reside-ic/vue-dynamic-form";
import {rootState} from "./integrationTest";
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

    it("can submit calibrate", async () => {
        const commit = jest.fn();
        const testState = {
            version: {hintr: "0.1.3", naomi: "1.0.4", rrq: "0.2.7"}
        };
        const testRootState = {
           language: Language.en,
           modelRun:{
               modelRunId: "1234"
           }
       };
        await actions.submit({commit, state: testState, rootState: testRootState} as any, {});

        // passing an invalid run id so this will return an error
        // but the expected error message confirms
        // that we're hitting the correct endpoint
        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[1][0]["type"]).toBe("SetError");
        expect(commit.mock.calls[1][0]["payload"].detail).toBe("Failed to fetch result");
    });


    it("can get calibrate status", async () => {
        const commit = jest.fn();
        const state = {calibrateId: "123"} as any;
        await getCalibrateStatus({commit, state, rootState} as any);

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0]["type"]).toBe("CalibrateStatusUpdated");
        expect(commit.mock.calls[0][0]["payload"].status).toBe("MISSING");
    });

    it("can get calibrate result", async () => {
        const commit = jest.fn();
        const state = {calibrateId: "123"} as any;
        await actions.getResult({commit, state, rootState} as any);

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0]["type"]).toBe("SetError");
        expect(commit.mock.calls[0][0]["payload"].detail).toBe("Failed to fetch result");
    });
});
