import axios, {AxiosRequestConfig} from 'axios';
import {Service} from 'axios-middleware';

const FormData = require("form-data");

const service = new Service(axios);

export const login = async () => {
    const formData = new FormData();
    formData.append('username', "test.user@example.com");
    formData.append('password', "password");

    const res = await axios.post("http://localhost:8080/callback/",
        formData,
        {
            headers: formData.getHeaders(),
            maxRedirects: 0,
            validateStatus: (status) => status == 302
        });

    const cookie = res.headers["set-cookie"][0].split(";")[0];

    // Register middleware to pass the session cookie with all requests
    await service.register({
        onRequest(config: AxiosRequestConfig) {
            config.headers["Cookie"] = cookie;
            return config;
        }
    } as any);

};
