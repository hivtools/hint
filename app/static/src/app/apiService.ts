import axios, {AxiosResponse} from "axios";
import {APIError} from "./types";

export class APIService {

    get<T>(url: string) {
        return axios.get(url)
            .then((response: AxiosResponse) => {
                const payload: T = response && response.data;
                return payload
            })
            .catch((e: { response: { data: APIError } }) => {
                this.handleError(e)
            })
    }

    post<T>(url: string, data: any) {
        return axios.post(url, data)
            .then((response: AxiosResponse) => {
                const payload: T = response && response.data;
                return payload
            })
            .catch((e: { response: { data: APIError } }) => {
               this.handleError(e)
            });
    }

    handleError = (e: { response: { data: APIError } }) => {
        const error = e.response.data;
        console.log(error);
        throw new Error(error.message)
    };

    doNothing = () => {}
}

export const api = new APIService();