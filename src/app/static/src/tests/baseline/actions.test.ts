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

    it("sets country after PJNZ file upload", (done) => {

        mockAxios.onPost(`/baseline/pjnz/`)
            .reply(200, mockSuccess({data: {country: "Malawi"}}));

        const commit = jest.fn();
        actions.uploadPJNZ({commit} as any, {} as File);

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: "PJNZUploaded", payload: {data: {country: "Malawi"}}});
            done();
        })
    });

    it("sets error message after failed PJNZ file upload", (done) => {

        mockAxios.onPost(`/baseline/pjnz/`)
            .reply(500, mockFailure("Something went wrong"));

        const commit = jest.fn();
        actions.uploadPJNZ({commit} as any, {} as File);

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({
                type: "PJNZUploadError",
                payload: "Something went wrong"
            });
            done();
        })
    });

    it("gets baseline data and commits it", (done) => {

        mockAxios.onGet(`/baseline/`)
            .reply(200, mockSuccess({pjnz: {data: {country: "Malawi"}, filename: "test.pjnz"}}));

        const commit = jest.fn();
        actions.getBaselineData({commit} as any);

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({
                type: "BaselineDataLoaded",
                payload: {pjnz: {data: {country: "Malawi"}, filename: "test.pjnz"}}
            });
            done();
        })
    });

    it("fails silently if get baseline data fails", (done) => {

        mockAxios.onGet(`/baseline/`)
            .reply(500);

        const commit = jest.fn();
        actions.getBaselineData({commit} as any);

        setTimeout(() => {
            expect(commit).toBeCalledTimes(0);
            done();
        })
    });

});