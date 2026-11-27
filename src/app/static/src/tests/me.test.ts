import {getMe} from "../app/me";

describe("getMe", () => {
    const answer = (status: number, body: unknown) => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), {status}));
        vi.stubGlobal("fetch", fetchMock);
        return fetchMock;
    };

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("gives the user and the title", async () => {
        const fetchMock = answer(200, {status: "success", errors: [], data: {user: "a@b.com", title: "Naomi"}});

        expect(await getMe()).toStrictEqual({user: "a@b.com", title: "Naomi"});
        expect(fetchMock).toHaveBeenCalledWith("/me", {headers: {Accept: "application/json"}});
    });

    it("gives a guest as a guest", async () => {
        answer(200, {status: "success", errors: [], data: {user: "guest", title: "Naomi"}});

        expect((await getMe()).user).toBe("guest");
    });

    it("fails if the server fails, rather than taking the visitor to be a guest", async () => {
        answer(500, {status: "failure", errors: [], data: null});

        await expect(getMe()).rejects.toThrow("GET /me answered 500");
    });

    it("fails if the answer has no user", async () => {
        answer(200, {status: "success", errors: [], data: {title: "Naomi"}});

        await expect(getMe()).rejects.toThrow("GET /me did not give a user and a title");
    });

    it("fails if the request fails", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

        await expect(getMe()).rejects.toThrow("Failed to fetch");
    });
});
