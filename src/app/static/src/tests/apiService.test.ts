import {api} from "../app/apiService";

describe("ApiService", () => {

    beforeEach(() => {
        console.log = jest.fn();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear()
    });

    it("console logs error", () => {
        const e = {status: 400, message: "missing parameter", error: "bad request"};

        try {
            api.handleError({response: {data: e}});
        } catch (e) {

        }
        expect((console.log as jest.Mock).mock.calls[0][0]).toStrictEqual(e);
    });

    it("rethrows simple error", () => {
        const e = {status: 400, message: "missing parameter", error: "bad request"};

        try {
            api.handleError({response: {data: e}});
        } catch (e) {
            expect(e.message).toBe("missing parameter");
        }
    })
});
