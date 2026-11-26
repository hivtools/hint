/**
 * Who is using the app, and the title of this deployment. The server used to write both into the page. Now the page
 * is a static file, so the app asks for them before it starts.
 *
 * This is a plain fetch, not apiService: apiService needs the store, and the store needs the user.
 */
export interface Me {
    user: string
    title: string
}

export const getMe = async (): Promise<Me> => {
    const response = await fetch("/me", {headers: {Accept: "application/json"}});
    if (!response.ok) {
        throw new Error(`GET /me answered ${response.status}`);
    }
    const body = await response.json();
    const data = body?.data;
    if (typeof data?.user !== "string" || typeof data?.title !== "string") {
        throw new Error("GET /me did not give a user and a title");
    }
    return {user: data.user, title: data.title};
};
