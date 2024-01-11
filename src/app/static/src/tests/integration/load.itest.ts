import {actions} from "../../app/store/load/actions";
import {addCheckSum} from "../../app/utils";
import {login, rootState} from "./integrationTest";
import {actions as baselineActions} from "../../app/store/baseline/actions";
import {ShapeResponse} from "../../app/generated";
import {currentHintVersion} from "../../app/hintVersion";
import {getFormData} from "./helpers";

describe("load actions", () => {

    let shape: any = {};
    const realLocation = window.location;

    beforeAll(async () => {
        await login();
        const commit = jest.fn();
        const formData = getFormData("../testdata/malawi.geojson");

        await baselineActions.uploadShape({commit, dispatch: jest.fn(), rootState} as any, formData);
        shape = (commit.mock.calls[1][0]["payload"] as ShapeResponse);

        const mockLocationReload = jest.fn();
        delete (window as any).location;
        window.location = {reload: mockLocationReload} as any;
    });

    afterAll(() => {
        window.location = realLocation;
    });

    it("can set files as guest user", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const fakeState = JSON.stringify({
            files: {"shape": shape},
            state: {
                version: currentHintVersion,
                stepper: {}
            }
        });
        const fakeFileContents = addCheckSum(fakeState);
        const rootGetters = {isGuest: true};
        await actions.setFiles({commit, dispatch, state: {}, rootState, rootGetters} as any,
            {savedFileContents: fakeFileContents});
        
        expect(commit.mock.calls[0][0].type).toBe("SettingFiles");
        expect(commit.mock.calls[1][0].type).toBe("UpdatingState");
        expect(commit.mock.calls[1][0].payload).toEqual({
            shape: {
                hash: shape.hash,
                filename: shape.filename,
                fromAdr: false,
                resource_url: null
            }
        });
        expect(dispatch.mock.calls[0][1]).toStrictEqual({
            stepper: {
                steps: [
                    {
                        "number": 1,
                        "textKey": "uploadInputs"
                    },
                    {
                        "number": 2,
                        "textKey": "reviewInputs"
                    },
                    {
                        "number": 3,
                        "textKey": "modelOptions"
                    },
                    {
                        "number": 4,
                        "textKey": "fitModel"
                    },
                    {
                        "number": 5,
                        "textKey": "calibrateModel"
                    },
                    {
                        "number": 6,
                        "textKey": "reviewOutput"
                    },
                    {
                        "number": 7,
                        "textKey": "downloadResults"
                    }
                ]
            },
            "version": currentHintVersion
        });
    });

    it("can submit model output ZIP file", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn()
        const formData = getFormData("output.zip");
        const state = {rehydrateId: "1"}

        await actions.preparingRehydrate({commit, dispatch, state, rootState} as any, formData);

        expect(commit.mock.calls[0][0].type).toBe("StartPreparingRehydrate");
        expect(commit.mock.calls[1][0].type).toBe("PreparingRehydrate");
        expect(commit.mock.calls[1][0].payload).not.toBeNull();
    });

    it("can poll model output ZIP status", (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn()
        const state = {rehydrateId: "1"}

        actions.pollRehydrate({commit, dispatch, state, rootState} as any);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2)
            expect(commit.mock.calls[0][0].type).toBe("RehydratePollingStarted");
            expect(commit.mock.calls[0][0].payload).toBeGreaterThan(-1);
            expect(commit.mock.calls[1][0].type).toBe("RehydrateStatusUpdated");
            expect(commit.mock.calls[1][0]["payload"].status).toBe("MISSING");
            done();
        }, 3100)
    });
});
