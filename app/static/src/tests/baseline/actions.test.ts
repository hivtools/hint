import {actions} from "../../app/store/baseline/actions";
import {mockAxios} from "../mocks";

describe("Baseline actions", () => {

    beforeEach(() => {
        mockAxios.reset();
    });

    it("sets country after PJNZ file upload", (done) => {

        mockAxios.onPost(`/upload`)
            .reply(200, {data: {country: "Malawi"}});

        const commit = jest.fn();
        actions.uploadPJNZ({commit} as any, {} as File);

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: "PJNZLoaded", payload: {country: "Malawi"}});
            done();
        })
    });

    it("sets error after failed PJNZ file upload", (done) => {

        mockAxios.onPost(`/upload`)
            .reply(500, {errors: [{code: "e", message: "error message"}]});

        const commit = jest.fn();
        actions.uploadPJNZ({commit} as any, {} as File);

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({
                type: "PJNZUploadError",
                payload: [{code: "e", message: "error message"}]
            });
            done();
        })
    });

});