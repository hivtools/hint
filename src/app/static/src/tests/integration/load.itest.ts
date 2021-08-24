import {actions} from "../../app/store/load/actions";
import {actions as projectActions} from "../../app/store/projects/actions";
import {mutations as projectMutations} from "../../app/store/projects/mutations";
import {mutations as rootMutations} from "../../app/store/root/mutations";
import {addCheckSum} from "../../app/utils";
import {login, rootState} from "./integrationTest";
import {actions as baselineActions} from "../../app/store/baseline/actions";
import {ShapeResponse} from "../../app/generated";
import Vuex from "vuex";
import {emptyState} from "../../app/root";
import {localStorageManager} from "../../app/localStorageManager";
import {currentHintVersion} from "../../app/hintVersion";
import {getFormData} from "./helpers";

const fs = require("fs");
const FormData = require("form-data");

describe("load actions", () => {

    let shape: any = {};
    beforeAll(async () => {
        await login();
        const commit = jest.fn();
        const formData = getFormData("../testdata/malawi.geojson");

        await baselineActions.uploadShape({commit, dispatch: jest.fn(), rootState} as any, formData);
        shape = (commit.mock.calls[1][0]["payload"] as ShapeResponse);
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
            {savedFileContents: fakeFileContents, projectName: "new project"});

        expect(commit.mock.calls[0][0].type).toBe("SettingFiles");
        expect(commit.mock.calls[1][0].type).toBe("UpdatingState");
        expect(commit.mock.calls[1][0].payload).toEqual({
            shape: {
                hash: shape.hash,
                filename: shape.filename,
                fromADR: false
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
            "version": "1.47.0"
        });
    });

    it("can create project and set files as logged in user", async () => {
        const commit = jest.fn();
        const fakeState = JSON.stringify({
            files: {"shape": shape},
            state: {
                version: currentHintVersion,
                projects: {},
                baseline: "TEST BASELINE",
                stepper: {}
            }
        });
        const fakeFileContents = addCheckSum(fakeState);
        const rootGetters = {isGuest: false};

        const store = new Vuex.Store({
            state: emptyState(),
            mutations: rootMutations,
            modules: {
                projects: {
                    namespaced: true,
                    actions: projectActions,
                    mutations: projectMutations
                },
                load: {
                    namespaced: true,
                    actions
                }
            }
        });

        const mockSaveToLocalStorage = jest.fn();
        localStorageManager.savePartialState = mockSaveToLocalStorage;

        const dispatch = ((store as any)._modulesNamespaceMap["load/"] as any).context.dispatch;

        await actions.setFiles({commit, dispatch, state: {}, rootState: store.state, rootGetters} as any,
            {savedFileContents: fakeFileContents, projectName: "new project"});

        //we expect the non-mocked dispatch to have created a project, and to have invoked the local store manager to
        //save state
        expect(commit.mock.calls[0][0].type).toBe("SettingFiles");
        expect(commit.mock.calls[1][0].type).toBe("UpdatingState");
        expect(commit.mock.calls[1][0].payload)
            .toEqual({
                shape:
                    {
                        hash: shape.hash,
                        filename: shape.filename,
                        fromADR: false
                    }
            });
        expect(mockSaveToLocalStorage.mock.calls[0][0].baseline).toBe("TEST BASELINE");
    });

});
