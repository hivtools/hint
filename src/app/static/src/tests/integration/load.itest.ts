import {actions} from "../../app/store/load/actions";
import {addCheckSum} from "../../app/utils";
import {login} from "./integrationTest";
import {actions as baselineActions} from "../../app/store/baseline/actions";
import {ShapeResponse} from "../../app/generated";

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
        await baselineActions.uploadShape({commit, dispatch: jest.fn()} as any, formData);
        shape = (commit.mock.calls[1][0]["payload"] as ShapeResponse);
    });

    it("can set files", async () => {
        const commit = jest.fn();
        const fakeState = JSON.stringify({
            files: {"shape": shape},
            state: {}
        });
        const fakeFileContents = addCheckSum(fakeState);
        await actions.setFiles({commit, dispatch: jest.fn(), state: {}} as any, fakeFileContents);

        expect(commit.mock.calls[0][0].type).toBe("SettingFiles");
        expect(commit.mock.calls[1][0].type).toBe("UpdatingState");
        expect(commit.mock.calls[1][0].payload).toStrictEqual({shape: {hash: shape.hash, filename: shape.filename}});
    });

});
