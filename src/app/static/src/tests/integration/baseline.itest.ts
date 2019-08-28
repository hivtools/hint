import {actions} from "../../app/store/baseline/actions";

describe("Baseline actions", () => {

    it("sets country after PJNZ file upload", (done) => {

        const commit = jest.fn();
        actions.uploadPJNZ({commit} as any, {} as File);

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: "PJNZUploaded", payload: {data: {country: "Malawi"}}});
            done();
        })
    });

    it("sets error message after failed PJNZ file upload", (done) => {

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

        const commit = jest.fn();
        actions.getBaselineData({commit} as any);

        setTimeout(() => {
            expect(commit).toBeCalledTimes(0);
            done();
        })
    });

});
