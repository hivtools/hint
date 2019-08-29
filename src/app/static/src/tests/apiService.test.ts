import {api} from "../app/apiService";
import {Failure} from "../app/generated";

describe("ApiService", () => {

    beforeEach(() => {
        console.log = jest.fn();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear()
    });

    it("console logs error", () => {
        const error = {detail: "missing parameter", error: "OTHER_ERROR"};
        const e = {errors: [error]} as Partial<Failure>;
        try {
            api()._handleError({response: {data: e}} as any);
        } catch (e) {

        }
        expect((console.log as jest.Mock).mock.calls[0][0].response.data).toStrictEqual(e);
    });

    it("throws first error by default", () => {
        const error = {detail: "missing parameter", error: "OTHER_ERROR"};
        const e = {errors: [error]} as Partial<Failure>;
        try {
            api()._handleError({response: {data: e}} as any);
        } catch (e) {
            expect(e.message).toBe("missing parameter");
        }
    })
});
