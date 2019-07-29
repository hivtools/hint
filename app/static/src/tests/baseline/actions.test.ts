import {actions} from "../../app/store/baseline/actions";
import {mockAxios} from "../mocks";

describe("Baseline actions", () => {

    beforeEach(() => {
        mockAxios.reset();
    });

    it("sets country after PJNZ file upload", (done) => {

        mockAxios.onPost(`/upload`)
            .reply(200, {country: "Malawi"});

        const commit = jest.fn();
        actions.uploadPJNZ({commit} as any, {} as File);

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: "PJNZLoaded", payload: {country: "Malawi"}});
            done();
        })
    });

    it("sets error message after failed PJNZ file upload", (done) => {

        mockAxios.onPost(`/upload`)
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

    it("returns basic error if response is a 40 after failed PJNZ file upload", (done) => {

        mockAxios.onPost(`/upload`)
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

});