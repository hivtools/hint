export const stop = (id) => {
    clearInterval(id)
};
export const start = (func) => {
    func();
    return setInterval(func, 1000)
};
