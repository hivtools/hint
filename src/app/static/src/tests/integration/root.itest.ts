import {actions} from "../../app/store/root/actions";
import {login, rootState} from "./integrationTest";
import {RootMutation} from "../../app/store/root/mutations";

describe("Root actions", () => {

    beforeAll(async () => {
        await login();
    });

    it("can fetch ADR key", async () => {
        const commit = jest.fn();
        await actions.fetchADRKey({commit, rootState} as any);

        expect(commit.mock.calls[0][0]["type"]).toBe(RootMutation.UpdateADRKey);
        expect(commit.mock.calls[0][0]["payload"]).toBe(null);
    });

    it("can save ADR key", async () => {
        const commit = jest.fn();
        await actions.saveADRKey({commit, rootState} as any, "1234");

        expect(commit.mock.calls[1][0]["type"]).toBe(RootMutation.UpdateADRKey);
        expect(commit.mock.calls[1][0]["payload"]).toBe("1234");
    });

    it("can delete ADR key", async () => {
        const commit = jest.fn();
        await actions.deleteADRKey({commit, rootState} as any);

        expect(commit.mock.calls[1][0]["type"]).toBe(RootMutation.UpdateADRKey);
        expect(commit.mock.calls[1][0]["payload"]).toBe(null);
    });

    it("can fetch ADR datasets", async () => {
        const commit = jest.fn();
        await actions.getADRDatasets({commit, rootState} as any);

        expect(commit.mock.calls[1][0]["type"]).toBe(RootMutation.SetADRDatasets);
        expect(commit.mock.calls[1][0]["payload"]).toEqual([]);
    });
});
