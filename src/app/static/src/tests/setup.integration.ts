import axios from 'axios';

axios.defaults.adapter = axios.getAdapter("http");

(global as any).appUrl = "http://localhost:8080/";
