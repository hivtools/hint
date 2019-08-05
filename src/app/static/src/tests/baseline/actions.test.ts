import {mockAxios} from "../mocks";
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
            .reply(200, {country: "Malawi"});

        const commit = jest.fn();
        actions.uploadPJNZ({commit} as any, {} as File);

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: "PJNZLoaded", payload: {country: "Malawi"}});
            done();
        })
    });

    it("sets error message after failed PJNZ file upload", (done) => {

        mockAxios.onPost(`/baseline/pjnz/`)
            .reply(500, {error: "Something went wrong", status: 500, message: "error message"});

        const commit = jest.fn();
        actions.uploadPJNZ({commit} as any, {} as File);

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({
                type: "PJNZUploadError",
                payload: "error message"
            });
            done();
        })
    });

    it("gets baseline data and commits it", (done) => {

        mockAxios.onGet(`/baseline/`)
            .reply(200, {pjnz: {country: "Malawi", fileName: "test.pjnz"}});

        const commit = jest.fn();
        actions.getBaselineData({commit} as any);

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({
                type: "BaselineDataLoaded",
                payload: {pjnz: {country: "Malawi", fileName: "test.pjnz"}}
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