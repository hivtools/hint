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

const fs = require("fs");
const FormData = require("form-data");

describe("load actions", () => {

    let shape: any = {};
    beforeAll(async () => {
        await login();
        const commit = jest.fn();
        const file = fs.createReadStream("../testdata/malawi.geojson");
        const formData = new FormData();
        formData.append('file', file);
        await baselineActions.uploadShape({commit, dispatch: jest.fn(), rootState} as any, formData);
        shape = (commit.mock.calls[1][0]["payload"] as ShapeResponse);
    });

    it("can set files as guest user", async () => {
        const commit = jest.fn();
        const fakeState = JSON.stringify({
            files: {"shape": shape},
            state: {}
        });
        const fakeFileContents = addCheckSum(fakeState);
        const rootGetters = {isGuest: true};
        await actions.setFiles({commit, dispatch: jest.fn(), state: {}, rootState, rootGetters} as any,
            {savedFileContents: fakeFileContents, projectName: "new project"});

        expect(commit.mock.calls[0][0].type).toBe("SettingFiles");
        expect(commit.mock.calls[1][0].type).toBe("UpdatingState");
        expect(commit.mock.calls[1][0].payload).toStrictEqual({shape: {hash: shape.hash, filename: shape.filename}});
    });

    it("can create project and set files as logged in user", async () => {
        const commit = jest.fn();
        const fakeState = JSON.stringify({
            files: {"shape": shape},
            state: {
                projects: {}
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

        await actions.setFiles({commit, dispatch: store.dispatch, state: {}, rootState: store.state, rootGetters} as any,
            {savedFileContents: fakeFileContents, projectName: "new project"});

        //we expect the non-mocked dispatch to have created a project, and to have invoked the local store manager to
        //have saved state to the mocked local storage with the new project's details

        expect(commit.mock.calls[0][0].type).toBe("SettingFiles");
        expect(commit.mock.calls[1][0].type).toBe("UpdatingState");
        expect(commit.mock.calls[1][0].payload).toStrictEqual({shape: {hash: shape.hash, filename: shape.filename}});
    });

});
