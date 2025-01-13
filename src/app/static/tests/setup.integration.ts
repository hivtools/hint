import axios from 'axios';

axios.defaults.adapter = "http";

(global as any).appUrl = "http://localhost:8080/";
(global as any).currentUser = "some.user@example.com";
(global as any).titleGlobal = "Naomi";
