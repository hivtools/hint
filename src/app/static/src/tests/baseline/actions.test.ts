import {mockAxios, mockFailure, mockSuccess} from "../mocks";
import {actions} from "../../app/store/baseline/actions";

describe("Baseline actions", () => {

    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
    });

    it("sets country after PJNZ file upload", async () => {

        mockAxios.onPost(`/baseline/pjnz/`)
            .reply(200, mockSuccess({data: {country: "Malawi"}}));

        const commit = jest.fn();
        await actions.uploadPJNZ({commit} as any, {} as File);

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "PJNZUploaded", payload: {data: {country: "Malawi"}}});
    });

    it("sets error message after failed PJNZ file upload", async () => {

        mockAxios.onPost(`/baseline/pjnz/`)
            .reply(500, mockFailure("Something went wrong"));

        const commit = jest.fn();
        await actions.uploadPJNZ({commit} as any, {} as File);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "PJNZUploadError",
            payload: "Something went wrong"
        });
    });

    it("gets baseline data and commits it", async () => {

        mockAxios.onGet(`/baseline/`)
            .reply(200, mockSuccess({pjnz: {data: {country: "Malawi"}, filename: "test.pjnz"}}));

        const commit = jest.fn();
        await actions.getBaselineData({commit} as any);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "BaselineDataLoaded",
            payload: {pjnz: {data: {country: "Malawi"}, filename: "test.pjnz"}}
        });
    });

    it("fails silently if get baseline data fails", async () => {

        mockAxios.onGet(`/baseline/`)
            .reply(500);

        const commit = jest.fn();
        await actions.getBaselineData({commit} as any);
        expect(commit).toBeCalledTimes(0);
    });
});
